import { useMemo, useState } from "react";

// Small fixed corpus (from "A Christmas Carol", the real book used in day03 RAG notebook)
const CORPUS = [
  { id: 1, text: "Marley was dead, to begin with. Old Marley was as dead as a door-nail.", biEncoderScore: 0.71 },
  { id: 2, text: "Scrooge never painted out Old Marley's name. There it stood, years afterwards, above the warehouse door: Scrooge and Marley.", biEncoderScore: 0.68 },
  { id: 3, text: "Oh! But he was a tight-fisted hand at the grindstone, Scrooge! a squeezing, wrenching, grasping, scraping, clutching, covetous old sinner!", biEncoderScore: 0.64 },
  { id: 4, text: "'Christmas a humbug, uncle!' said Scrooge's nephew. 'You don't mean that, I am sure.'", biEncoderScore: 0.59 },
  { id: 5, text: "The Ghost of Christmas Past was a strange figure, like a child, yet not so like a child as an old man.", biEncoderScore: 0.52 },
];

function mockCrossEncoderScore(query: string, text: string): number {
  const qWords = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
  const tWords = text.toLowerCase().split(/\W+/).filter(Boolean);
  const overlap = tWords.filter((w) => qWords.has(w)).length;
  return Math.min(1, overlap / Math.max(3, qWords.size) + Math.random() * 0.05);
}

export default function RerankSandbox() {
  const [query, setQuery] = useState("Who is Scrooge?");

  const biEncoderTop = useMemo(
    () => [...CORPUS].sort((a, b) => b.biEncoderScore - a.biEncoderScore),
    []
  );

  const reranked = useMemo(() => {
    return biEncoderTop
      .map((doc) => ({ ...doc, crossScore: mockCrossEncoderScore(query, doc.text) }))
      .sort((a, b) => b.crossScore - a.crossScore);
  }, [query, biEncoderTop]);

  return (
    <div className="sandbox">
      <h4>Sandbox — Bi-Encoder Retrieval + Cross-Encoder Rerank</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Fixed 5-sentence corpus from "A Christmas Carol" (the book used in the real RAG workshop).
        Type a question to see the bi-encoder's initial order vs the cross-encoder's reranked order
        (mock scoring — real pipeline uses <code>BAAI/bge-small-en-v1.5</code> +{" "}
        <code>cross-encoder/ms-marco-MiniLM-L-6-v2</code>).
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--code-bg)", color: "var(--text)", marginBottom: 16 }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, textTransform: "uppercase" }}>
            Stage 1: Bi-encoder retrieval order
          </div>
          {biEncoderTop.map((d) => (
            <div key={d.id} style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <strong>{d.biEncoderScore.toFixed(2)}</strong> — {d.text}
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--accent-2)", marginBottom: 6, textTransform: "uppercase" }}>
            Stage 2: Cross-encoder reranked order
          </div>
          {reranked.map((d) => (
            <div key={d.id} style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <strong style={{ color: "var(--accent-2)" }}>{d.crossScore.toFixed(2)}</strong> — {d.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
