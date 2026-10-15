import { useMemo, useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// A toy 8-token vocabulary with made-up logits, small enough to show the full
// softmax/top-k/top-p pipeline step by step instead of a 32,000-token real
// vocabulary where the mechanics would be invisible.
const VOCAB = ["the", "cat", "sat", "ran", "jumped", "sofa", "mat", "quickly"];
const DEFAULT_LOGITS = [4.2, 3.8, 3.1, 2.5, 2.0, 1.6, 1.2, 0.4];

function softmax(logits: number[], temperature: number): number[] {
  // Temperature divides logits before the exponential: higher T flattens the
  // distribution (more random), lower T sharpens it toward the top logit(s).
  const scaled = logits.map((z) => z / temperature);
  const max = Math.max(...scaled); // subtract max for numerical stability
  const exps = scaled.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function applyTopK(probs: number[], k: number): number[] {
  const sorted = [...probs].map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const keep = new Set(sorted.slice(0, k).map((x) => x.i));
  const masked = probs.map((p, i) => (keep.has(i) ? p : 0));
  const sum = masked.reduce((a, b) => a + b, 0);
  return masked.map((p) => (sum > 0 ? p / sum : 0)); // renormalize
}

function applyTopP(probs: number[], p: number): number[] {
  const sorted = [...probs].map((pr, i) => ({ pr, i })).sort((a, b) => b.pr - a.pr);
  let cumulative = 0;
  const keep = new Set<number>();
  for (const { pr, i } of sorted) {
    cumulative += pr;
    keep.add(i);
    if (cumulative >= p) break; // nucleus cutoff: smallest set covering mass >= p
  }
  const masked = probs.map((pr, i) => (keep.has(i) ? pr : 0));
  const sum = masked.reduce((a, b) => a + b, 0);
  return masked.map((pr) => (sum > 0 ? pr / sum : 0));
}

export default function SamplingMathSandbox() {
  const [temperature, setTemperature] = useState(1.0);
  const [topK, setTopK] = useState(8);
  const [topP, setTopP] = useState(1.0);

  const probs = useMemo(() => {
    const afterTemp = softmax(DEFAULT_LOGITS, temperature);
    const afterTopK = applyTopK(afterTemp, topK);
    const afterTopP = applyTopP(afterTopK, topP);
    return afterTopP;
  }, [temperature, topK, topP]);

  return (
    <div className="sandbox">
      <h4>Calculator — Temperature / Top-k / Top-p, the real softmax math</h4>
      <Evidence
        kind="external"
        source="Standard decoding math — not spelled out as formulas in Day 1 slides"
        note='The Day 1 slides explicitly defer this to "Module 1.2" and only show a conceptual p-value/k-value quadrant chart, not the literal equations. This calculator fills that gap with the actual temperature-scaled softmax, top-k truncation, and nucleus (top-p) sampling math over a toy 8-token vocabulary.'
      />

      <Formula tex="P(w_i) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}" caption="Temperature-scaled softmax over logits z, vocabulary token i." />

      <label style={{ display: "block", margin: "10px 0" }}>
        temperature T: {temperature.toFixed(2)}
        <input type="range" min={0.1} max={2} step={0.05} value={temperature} onChange={(e) => setTemperature(+e.target.value)} />
      </label>
      <label style={{ display: "block", margin: "10px 0" }}>
        top_k: {topK}
        <input type="range" min={1} max={VOCAB.length} step={1} value={topK} onChange={(e) => setTopK(+e.target.value)} />
      </label>
      <label style={{ display: "block", margin: "10px 0" }}>
        top_p (nucleus mass): {topP.toFixed(2)}
        <input type="range" min={0.1} max={1} step={0.05} value={topP} onChange={(e) => setTopP(+e.target.value)} />
      </label>

      <div style={{ marginTop: 16 }}>
        {VOCAB.map((tok, i) => (
          <div key={tok} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, fontSize: 13 }}>
            <code style={{ width: 70 }}>{tok}</code>
            <div style={{ flex: 1, background: "var(--border)", borderRadius: 4, height: 14, position: "relative" }}>
              <div
                style={{
                  width: `${probs[i] * 100}%`,
                  background: probs[i] > 0 ? "var(--accent-2)" : "transparent",
                  height: "100%",
                  borderRadius: 4,
                  transition: "width 0.15s ease",
                }}
              />
            </div>
            <span style={{ width: 48, textAlign: "right", color: "var(--text-dim)" }}>{(probs[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Try T→0.1: the distribution collapses onto "the". T→2: it flattens toward uniform. Lower
        top_k/top_p prunes the tail before renormalizing the remaining probabilities to sum to 1.
      </p>
    </div>
  );
}
