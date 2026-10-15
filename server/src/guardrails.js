// Deterministic, keyword-based filter. Runs before any model call, so a
// blocked message never spends Groq free-tier quota and the decision is
// never left to the LLM to police itself.
//
// Guardrail behavior is modular: the client picks a mode (see GUARDRAIL_MODES
// below) and this module decides, per mode, whether the course-topic scope
// check applies. The unsafe-content check always applies, in every mode.

const UNSAFE_PATTERNS = [
  /\b(make|build|create|construct)\s+(a\s+|an\s+)?[\w-]*\s?(pipe\s?bomb|bomb|explosive|nerve agent|chemical weapon)/i,
  /\bhow\s+to\s+(synthesize|manufacture)\s+(meth|heroin|fentanyl|sarin|ricin)/i,
  /\b(child|minor)\s+(sexual|porn|abuse)/i,
  /\bhow\s+to\s+(kill|murder|poison)\s+(someone|a person|my)/i,
  /\bhow\s+to\s+(hack|ddos)\b.*\b(bank|hospital|government|election)/i,
  /\bbuild\s+(a\s+)?(virus|ransomware|malware)\s+to\s+(infect|spread)/i,
];

// Keywords cover everything actually taught/built across Day 1-4, the
// Group Project, Model Training Evaluation, and the Cheatsheet pages.
const COURSE_TOPICS = [
  // Core LLM/course vocabulary
  "llm", "model", "fine-tun", "lora", "peft", "token", "embed", "rag",
  "retriev", "agent", "tool", "mcp", "smolagent", "prompt", "transformer",
  "attention", "quantiz", "rerank", "chunk", "chroma", "vector", "course",
  "day 1", "day 2", "day 3", "day 4", "flan", "qwen", "sea-lion", "cartpole",
  "q-learning", "reinforcement", "guardrail", "groq", "chat", "search",
  // Day 1: generation, multimodal, Hugging Face model selection
  "summariz", "multimodal", "generation", "temperature", "top_p", "top_k",
  "top-p", "top-k", "sampling", "chat template", "float", "precision",
  "fp32", "fp16", "bf16", "int8", "int4", "perplexity", "huggingface",
  "hugging face", "vram", "gpu", "memory", "licence", "license", "gated",
  "instruct", "checkpoint",
  // Day 2: fine-tuning & evaluation
  "dialogsum", "rouge", "bleu", "evaluat", "trainer", "training",
  "trainable", "adapter", "r=16", "scaling law", "chinchilla",
  // Day 3: RAG / loaders
  "loader", "bi-encoder", "cross-encoder", "cosine", "similarity",
  "epub", "pdf", "docx", "pipeline",
  // Day 4: agentic AI
  "pre-train", "pretrain", "routing", "workflow", "planning",
  "human-in-the-loop", "hitl", "orchestrator", "reflection", "context engineering",
  // Group project / model evaluation / tooling / build docs
  "group project", "dashboard", "leaderboard", "wandb", "weights & biases",
  "tensorboard", "ragas", "langsmith", "docker", "nginx", "express",
  "cheatsheet", "resource", "sandbox", "build", "deploy", "env", "api key",
];

// Each mode controls two independent things, wired up in server/src/index.js:
//   - scoped: whether checkGuardrails() enforces the COURSE_TOPICS keyword gate
//   - engine: which search tool (if any) the model is allowed to call
export const GUARDRAIL_MODES = [
  {
    id: "course",
    label: "Within course",
    scoped: true,
    engine: "none",
    description: "Topic-gated to this site's content. No web search tool offered — answers come from the model's own knowledge of what's on the site.",
  },
  {
    id: "ddgs",
    label: "DDGS search",
    scoped: true,
    engine: "ddgs",
    description: "Topic-gated to this site's content, but the model may call a free, keyless DuckDuckGo (ddgs) search tool to support an in-scope answer (e.g. a current benchmark number).",
  },
  {
    id: "google",
    label: "Google search",
    scoped: true,
    engine: "google",
    description: "Same topic gate as DDGS mode, but search results come from the Google Custom Search JSON API instead — needs GOOGLE_API_KEY + GOOGLE_CSE_ID configured on the server.",
  },
  {
    id: "full",
    label: "Full access",
    scoped: false,
    engine: "ddgs",
    description: "No topic restriction — the assistant becomes a general-purpose web assistant. The unsafe-content filter still always applies. Use for demoing/debugging, not the default.",
  },
];

const MODES_BY_ID = new Map(GUARDRAIL_MODES.map((m) => [m.id, m]));
const DEFAULT_MODE_ID = "course";

export function resolveGuardrailMode(modeId) {
  return MODES_BY_ID.get(modeId) ?? MODES_BY_ID.get(DEFAULT_MODE_ID);
}

export function checkGuardrails(message, modeId) {
  const text = String(message || "");

  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: "This request matches a blocked safety pattern." };
    }
  }

  const mode = resolveGuardrailMode(modeId);
  if (mode.scoped) {
    const lower = text.toLowerCase();
    const onTopic = COURSE_TOPICS.some((kw) => lower.includes(kw));
    if (!onTopic) {
      return {
        blocked: true,
        reason: `This assistant is in "${mode.label}" mode, scoped to this course site's content (Day 1-4 workshops, the Group Project, Model Training Evaluation, Cheatsheet). Ask something related to what's on the site, or switch to "Full access" mode.`,
      };
    }
  }

  return { blocked: false };
}
