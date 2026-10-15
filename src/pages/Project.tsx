const FEATURES = [
  {
    area: "Day 1 — Summarization & Multimodal",
    detail: "Sandboxes: Summarization, Chat Template, Sampling Math, Perplexity, Token Cost, Float Precision, ROUGE/BLEU calculators.",
  },
  {
    area: "Day 2 — LoRA Fine-tuning",
    detail: "Sandboxes: LoRA adapter math, Scaling Law explorer, Embedding Similarity calculator.",
  },
  {
    area: "Day 3 — Document Loaders & RAG",
    detail: "Sandboxes: Chunking strategy, RAG pipeline walk-through, Rerank comparison.",
  },
  {
    area: "Day 4 — Pre-training & Agentic AI",
    detail: "Sandboxes: Pre-train loss curves, CartPole (Q-learning), Tool-use loop, Tool building, Routing, Workflow pattern.",
  },
];

const ARCHITECTURE = [
  {
    name: "Frontend",
    detail: "React 19 + Vite + TypeScript. Sidebar-navigated pages per day plus 18 interactive sandboxes (KaTeX math, Recharts plots, live calculators) built from the actual workshop content.",
  },
  {
    name: "AI search bar",
    detail: "Top search bar (not a chat bubble) wired to a Groq-hosted open model (GPT-OSS 20B/120B, Qwen3). The model has a web_search tool it can call for current-events questions; results are fetched server-side from DuckDuckGo and folded back in as context.",
  },
  {
    name: "Guardrails",
    detail: "Modular — a dropdown next to the search bar picks between 4 modes (Within course, DDGS search, Google search, Full access), each independently controlling the topic scope and which search engine the model can call.",
  },
  {
    name: "Backend",
    detail: "Express server proxies chat/model/search requests to Groq, enforces guardrails and rate limiting, and keeps the Groq API key off the client.",
  },
  {
    name: "Deployment",
    detail: "Docker Compose: an nginx container serves the built frontend on :8080 and reverse-proxies /api/* to the Express container on :3001. The server container trusts the network's TLS-inspecting gateway CA so outbound calls to Groq/DuckDuckGo work from inside Docker.",
  },
];

export default function Project() {
  return (
    <div>
      <h1>Group Project — Group 7</h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 4 }}>
        This website <em>is</em> the group project: an interactive companion site for the course,
        covering all four workshop days with live sandboxes, plus a built-in AI search assistant
        with web search and guardrails — containerized and deployed with Docker.
      </p>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
        <strong>Members:</strong> Goh Kok Boon · Ravikkumar Vignesh Kumar · Yap Wen Lai
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What we built</h2>
        <p>
          Instead of a one-off notebook, Group 7 built a deployable product: a course-notes site
          where every workshop concept (pre-training, LoRA fine-tuning, RAG, agentic AI) gets its
          own runnable, hand-built sandbox, backed by a real client/server architecture with its own
          AI assistant — not a static write-up.
        </p>
      </div>

      <h2>Architecture</h2>
      <table className="table">
        <thead><tr><th>Layer</th><th>What it does</th></tr></thead>
        <tbody>
          {ARCHITECTURE.map((a) => (
            <tr key={a.name}>
              <td><strong>{a.name}</strong></td>
              <td style={{ fontSize: 13 }}>{a.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Course content, as working sandboxes</h2>
      <table className="table">
        <thead><tr><th>Day</th><th>What's live on the site</th></tr></thead>
        <tbody>
          {FEATURES.map((f) => (
            <tr key={f.area}>
              <td><strong>{f.area}</strong></td>
              <td style={{ fontSize: 13 }}>{f.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>The AI search bar</h2>
      <p>
        The top search bar sends your question to a Groq-hosted model. A second dropdown next to
        the model picker chooses the guardrail mode: <strong>Within course</strong> (topic-gated,
        no web search), <strong>DDGS search</strong> or <strong>Google search</strong> (topic-gated,
        plus a <code>web_search</code> tool using that engine), or <strong>Full access</strong>{" "}
        (no topic restriction). Whichever engine is active, results are fed back to the model and
        it writes its answer grounded in them, with source links shown under the reply. A separate,
        always-on unsafe-content filter blocks dangerous queries before any model call, in every
        mode.
      </p>

      <h2>What to show in the demo</h2>
      <ul className="link-list">
        <li>Walk through the sidebar: each day's page and at least one sandbox per day actually running.</li>
        <li>Ask the search bar a current-events question — show it calling <code>web_search</code> and citing sources.</li>
        <li>Ask the search bar a question that should get blocked — show the guardrail firing.</li>
        <li><code>docker compose up --build</code> from a clean checkout, showing the whole stack (nginx + Express) come up and serve traffic on port 8080.</li>
        <li>A rough edge you hit and fixed (e.g. the corporate TLS-inspection gateway needing its CA trusted inside the server container) — this is worth more in grading than a flawless happy path.</li>
      </ul>
    </div>
  );
}
