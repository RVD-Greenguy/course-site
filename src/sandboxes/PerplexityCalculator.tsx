import { useMemo, useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

const DEFAULT_PROBS = [0.8, 0.6, 0.9, 0.4, 0.7];

export default function PerplexityCalculator() {
  const [probs, setProbs] = useState<number[]>(DEFAULT_PROBS);

  const result = useMemo(() => {
    const n = probs.length;
    // Perplexity via the inverse-geometric-average form:
    // PP(w) = P(w_1...w_N)^(-1/N) == exp(-1/N * sum(log p_i))
    // This is algebraically identical to the entropy form PP = 2^H(p) and to
    // the chained conditional-probability form PP_T shown on the Day 2 slides
    // (same quantity, three equivalent derivations).
    const logSum = probs.reduce((acc, p) => acc + Math.log(Math.max(p, 1e-9)), 0);
    const avgNegLogLikelihood = -logSum / n; // this IS the cross-entropy H
    const perplexity = Math.exp(avgNegLogLikelihood);
    return { perplexity, crossEntropy: avgNegLogLikelihood };
  }, [probs]);

  const setProb = (i: number, v: number) => {
    const next = [...probs];
    next[i] = v;
    setProbs(next);
  };

  return (
    <div className="sandbox">
      <h4>Calculator — Perplexity, computed live</h4>
      <Evidence
        kind="course"
        source="Day 2 slides — Perplexity (3 equivalent formulas)"
        note="PP = b^(-1/N)·Σlog_b p(w_i)  ≡  PP(p) = 2^H(p)  ≡  PP(w) = P(w_1...w_N)^(-1/N). Lower perplexity = the model assigned higher probability to the actual next tokens, i.e. a better fit — but low perplexity doesn't guarantee the output is factually correct."
      />

      <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
        Each slider is the probability the model assigned to the <em>actual</em> next token at that
        position in a sequence (a model that's "surprised" less often has lower perplexity).
      </p>

      {probs.map((p, i) => (
        <label key={i} style={{ display: "block", margin: "8px 0", fontSize: 13 }}>
          p(w_{i + 1}) = {p.toFixed(2)}
          <input type="range" min={0.01} max={0.99} step={0.01} value={p} onChange={(e) => setProb(i, +e.target.value)} />
        </label>
      ))}

      <Formula
        tex="\mathrm{PP}(w) = P(w_1 w_2 \ldots w_N)^{-\frac{1}{N}} = \exp\left(-\frac{1}{N}\sum_{i=1}^{N}\log p(w_i)\right)"
      />

      <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Cross-entropy H (nats)</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{result.crossEntropy.toFixed(3)}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Perplexity = e^H</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>{result.perplexity.toFixed(3)}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Try dragging all sliders to ~0.95: perplexity drops toward 1 (model essentially certain of
        every token). Drag them toward 0.1: perplexity rises sharply — same shape as the slides'
        "low training-perplexity but high validation-perplexity signals overfitting" warning.
      </p>
    </div>
  );
}
