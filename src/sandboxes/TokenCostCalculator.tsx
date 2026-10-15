import { useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

export default function TokenCostCalculator() {
  const [inputTokens, setInputTokens] = useState(50_000);
  const [outputTokens, setOutputTokens] = useState(300);
  const [inputPricePerM, setInputPricePerM] = useState(5); // Claude Opus, $5/1M input tokens
  const [outputPricePerM, setOutputPricePerM] = useState(25); // $25/1M output tokens

  const inputCost = (inputTokens / 1_000_000) * inputPricePerM;
  const outputCost = (outputTokens / 1_000_000) * outputPricePerM;
  const total = inputCost + outputCost;

  return (
    <div className="sandbox">
      <h4>Calculator — Token Cost per Task</h4>
      <Evidence
        kind="course"
        source="Day 1 slides, p.93 — Example Token Cost Calculation for Claude Opus"
        note='Slide task: "Summarize this McKinsey report into 3 bullet points" — ~50,000 input tokens, ~300 output tokens, Opus pricing → total ≈ $0.26. Defaults below reproduce it exactly; edit any field to see enterprise cost scale with usage.'
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" }}>
        <label>
          Input tokens: {inputTokens.toLocaleString()}
          <input type="range" min={100} max={200_000} step={100} value={inputTokens} onChange={(e) => setInputTokens(+e.target.value)} />
        </label>
        <label>
          Output tokens: {outputTokens.toLocaleString()}
          <input type="range" min={10} max={10_000} step={10} value={outputTokens} onChange={(e) => setOutputTokens(+e.target.value)} />
        </label>
        <label>
          Input price ($ / 1M tokens): {inputPricePerM}
          <input type="range" min={0.25} max={15} step={0.25} value={inputPricePerM} onChange={(e) => setInputPricePerM(+e.target.value)} />
        </label>
        <label>
          Output price ($ / 1M tokens): {outputPricePerM}
          <input type="range" min={1} max={75} step={1} value={outputPricePerM} onChange={(e) => setOutputPricePerM(+e.target.value)} />
        </label>
      </div>

      <Formula tex="\text{Total cost} = \frac{\text{input tokens}}{1{,}000{,}000} \times \text{input price} + \frac{\text{output tokens}}{1{,}000{,}000} \times \text{output price}" />

      <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Input cost</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>${inputCost.toFixed(4)}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Output cost</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>${outputCost.toFixed(4)}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Total per task</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>${total.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}
