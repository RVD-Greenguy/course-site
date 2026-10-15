import { Link } from "react-router-dom";

const modules = [
  { to: "/day/1", title: "Day 1 — Summarization & Multimodal", desc: "FLAN-T5 zero-shot summarization, generation config, Qwen3-VL image-text-to-text, chat templates." },
  { to: "/day/2", title: "Day 2 — Fine-tuning (LoRA / PEFT)", desc: "LoRA adapters on flan-t5-base, trainable-param efficiency, ROUGE/BLEU evaluation." },
  { to: "/day/3", title: "Day 3 — Document Loaders & RAG", desc: "LangChain loaders, chunking, ChromaDB, bi-encoder retrieval + cross-encoder reranking." },
  { to: "/day/4", title: "Day 4 — Pre-training & Agentic AI", desc: "Pre-training vs fine-tuning, SEA-LION, agent components, Anthropic's 5 workflow patterns, MCP." },
];

const stack = ["Transformers", "PEFT", "LangChain", "ChromaDB", "Anthropic SDK", "OpenAI Agents SDK"];

export default function Overview() {
  return (
    <div>
      <h1>Custom Generative AI Systems for Enterprises</h1>
      <p style={{ color: "var(--text-dim)", maxWidth: 640, marginBottom: 4 }}>
        NUS-ISS course companion — real notebook content, annotated code, and interactive sandboxes
        for all four workshop days.
      </p>
      <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
        <strong>Group 7:</strong> Goh Kok Boon · Ravikkumar Vignesh Kumar · Yap Wen Lai
      </p>
      <div className="pill-row">
        {stack.map((s) => (
          <span key={s} className="badge">{s}</span>
        ))}
      </div>
      <div className="module-grid">
        {modules.map((m) => (
          <Link key={m.to} to={m.to} className="module-card">
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </Link>
        ))}
      </div>
      <div className="card">
        <strong>About this site</strong>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          This is a reference/study companion, not a notebook execution environment — the "sandboxes"
          are client-side simulations that visually demonstrate each day's concepts using the real
          parameters and output numbers captured from the course notebooks, rather than live model
          inference in the browser.
        </p>
      </div>
    </div>
  );
}
