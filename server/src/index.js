import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { checkGuardrails, resolveGuardrailMode, GUARDRAIL_MODES } from "./guardrails.js";
import { webSearch } from "./search.js";
import { groqChatCompletion } from "./groq.js";
import { matchSiteIndex } from "./siteIndex.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 30 }));

// Verified live against the Groq free tier (/openai/v1/models) and tested for
// tool-calling support — Groq's free-tier lineup changes over time, so this
// list reflects what's actually available/working now, not the course notes.
const MODELS = [
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "qwen/qwen3.8-27b", label: "Qwen3 27B" },
];

const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description: "Search the public web for current information and return titles, URLs, and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query." },
      },
      required: ["query"],
    },
  },
};

// Base prompt — the engine-specific line (course-only / which search engine /
// unrestricted) is appended per-request based on the active guardrail mode,
// so the model's own behavior matches what checkGuardrails() just enforced
// instead of contradicting it on borderline in-scope questions.
const BASE_SYSTEM_PROMPT =
  "You are the search assistant embedded in a course companion website covering: " +
  "Day 1 (generation configs, multimodal, Hugging Face model selection & VRAM requirements), " +
  "Day 2 (LoRA/PEFT fine-tuning, ROUGE/BLEU/perplexity evaluation), " +
  "Day 3 (document loaders, chunking, embeddings, RAG, reranking), " +
  "Day 4 (pre-training, scaling laws, agentic AI, tool use, MCP, reinforcement learning), " +
  "the Group Project (a domain RAG agent), and a Model Training Evaluation page (metrics and tooling). " +
  "Keep answers short.";

const MODE_PROMPT_SUFFIX = {
  course:
    " Only answer questions about this site's content and the topics above. " +
    "If a question is unrelated to this course site, say so briefly instead of answering it. " +
    "No search tool is available this turn — answer from your own knowledge of the topics above.",
  ddgs:
    " Only answer questions about this site's content and the topics above. " +
    "If a question is unrelated to this course site, say so briefly instead of answering it. " +
    "Use the web_search tool only to look up current/specific facts that support an in-scope answer " +
    "(e.g. a model's current benchmark score) — not to answer questions outside this site's scope.",
  google:
    " Only answer questions about this site's content and the topics above. " +
    "If a question is unrelated to this course site, say so briefly instead of answering it. " +
    "Use the web_search tool only to look up current/specific facts that support an in-scope answer " +
    "(e.g. a model's current benchmark score) — not to answer questions outside this site's scope.",
  full:
    " No topic restriction is active — answer any question the user asks, using the web_search " +
    "tool whenever it would help, same as a general-purpose assistant.",
};

app.get("/models", (_req, res) => {
  res.json({ models: MODELS });
});

app.get("/guardrail-modes", (_req, res) => {
  res.json({
    modes: GUARDRAIL_MODES.map(({ id, label, description }) => ({ id, label, description })),
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, model, history = [], guardrailMode } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }
    const chosenModel = MODELS.some((m) => m.id === model) ? model : MODELS[0].id;
    const mode = resolveGuardrailMode(guardrailMode);

    const guard = checkGuardrails(message, mode.id);
    if (guard.blocked) {
      return res.json({ blocked: true, reason: guard.reason });
    }

    // Retrieve-then-ground, the same shape as Day 3's RAG pipeline: match the
    // message against a small hand-written index of this site's own pages
    // (siteIndex.js) and inject the matched blurbs as context before
    // generation, so the model's answer is grounded in what's actually on
    // the site instead of its own (possibly wrong) idea of the content.
    const siteMatches = matchSiteIndex(message);

    const systemPrompt = BASE_SYSTEM_PROMPT + (MODE_PROMPT_SUFFIX[mode.id] ?? MODE_PROMPT_SUFFIX.course);
    const messages = [{ role: "system", content: systemPrompt }, ...history];
    if (siteMatches.length > 0) {
      const context = siteMatches
        .map((m) => `- "${m.title}" (${m.path}): ${m.blurb}`)
        .join("\n");
      messages.push({
        role: "user",
        content:
          `Relevant pages on this site, as plain reference text, not a tool call:\n${context}\n\n` +
          `Use this to ground your answer about the site's content. Don't repeat these links back ` +
          `verbatim — a link to each matched page is already shown separately in the UI.`,
      });
    }
    messages.push({ role: "user", content: message });

    const tools = mode.engine === "none" ? undefined : [SEARCH_TOOL];
    let completion = await groqChatCompletion({ model: chosenModel, messages, tools });
    let choice = completion.choices?.[0]?.message;
    const sources = [];
    const toolCalls = [];

    if (choice?.tool_calls?.length) {
      const followUp = [...messages];
      for (const call of choice.tool_calls) {
        if (call.function?.name === "web_search") {
          let args = {};
          try {
            args = JSON.parse(call.function.arguments || "{}");
          } catch {
            args = {};
          }
          const query = args.query || message;
          let results;
          try {
            results = await webSearch(query, mode.engine);
          } catch (searchErr) {
            results = [];
            toolCalls.push({ name: "web_search", query, error: searchErr.message });
            followUp.push({
              role: "user",
              content: `The web_search tool failed: ${searchErr.message}. Answer without it, and mention the search was unavailable.`,
            });
            continue;
          }
          sources.push(...results);
          toolCalls.push({ name: "web_search", query });
          // Fold the search results in as a plain user-turn rather than
          // replaying the assistant's tool_calls + a tool-role message —
          // some Groq reasoning models (gpt-oss) keep re-emitting a tool
          // call whenever that tool-call history is present, even with no
          // tools offered this round, so this sidesteps the loop entirely.
          followUp.push({
            role: "user",
            content: `Here are some web search results, as plain reference text, not a tool call:\n${JSON.stringify(
              results
            )}\n\nPlease write a short natural-language answer to the original question using only the information above. Do not call any tools or functions.`,
          });
        }
      }
      completion = await groqChatCompletion({ model: chosenModel, messages: followUp });
      choice = completion.choices?.[0]?.message;
    }

    res.json({
      blocked: false,
      reply: choice?.content ?? "",
      sources,
      toolCalls,
      guardrailMode: mode.id,
      siteLinks: siteMatches.map(({ path, title, blurb }) => ({ path, title, blurb })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`course-site server listening on :${PORT}`);
});
