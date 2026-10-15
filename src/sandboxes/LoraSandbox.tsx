import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  BASE_TOTAL_PARAMS, LORA_TOTAL_PARAMS, estimateLoraTrainable,
  rougeComparison, bleuComparison,
} from "../data/day2";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// Generic textbook example from "Attention is all you need": d x k = 512 x 64
// attention weight matrix. This is the slide's illustrative number, distinct
// from the real flan-t5-base dimensions (d_model=768) used in the notebook.
const GENERIC_D = 512;
const GENERIC_K = 64;

function genericLora(r: number) {
  const base = GENERIC_D * GENERIC_K; // one full attention weight matrix
  const aParams = r * GENERIC_K; // A: r x k
  const bParams = GENERIC_D * r; // B: d x r
  const loraParams = aParams + bParams;
  const reduction = 100 * (1 - loraParams / base);
  return { base, loraParams, reduction };
}

// QLoRA quantization: memory per parameter drops as bit-width drops.
// 32-bit full precision -> 16-bit (half/bf16) -> 8-bit -> 4-bit NF4 (QLoRA).
const BITS_OPTIONS = [32, 16, 8, 4] as const;

export default function LoraSandbox() {
  const [r, setR] = useState(16);
  const [bits, setBits] = useState<typeof BITS_OPTIONS[number]>(32);
  const trainable = estimateLoraTrainable(r);
  const pct = (100 * trainable) / LORA_TOTAL_PARAMS;
  const generic = genericLora(r);

  const memoryGB = (bits / 32) * 4; // 4GB @ 32-bit per 1B params (Day 1 slide formula), scaled by bit-width

  return (
    <div className="sandbox">
      <h4>Calculator — LoRA Rank vs Trainable Parameters</h4>

      <Evidence
        kind="course"
        source="Day 2 notebook — day02-lora-v2-completed.ipynb"
        note="Real flan-t5-base run: d_model=768, target_modules=['q','v'], r=16 → 1,769,472 / 249,347,328 trainable params (0.71%)."
      />

      <label style={{ display: "block", margin: "14px 0" }}>
        LoRA rank r: {r}
        <input type="range" min={1} max={64} step={1} value={r} onChange={(e) => setR(+e.target.value)} />
      </label>

      <Formula
        tex="\Delta W = B A, \quad A \in \mathbb{R}^{r \times k},\ B \in \mathbb{R}^{d \times r}, \quad W_{\text{new}} = W_{\text{frozen}} + BA"
        caption="Freeze the pretrained d×k weight matrix W; train only the small A and B factors, then add their product back at inference."
      />

      <div style={{ display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Real model (d_model=768, 12 layers, q/v) trainable</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>{trainable.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>% of total ({LORA_TOTAL_PARAMS.toLocaleString()})</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>{pct.toFixed(2)}%</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Full fine-tune baseline</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{BASE_TOTAL_PARAMS.toLocaleString()} (100%)</div>
        </div>
      </div>

      <h4 style={{ marginTop: 24 }}>Generic textbook example (one 512×64 attention matrix)</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        The slides' own worked example uses the generic "Attention is all you need" dimensions
        (d=512, k=64) for a <em>single</em> attention weight matrix — not flan-t5-base. At r=8 this
        gives the slide's headline "86% reduction" figure. Same r slider drives both.
      </p>
      <div style={{ display: "flex", gap: 24, fontSize: 13, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Base matrix (512×64)</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{generic.base.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>LoRA A+B params (r={r})</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-2)" }}>{generic.loraParams.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: "var(--text-dim)" }}>Reduction</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-2)" }}>{generic.reduction.toFixed(1)}%</div>
        </div>
      </div>

      <h4 style={{ marginTop: 24 }}>QLoRA — quantized base weights</h4>
      <Evidence
        kind="course"
        source="Day 2 slides — QLoRA"
        note="4-bit NF4 (information-theoretically optimal for normal weight distributions) + Double Quantization + Paged Optimizers: 96 bits/param (traditional FT) → 5.2 bits/param, an 18x reduction, enabling a 65B model to fine-tune on a single 48GB GPU."
      />
      <div style={{ display: "flex", gap: 10, margin: "10px 0" }}>
        {BITS_OPTIONS.map((b) => (
          <button key={b} className={bits === b ? "active" : ""} onClick={() => setBits(b)}>{b}-bit</button>
        ))}
      </div>
      <p style={{ fontSize: 13 }}>
        Memory to <em>store</em> 1B frozen base params at {bits}-bit ≈{" "}
        <strong style={{ color: "var(--accent-2)" }}>{memoryGB.toFixed(2)} GB</strong>{" "}
        (scaled from the Day 1 slide formula: 4GB per 1B params at 32-bit).
      </p>

      <h4 style={{ marginTop: 28 }}>Real ROUGE scores — original vs LoRA model</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rougeComparison}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
          <XAxis dataKey="metric" stroke="#9aa3b2" fontSize={12} />
          <YAxis stroke="#9aa3b2" fontSize={12} />
          <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #2a2f3a" }} />
          <Legend />
          <Bar dataKey="original" name="Original (zero-shot)" fill="#e07a7a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lora" name="LoRA fine-tuned" fill="#68d7a0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <h4>Real BLEU score — original vs LoRA model</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bleuComparison} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
          <XAxis type="number" stroke="#9aa3b2" fontSize={12} />
          <YAxis dataKey="metric" type="category" stroke="#9aa3b2" fontSize={12} />
          <Tooltip contentStyle={{ background: "#171a21", border: "1px solid #2a2f3a" }} />
          <Legend />
          <Bar dataKey="original" name="Original (zero-shot)" fill="#e07a7a" radius={[0, 4, 4, 0]} />
          <Bar dataKey="lora" name="LoRA fine-tuned" fill="#68d7a0" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
        Scores computed over 5 test-set dialogues from <code>knkarthick/dialogsum</code> in the
        workshop notebook. LoRA improves both ROUGE and BLEU over the zero-shot base model despite
        tuning only 0.71% of parameters.
      </p>
    </div>
  );
}
