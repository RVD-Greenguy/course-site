import { useState } from "react";

// Canned outputs keyed by a coarse "randomness" bucket so the sliders visibly
// change the output without needing a real model in the browser.
const OUTPUTS: Record<string, string> = {
  low: "Two roads diverged in a wood; the speaker chose the less traveled one.",
  medium: "The poem reflects on a choice between two paths in a wood, with the speaker taking the less-traveled road and reflecting on how that choice shaped their life.",
  high: "diverging paths wood traveler wondering sigh ages hence difference road less path chosen regret reflection yellow undergrowth grassy wear",
};

function bucket(temperature: number, topP: number, topK: number): keyof typeof OUTPUTS {
  const randomness = temperature * 0.5 + (1 - topP) * 0.3 + (1 - topK / 100) * 0.2;
  if (randomness < 0.25) return "low";
  if (randomness < 0.55) return "medium";
  return "high";
}

export default function SummarizationSandbox() {
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(50);

  const key = bucket(temperature, topP, topK);

  return (
    <div className="sandbox">
      <h4>Sandbox — Generation Config Simulator</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Adjust the sliders to see how temperature/top-p/top-k shift FLAN-T5's summary from
        conservative to chaotic. (Illustrative — not a live model call.)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "16px 0" }}>
        <label>
          temperature: {temperature.toFixed(2)}
          <input type="range" min={0} max={1.5} step={0.05} value={temperature} onChange={(e) => setTemperature(+e.target.value)} />
        </label>
        <label>
          top_p: {topP.toFixed(2)}
          <input type="range" min={0.1} max={1} step={0.05} value={topP} onChange={(e) => setTopP(+e.target.value)} />
        </label>
        <label>
          top_k: {topK}
          <input type="range" min={1} max={100} step={1} value={topK} onChange={(e) => setTopK(+e.target.value)} />
        </label>
      </div>
      <div className="card" style={{ background: "var(--code-bg)" }}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>
          Simulated summary ({key} randomness)
        </div>
        {OUTPUTS[key]}
      </div>
    </div>
  );
}
