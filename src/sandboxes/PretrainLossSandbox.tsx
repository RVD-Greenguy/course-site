import { useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// Toy 4-token vocabulary so the cross-entropy next-token-prediction loss
// (the actual pre-training objective) is small enough to inspect by hand.
const VOCAB = ["cat", "dog", "fish", "bird"];
const TRUE_TOKEN_INDEX = 0; // pretend "cat" is the correct next token

export default function PretrainLossSandbox() {
  const [probs, setProbs] = useState([0.6, 0.2, 0.1, 0.1]);

  const setProb = (i: number, v: number) => {
    const next = [...probs];
    next[i] = v;
    const restSum = next.reduce((a, b, j) => (j === i ? a : a + b), 0);
    // Renormalize the other 3 probabilities so the vector still sums to 1 —
    // keeps this an honest probability distribution as the slider moves.
    if (restSum > 0) {
      const scale = (1 - v) / restSum;
      for (let j = 0; j < next.length; j++) if (j !== i) next[j] *= scale;
    }
    setProbs(next);
  };

  const pTrue = probs[TRUE_TOKEN_INDEX];
  const loss = -Math.log(Math.max(pTrue, 1e-9));

  return (
    <div className="sandbox">
      <h4>Calculator — Pre-training's Actual Loss Function (Cross-Entropy)</h4>
      <Evidence
        kind="external"
        source="Standard next-token-prediction loss — not in Day 4 slides"
        note="The Day 4 deck has zero loss-function formulas anywhere in its Building-your-own-LLMs: Pre-Training module (pp.4-10) — it is entirely conceptual (decision trees, model-size bubble charts). This is the actual training objective every pre-trained LLM (including SEA-LION, the slide's own case study) minimizes at every token."
      />

      <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
        Model is predicting the next token after some context; the true next token is{" "}
        <strong>"{VOCAB[TRUE_TOKEN_INDEX]}"</strong>. Drag its probability — the other three
        renormalize automatically to keep the distribution valid.
      </p>

      {VOCAB.map((tok, i) => (
        <label key={tok} style={{ display: "block", margin: "8px 0", fontSize: 13 }}>
          p("{tok}"){i === TRUE_TOKEN_INDEX ? " ← correct token" : ""} = {probs[i].toFixed(2)}
          <input type="range" min={0.01} max={0.97} step={0.01} value={probs[i]} onChange={(e) => setProb(i, +e.target.value)} />
        </label>
      ))}

      <Formula
        tex="\mathcal{L} = -\log p_{\theta}(w_t \mid w_{<t})"
        caption="Cross-entropy / negative log-likelihood of the true next token under the model's predicted distribution. Averaged over every token in the training corpus — this average IS the perplexity exponent from Day 2."
      />

      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>Loss = {loss.toFixed(3)} nats</div>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Drag p("cat") near 1.0: loss → 0 (model was confident and correct). Drag it toward 0: loss
        rockets upward — this is exactly the gradient signal that updates all N parameters during
        pre-training on D tokens of raw text (see the Chinchilla scaling calculator above for how N
        and D trade off against this same loss).
      </p>
    </div>
  );
}
