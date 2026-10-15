import { useMemo, useState } from "react";
import Evidence from "../components/Evidence";

// Decompose a JS double into the bit fields of an IEEE-754 FP32 or FP16 value,
// mirroring the slide's "let's store Pi" worked example (pages 70-74).
function toFP32Bits(value: number) {
  const buf = new ArrayBuffer(4);
  new Float32Array(buf)[0] = value;
  const bits = new Uint32Array(buf)[0];
  const sign = (bits >>> 31) & 1;
  const exponent = (bits >>> 23) & 0xff;
  const fraction = bits & 0x7fffff;
  const stored = new Float32Array(buf)[0];
  return {
    sign: sign.toString(2),
    exponent: exponent.toString(2).padStart(8, "0"),
    fraction: fraction.toString(2).padStart(23, "0"),
    stored,
  };
}

// FP16 has no native TypedArray in JS; pack/unpack the 5-exponent/10-fraction
// bit layout manually (same approach the slides' table describes).
function toFP16Bits(value: number) {
  const sign = value < 0 ? 1 : 0;
  const abs = Math.abs(value);
  let exponent = Math.floor(Math.log2(abs));
  let mantissa = abs / Math.pow(2, exponent) - 1;
  let expBits = exponent + 15; // 5-bit exponent bias = 15
  if (expBits < 0) expBits = 0;
  if (expBits > 31) expBits = 31;
  const fracBits = Math.round(mantissa * 1024) & 0x3ff; // 10 fraction bits
  const stored = (sign ? -1 : 1) * (1 + fracBits / 1024) * Math.pow(2, expBits - 15);
  return {
    sign: sign.toString(2),
    exponent: expBits.toString(2).padStart(5, "0"),
    fraction: fracBits.toString(2).padStart(10, "0"),
    stored,
  };
}

export default function FloatPrecisionViz() {
  const [value, setValue] = useState("3.141592");

  const parsed = useMemo(() => {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return null;
    return { fp32: toFP32Bits(n), fp16: toFP16Bits(n), original: n };
  }, [value]);

  return (
    <div className="sandbox">
      <h4>Visualizer — Floating-Point Precision (FP32 vs FP16)</h4>
      <Evidence
        kind="course"
        source="Day 1 slides, pp.69-74 — storing π in FP32/FP16/BF16/INT8"
        note="FP32: 1 sign + 8 exponent + 23 fraction bits (4 bytes). FP16: 1 + 5 + 10 bits (2 bytes) — a smaller exponent range AND less fraction precision, so FP16 can't represent π as closely as FP32."
      />

      <label style={{ display: "block", margin: "14px 0" }}>
        Decimal value to encode
        <input value={value} onChange={(e) => setValue(e.target.value)} style={{ width: "100%", padding: 10 }} />
      </label>

      {parsed && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
          <div className="card" style={{ margin: 0 }}>
            <strong>FP32 (32-bit, 4 bytes)</strong>
            <div style={{ fontFamily: "monospace", marginTop: 8, wordBreak: "break-all" }}>
              sign=<span style={{ color: "var(--accent)" }}>{parsed.fp32.sign}</span>{" "}
              exp=<span style={{ color: "var(--accent-2)" }}>{parsed.fp32.exponent}</span>{" "}
              frac=<span style={{ color: "var(--accent-3)" }}>{parsed.fp32.fraction}</span>
            </div>
            <div style={{ marginTop: 8, color: "var(--text-dim)" }}>Stored value: {parsed.fp32.stored}</div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <strong>FP16 (16-bit, 2 bytes)</strong>
            <div style={{ fontFamily: "monospace", marginTop: 8, wordBreak: "break-all" }}>
              sign=<span style={{ color: "var(--accent)" }}>{parsed.fp16.sign}</span>{" "}
              exp=<span style={{ color: "var(--accent-2)" }}>{parsed.fp16.exponent}</span>{" "}
              frac=<span style={{ color: "var(--accent-3)" }}>{parsed.fp16.fraction}</span>
            </div>
            <div style={{ marginTop: 8, color: "var(--text-dim)" }}>Stored value: {parsed.fp16.stored}</div>
          </div>
        </div>
      )}
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Try the default π (3.141592): FP32 keeps ~7 significant digits, FP16 collapses to ~3-4 — the
        same precision-loss example as the slides, computed live instead of screenshotted.
      </p>
    </div>
  );
}
