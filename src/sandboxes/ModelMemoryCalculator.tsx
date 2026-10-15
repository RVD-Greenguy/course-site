import { useMemo, useState } from "react";
import Evidence from "../components/Evidence";

type Precision = "fp32" | "fp16" | "bf16" | "int8" | "int4";
type Mode = "inference" | "lora" | "full";

const BYTES_PER_PARAM: Record<Precision, number> = {
  fp32: 4,
  fp16: 2,
  bf16: 2,
  int8: 1,
  int4: 0.5,
};

const GPUS = [
  { name: "RTX 3060 / 4060 (consumer)", vramGb: 12 },
  { name: "T4 (free-tier cloud)", vramGb: 16 },
  { name: "RTX 3090 / 4090 (consumer)", vramGb: 24 },
  { name: "A10 / L4 (cloud)", vramGb: 24 },
  { name: "A100 40GB", vramGb: 40 },
  { name: "A100 / H100 80GB", vramGb: 80 },
];

const PRESETS = [
  { label: "flan-t5-base (250M)", paramsB: 0.25 },
  { label: "flan-t5-xl (3B)", paramsB: 3 },
  { label: "Qwen3-VL-2B", paramsB: 2 },
  { label: "Mistral-7B / Llama-3.1-8B", paramsB: 8 },
  { label: "GPT-OSS-20B", paramsB: 20 },
  { label: "Llama-3.1-70B", paramsB: 70 },
];

// Standard rules of thumb (Hugging Face "Model Memory Usage" blog, EleutherAI
// cost-of-training notes) — not exact, but the right order of magnitude for
// deciding "will this fit on my GPU" before you load anything.
function estimateMemoryGb(paramsB: number, precision: Precision, mode: Mode) {
  const params = paramsB * 1e9;
  const weightBytes = params * BYTES_PER_PARAM[precision];

  if (mode === "inference") {
    // + ~20% overhead for activations/KV-cache at modest batch size/seq length.
    return (weightBytes * 1.2) / 1e9;
  }

  if (mode === "full") {
    // Mixed-precision Adam: fp16 weights (2B) + fp16 grads (2B) + fp32 master
    // weights (4B) + fp32 Adam m & v (8B) = 16 bytes/param, independent of the
    // chosen inference precision (training always needs fp32 optimizer state).
    const trainingBytes = params * 16;
    return (trainingBytes * 1.2) / 1e9;
  }

  // LoRA: base model stays frozen at the chosen precision (no grads/optimizer
  // for it); only a small adapter fraction (~0.5% of params, matching the
  // Day 2 workshop's r=16 → 0.71% figure) needs fp32 grads + Adam states.
  const adapterParams = params * 0.005;
  const adapterTrainingBytes = adapterParams * 16;
  return ((weightBytes + adapterTrainingBytes) * 1.2) / 1e9;
}

export default function ModelMemoryCalculator() {
  const [paramsB, setParamsB] = useState(8);
  const [precision, setPrecision] = useState<Precision>("bf16");
  const [mode, setMode] = useState<Mode>("inference");

  const totalGb = useMemo(() => estimateMemoryGb(paramsB, precision, mode), [paramsB, precision, mode]);

  return (
    <div className="sandbox">
      <h4>Calculator — Will This Model Fit? (VRAM requirement estimator)</h4>
      <Evidence
        kind="external"
        source="Standard rules of thumb — Hugging Face 'Model Memory Usage' + EleutherAI training-cost notes, not in the course slides"
        note="Inference ≈ bytes-per-param × param count (+20% for activations/KV-cache). Full fine-tuning with Adam needs ~16 bytes/param regardless of inference precision (fp16/bf16 weights + grads + fp32 master weights + fp32 optimizer momentum/variance). LoRA keeps the frozen base at inference cost and only pays the 16 bytes/param rate on the small trainable adapter slice — this is why LoRA fits on GPUs full fine-tuning can't touch."
      />

      <div className="pill-row">
        {PRESETS.map((p) => (
          <button key={p.label} className={p.paramsB === paramsB ? "active" : ""} onClick={() => setParamsB(p.paramsB)}>
            {p.label}
          </button>
        ))}
      </div>

      <label style={{ display: "block", margin: "10px 0" }}>
        Model size — {paramsB} B params
        <input type="range" min={0.1} max={100} step={0.1} value={paramsB} onChange={(e) => setParamsB(+e.target.value)} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" }}>
        <label>
          Weight precision
          <select value={precision} onChange={(e) => setPrecision(e.target.value as Precision)}>
            <option value="fp32">FP32 (4 bytes/param)</option>
            <option value="bf16">BF16 (2 bytes/param)</option>
            <option value="fp16">FP16 (2 bytes/param)</option>
            <option value="int8">INT8 quantized (1 byte/param)</option>
            <option value="int4">INT4 quantized (0.5 byte/param)</option>
          </select>
        </label>
        <label>
          What are you doing?
          <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="inference">Inference only</option>
            <option value="lora">LoRA fine-tuning</option>
            <option value="full">Full fine-tuning</option>
          </select>
        </label>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Estimated VRAM needed</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-2)", margin: "4px 0 16px" }}>
        {totalGb < 1 ? `${(totalGb * 1024).toFixed(0)} MB` : `${totalGb.toFixed(1)} GB`}
      </div>

      <table className="table">
        <thead><tr><th>GPU</th><th>VRAM</th><th>Fits?</th></tr></thead>
        <tbody>
          {GPUS.map((g) => (
            <tr key={g.name}>
              <td>{g.name}</td>
              <td>{g.vramGb} GB</td>
              <td style={{ color: g.vramGb >= totalGb ? "var(--accent-2)" : "var(--accent-4)", fontWeight: 600 }}>
                {g.vramGb >= totalGb ? "✓ fits" : "✗ too small"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Try Llama-3.1-70B at BF16 full fine-tuning: ~1.3TB — nothing on this list fits, which is
        exactly why LoRA (Day 2) and quantization exist. Switch mode to "LoRA fine-tuning" at the
        same size and precision to see the difference.
      </p>
    </div>
  );
}
