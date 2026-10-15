import { useMemo, useState } from "react";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// --- tokenization -----------------------------------------------------
// Lowercase + split on non-word chars, matching how ROUGE/BLEU implementations
// (e.g. the `evaluate` library used in the real notebook) normalize text
// before counting n-gram overlaps.
function tokenize(text: string): string[] {
  return text.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function ngrams(tokens: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) out.push(tokens.slice(i, i + n).join(" "));
  return out;
}

// Clipped n-gram overlap count: a generated n-gram can only be "matched" up to
// the number of times it appears in the reference. Without this clip, repeating
// a reference word (e.g. "warm warm warm warm") would let precision hit 1.0 for
// free — this is the "ROUGE hacking" the Day 2 slides call out explicitly.
function clippedOverlapCount(genGrams: string[], refGrams: string[], clip: boolean): number {
  const refCounts = new Map<string, number>();
  for (const g of refGrams) refCounts.set(g, (refCounts.get(g) ?? 0) + 1);
  const genCounts = new Map<string, number>();
  for (const g of genGrams) genCounts.set(g, (genCounts.get(g) ?? 0) + 1);

  let total = 0;
  for (const [g, count] of genCounts) {
    const refCount = refCounts.get(g) ?? 0;
    total += clip ? Math.min(count, refCount) : refCount > 0 ? count : 0;
  }
  return total;
}

function precisionRecallF1(matches: number, genLen: number, refLen: number) {
  const precision = genLen > 0 ? matches / genLen : 0;
  const recall = refLen > 0 ? matches / refLen : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

// Longest Common Subsequence length, for ROUGE-L (unlike n-gram overlap, LCS
// rewards matched word *order*, not just co-occurrence).
function lcsLength(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// BLEU = brevity_penalty * geometric_mean(precision_1..N), the "average
// precision across n-gram sizes" definition used in the Day 2 slides.
function bleuScore(genTokens: string[], refTokens: string[], maxN = 4): number {
  let logSum = 0;
  let usableN = 0;
  for (let n = 1; n <= maxN; n++) {
    const genG = ngrams(genTokens, n);
    const refG = ngrams(refTokens, n);
    if (genG.length === 0) continue;
    const matches = clippedOverlapCount(genG, refG, true);
    const p = matches / genG.length;
    usableN++;
    // Smooth zero-precision n-grams instead of zeroing the whole score, so the
    // slider demo doesn't collapse to 0 the moment one n-gram size has no overlap.
    logSum += Math.log(p > 0 ? p : 1e-6);
  }
  const geoMean = usableN > 0 ? Math.exp(logSum / usableN) : 0;
  const bp = genTokens.length < refTokens.length ? Math.exp(1 - refTokens.length / genTokens.length) : 1;
  return bp * geoMean;
}

const DEFAULT_REF = "It is warm inside.";
const DEFAULT_GEN = "It is very warm inside.";

export default function RougeBleuCalculator() {
  const [reference, setReference] = useState(DEFAULT_REF);
  const [generated, setGenerated] = useState(DEFAULT_GEN);
  const [clip, setClip] = useState(true);

  const result = useMemo(() => {
    const refTokens = tokenize(reference);
    const genTokens = tokenize(generated);

    const rouge1Grams = { ref: ngrams(refTokens, 1), gen: ngrams(genTokens, 1) };
    const rouge2Grams = { ref: ngrams(refTokens, 2), gen: ngrams(genTokens, 2) };

    const r1Matches = clippedOverlapCount(rouge1Grams.gen, rouge1Grams.ref, clip);
    const r2Matches = clippedOverlapCount(rouge2Grams.gen, rouge2Grams.ref, clip);
    const lcs = lcsLength(refTokens, genTokens);

    return {
      rouge1: precisionRecallF1(r1Matches, genTokens.length, refTokens.length),
      rouge2: precisionRecallF1(r2Matches, Math.max(0, genTokens.length - 1), Math.max(0, refTokens.length - 1)),
      rougeL: precisionRecallF1(lcs, genTokens.length, refTokens.length),
      bleu: bleuScore(genTokens, refTokens),
      refTokens,
      genTokens,
      lcs,
    };
  }, [reference, generated, clip]);

  return (
    <div className="sandbox">
      <h4>Calculator — ROUGE &amp; BLEU, computed live</h4>
      <Evidence
        kind="course"
        source="Day 2 slides — ROUGE/BLEU worked examples"
        note={`Default text reproduces the slide's own ROUGE-1 example: Ref="${DEFAULT_REF}" vs Gen="${DEFAULT_GEN}" → P=0.8, R=1.0, F1=0.89. Edit either field to recompute.`}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" }}>
        <label>
          Reference (ground truth)
          <textarea rows={2} value={reference} onChange={(e) => setReference(e.target.value)} />
        </label>
        <label>
          Generated (model output)
          <textarea rows={2} value={generated} onChange={(e) => setGenerated(e.target.value)} />
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 14 }}>
        <input type="checkbox" checked={clip} onChange={(e) => setClip(e.target.checked)} style={{ width: "auto" }} />
        Clip n-gram matches to reference frequency (uncheck to see "ROUGE hacking" — e.g. repeat a
        reference word in Generated and watch precision inflate without clipping)
      </label>

      <Formula
        tex="\text{Precision} = \frac{\text{matches}}{\text{len(generated)}}, \quad \text{Recall} = \frac{\text{matches}}{\text{len(reference)}}, \quad F_1 = \frac{2PR}{P+R}"
      />

      <table className="table">
        <thead><tr><th>Metric</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
        <tbody>
          <tr><td>ROUGE-1 (unigram)</td><td>{result.rouge1.precision.toFixed(2)}</td><td>{result.rouge1.recall.toFixed(2)}</td><td>{result.rouge1.f1.toFixed(2)}</td></tr>
          <tr><td>ROUGE-2 (bigram)</td><td>{result.rouge2.precision.toFixed(2)}</td><td>{result.rouge2.recall.toFixed(2)}</td><td>{result.rouge2.f1.toFixed(2)}</td></tr>
          <tr><td>ROUGE-L (LCS={result.lcs})</td><td>{result.rougeL.precision.toFixed(2)}</td><td>{result.rougeL.recall.toFixed(2)}</td><td>{result.rougeL.f1.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <Formula
        tex="\text{BLEU} = \text{BP} \times \exp\left(\frac{1}{N}\sum_{n=1}^{N}\log p_n\right)"
        caption="BP = brevity penalty (penalizes generated text shorter than the reference); p_n = clipped n-gram precision for n=1..4."
      />
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-2)" }}>BLEU = {result.bleu.toFixed(3)}</div>
    </div>
  );
}
