import { useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}
function magnitude(a: number[]): number {
  return Math.sqrt(dot(a, a));
}
function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dot(a, b) / denom;
}
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - b[i]) ** 2, 0));
}

const DIMS = 3;

export default function EmbeddingSimilarityCalculator() {
  const [a, setA] = useState([0.8, 0.5, 0.1]);
  const [b, setB] = useState([0.6, 0.7, 0.2]);

  const setComponent = (vec: "a" | "b", i: number, v: number) => {
    const target = vec === "a" ? [...a] : [...b];
    target[i] = v;
    (vec === "a" ? setA : setB)(target);
  };

  const cos = cosineSimilarity(a, b);
  const dotProd = dot(a, b);
  const dist = euclideanDistance(a, b);

  return (
    <div className="sandbox">
      <h4>Calculator — Vector Similarity (ChromaDB's actual retrieval math)</h4>
      <Evidence
        kind="external"
        source="Standard vector-search math — not covered in Day 3 slides or notebooks"
        note="The Day 3 slides (111 pages) and both notebooks (day03-loaders-blank, day03-rag-blank) never show the cosine-similarity/distance formula that ChromaDB actually uses under the hood to rank retrieved chunks — they only show conceptual chunking diagrams. This fills that gap: ChromaDB's default distance metric for most embedding functions (incl. BAAI/bge-small-en-v1.5) is cosine similarity."
      />

      <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
        Edit two toy 3-dimensional "embeddings" (real bge-small-en-v1.5 vectors are 384-dimensional —
        shrunk here so you can see every component) and watch the retrieval math recompute.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, margin: "14px 0" }}>
        {(["a", "b"] as const).map((label) => (
          <div key={label}>
            <strong>Vector {label.toUpperCase()} (e.g. {label === "a" ? "query" : "document chunk"})</strong>
            {Array.from({ length: DIMS }).map((_, i) => (
              <label key={i} style={{ display: "block", fontSize: 12, margin: "6px 0" }}>
                dim {i}: {(label === "a" ? a : b)[i].toFixed(2)}
                <input
                  type="range" min={-1} max={1} step={0.05}
                  value={(label === "a" ? a : b)[i]}
                  onChange={(e) => setComponent(label, i, +e.target.value)}
                />
              </label>
            ))}
          </div>
        ))}
      </div>

      <Formula
        tex="\cos(\theta) = \frac{A \cdot B}{\|A\|\,\|B\|} = \frac{\sum_i A_i B_i}{\sqrt{\sum_i A_i^2}\sqrt{\sum_i B_i^2}}"
        caption="ChromaDB ranks chunks by this score when the embedding function's default space is cosine — 1.0 means identical direction, 0 means orthogonal/unrelated, -1 means opposite."
      />

      <div style={{ display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Dot product A·B</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{dotProd.toFixed(3)}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Cosine similarity</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>{cos.toFixed(3)}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Euclidean distance ‖A-B‖</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{dist.toFixed(3)}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Make the two vectors identical: cosine → 1.0, distance → 0. Flip one dimension's sign to drag
        cosine toward 0 or negative — this is literally what "nearest neighbor search" ranks on.
      </p>
    </div>
  );
}
