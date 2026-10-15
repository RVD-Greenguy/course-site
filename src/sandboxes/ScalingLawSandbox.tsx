import { useMemo, useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// Published Chinchilla scaling-law constants (Hoffmann et al. 2022, Table 2 in
// the paper's approach 3 fit) — these are NOT in the Day 4 slides (which only
// show the resulting N/D table, p.82), so this is explicitly external.
const E = 1.69; // irreducible loss (entropy of natural text)
const A = 406.4;
const B = 410.7;
const ALPHA = 0.34;
const BETA = 0.28;

function chinchillaLoss(nParamsB: number, dTokensB: number): number {
  const n = nParamsB * 1e9;
  const d = dTokensB * 1e9;
  return E + A / Math.pow(n, ALPHA) + B / Math.pow(d, BETA);
}

export default function ScalingLawSandbox() {
  const [nParamsB, setNParamsB] = useState(70); // billions of params, e.g. Chinchilla itself
  const [dTokensB, setDTokensB] = useState(1400); // billions of tokens

  const loss = useMemo(() => chinchillaLoss(nParamsB, dTokensB), [nParamsB, dTokensB]);
  const ratio = (dTokensB / nParamsB).toFixed(1);

  return (
    <div className="sandbox">
      <h4>Calculator — Chinchilla Scaling Law (pre-training loss vs. compute allocation)</h4>
      <Evidence
        kind="external"
        source="Hoffmann et al. 2022, 'Training Compute-Optimal Large Language Models' — not in Day 4 slides as a formula"
        note="The Day 4 slides (p.82) show only the resulting N/D table (e.g. Chinchilla 70B params trained on 1.4T tokens, ratio ~20x) — never the underlying loss equation. This reconstructs the real published formula so you can see WHY ~20x tokens-per-parameter is the compute-optimal ratio, not just the table."
      />

      <label style={{ display: "block", margin: "10px 0" }}>
        Model size N (billions of params): {nParamsB}
        <input type="range" min={1} max={200} step={1} value={nParamsB} onChange={(e) => setNParamsB(+e.target.value)} />
      </label>
      <label style={{ display: "block", margin: "10px 0" }}>
        Training tokens D (billions): {dTokensB}
        <input type="range" min={10} max={4000} step={10} value={dTokensB} onChange={(e) => setDTokensB(+e.target.value)} />
      </label>

      <Formula
        tex="L(N,D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}"
        caption="E = irreducible entropy of text (~1.69 nats); A/N^α = model-size-limited loss; B/D^β = data-limited loss. Fitted constants from Chinchilla's 400+ training runs: α≈0.34, β≈0.28."
      />

      <div style={{ display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>D/N ratio</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{ratio}x</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Predicted loss L(N,D)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>{loss.toFixed(4)} nats</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Set N=70, D=1400 (the slide's Chinchilla row, ratio 20x) and compare against N=175, D=300
        (the slide's GPT-3 row, ratio ~1.7x, badly under-trained on data relative to its size) — GPT-3
        pays a higher loss for the same total compute budget because it over-invested in parameters.
      </p>
    </div>
  );
}
