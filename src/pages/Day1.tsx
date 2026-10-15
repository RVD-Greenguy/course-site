import CodeBlock from "../components/CodeBlock";
import RealWorldExample from "../components/RealWorldExample";
import SummarizationSandbox from "../sandboxes/SummarizationSandbox";
import ChatTemplateSandbox from "../sandboxes/ChatTemplateSandbox";
import SamplingMathSandbox from "../sandboxes/SamplingMathSandbox";
import TokenCostCalculator from "../sandboxes/TokenCostCalculator";
import FloatPrecisionViz from "../sandboxes/FloatPrecisionViz";
import ModelMemoryCalculator from "../sandboxes/ModelMemoryCalculator";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";
import ResourceList from "../components/ResourceList";
import { summarizationCode, multimodalCode, flanModels, genConfigParams, mmInputFields, day1Resources } from "../data/day1";
import { MODEL_CATALOG, SELECTION_CRITERIA } from "../data/modelSelection";

export default function Day1() {
  return (
    <div>
      <h1>Day 1 — Summarization & Multimodal</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Zero-shot NLP with FLAN-T5, and image-text-to-text with Qwen3-VL.
      </p>

      <h2>The Transformer, in math</h2>
      <Evidence
        kind="course"
        source="Day 1 slides, p.38 — Self-Attention"
        note="Every token looks at every other token (and itself) and decides how much it matters, via scaled dot-product attention."
      />
      <Formula
        tex="\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\!\left(\frac{QK^{T}}{\sqrt{d_k}}\right)V"
        caption="Q·Kᵗ = similarity between tokens; divide by √d_k to stop dot products exploding as dimensionality grows; softmax turns scores into attention weights; multiply by V to get the context-aware output."
      />
      <RealWorldExample
        title="why attention matters"
        scenarios={[
          {
            label: "Pronoun resolution",
            scenario: 'The sentence "The trophy didn\'t fit in the suitcase because it was too big" — what does "it" refer to, the trophy or the suitcase?',
            outcome: 'Self-attention lets "it" attend strongly to "trophy" (not "suitcase") by weighing word relationships across the whole sentence — a bag-of-words model with no attention can\'t resolve this at all.',
          },
          {
            label: "Customer support routing",
            scenario: 'A support ticket says "the app crashes when I upload a photo, but only on my old phone."',
            outcome: '"crashes", "upload", "photo", and "old phone" all attend to each other even though they\'re far apart in the sentence — this is why transformer-based classifiers beat keyword-matching routers at tagging the real issue (crash + hardware-compat), not just the loudest keyword.',
          },
        ]}
      />

      <h2>Summarization with FLAN-T5</h2>
      <p>
        <code>google/flan-t5-base</code> is a Text-To-Text Transfer Transformer capable of zero-shot
        summarization, simple reasoning, and question answering. Available sizes:
      </p>
      <table className="table">
        <thead><tr><th>Model</th><th>Note</th></tr></thead>
        <tbody>
          {flanModels.map((m) => (
            <tr key={m.name}><td><code>{m.name}</code></td><td>{m.note}</td></tr>
          ))}
        </tbody>
      </table>
      <CodeBlock code={summarizationCode} title="workshop1-summarization.ipynb" />

      <h3>Generation config parameters</h3>
      <table className="table">
        <thead><tr><th>Param</th><th>Effect</th></tr></thead>
        <tbody>
          {genConfigParams.map((p) => (
            <tr key={p.param}><td><code>{p.param}</code></td><td>{p.effect}</td></tr>
          ))}
        </tbody>
      </table>
      <SummarizationSandbox />
      <RealWorldExample
        title="generation config in production"
        scenarios={[
          {
            label: "Customer support bot",
            scenario: "A support bot summarizing ticket threads for an agent dashboard needs the same ticket to produce the same summary every time it's re-rendered.",
            outcome: "do_sample=False (greedy decoding) — deterministic output matters more than creativity here; two agents viewing the same ticket must see the same summary.",
          },
          {
            label: "Marketing copy generator",
            scenario: "A tool that drafts 5 different ad headlines from one product description, so a marketer can pick their favorite.",
            outcome: "do_sample=True with temperature≈0.9 and top_p≈0.95 — high diversity is the whole point; running the same prompt 5 times should give 5 genuinely different headlines.",
          },
          {
            label: "Medical note summarizer",
            scenario: "Summarizing a doctor's dictated notes into a structured record — a hallucinated detail (wrong dosage, wrong symptom) is a patient-safety risk.",
            outcome: "do_sample=False, low max_new_tokens, and ideally constrained decoding — minimize the model's freedom to invent anything not in the source text.",
          },
        ]}
      />
      <SamplingMathSandbox />

      <h2>Floating-point precision & memory</h2>
      <Evidence
        kind="course"
        source="Day 1 slides, p.64 — model memory formula"
        note="1 parameter = 4 bytes (32-bit float) ⇒ 1B parameters ≈ 4×10⁹ bytes = 4GB. Quantizing to fewer bits per parameter shrinks memory proportionally."
      />
      <FloatPrecisionViz />
      <RealWorldExample
        title="precision trade-offs that actually ship"
        scenarios={[
          {
            label: "On-device assistant",
            scenario: "A phone keyboard app wants an on-device autocomplete model, but phones have 4-8GB total RAM shared with the OS and every other app.",
            outcome: "INT4/INT8 quantization — a 1B param model shrinks from ~4GB (FP32) to ~0.5-1GB, the difference between \"doesn't fit\" and \"runs alongside everything else.\"",
          },
          {
            label: "Training a new model",
            scenario: "A research team training a model from scratch needs gradient updates to not vanish/explode across thousands of steps.",
            outcome: "BF16 (not FP16) — same memory as FP16 but keeps FP32's 8-bit exponent range, so it tolerates the huge dynamic range of gradients during training without the precision-loss collapse FP16 risks.",
          },
          {
            label: "Serving an API at scale",
            scenario: "An inference API serving millions of requests/day on rented GPUs, billed per GPU-hour.",
            outcome: "FP16/BF16 inference, maybe INT8 for less latency-sensitive tiers — halving memory roughly doubles how many concurrent requests one GPU can serve, directly cutting the cloud bill.",
          },
        ]}
      />

      <h2>Token economics</h2>
      <TokenCostCalculator />

      <h2>Multimodal: Image-Text-to-Text</h2>
      <p>
        <code>Qwen/Qwen3-VL-2B-Instruct</code> takes an image + prompt and returns a text response —
        used for visual question answering and document understanding (charts, receipts).
      </p>
      <CodeBlock code={multimodalCode} title="day01-image-text-to-text.ipynb" />
      <table className="table">
        <thead><tr><th>Field</th><th>Description</th></tr></thead>
        <tbody>
          {mmInputFields.map((f) => (
            <tr key={f.field}><td><code>{f.field}</code></td><td>{f.desc}</td></tr>
          ))}
        </tbody>
      </table>
      <ChatTemplateSandbox />
      <RealWorldExample
        title="multimodal in the wild"
        scenarios={[
          {
            label: "Insurance claims",
            scenario: "An insurer receives thousands of photos of car damage attached to claims and needs to triage severity before a human adjuster looks at them.",
            outcome: "A vision-language model answers \"rate the damage severity 1-5 and list visible damaged parts\" directly from the photo — no manual tagging pipeline, no separate object-detection model to maintain.",
          },
          {
            label: "Receipt expense reports",
            scenario: "An expense app needs to pull vendor, date, and total from a photographed receipt, including crumpled or badly-lit ones.",
            outcome: "Image-text-to-text with a structured-extraction prompt replaces brittle OCR + regex — the model reads \"what's the total?\" the way a person would, tolerating skew/glare/handwriting that breaks template-based OCR.",
          },
          {
            label: "Accessibility",
            scenario: "A screen-reader needs to describe an unlabeled chart or diagram embedded in a PDF to a blind user.",
            outcome: "The same VQA pattern as the sandbox above (\"where is the baby bear?\") generalizes to \"what trend does this chart show?\" — this is literally how modern screen readers describe images.",
          },
        ]}
      />

      <h2>Hugging Face: choosing a model</h2>
      <Evidence
        kind="external"
        source="Hugging Face Hub conventions + 'Model Memory Usage' blog — not covered in Day 1 slides as a decision framework"
        note="The slides show specific models (flan-t5-base, Qwen3-VL) already chosen for you. This section is the decision process for picking a model yourself: task fit, licence, and whether it actually fits your hardware."
      />
      <table className="table">
        <thead><tr><th>Question</th><th>Guidance</th></tr></thead>
        <tbody>
          {SELECTION_CRITERIA.map((c) => (
            <tr key={c.question}><td style={{ width: 220 }}><strong>{c.question}</strong></td><td style={{ fontSize: 13 }}>{c.guidance}</td></tr>
          ))}
        </tbody>
      </table>

      <h3>Model catalog — params, task fit, and VRAM needed</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Model</th><th>Task</th><th>Params</th>
            <th>Inference</th><th>LoRA FT</th><th>Full FT</th>
          </tr>
        </thead>
        <tbody>
          {MODEL_CATALOG.map((m) => (
            <tr key={m.model}>
              <td><code>{m.model}</code><div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{m.notes}</div></td>
              <td style={{ fontSize: 12.5 }}>{m.task}</td>
              <td>{m.paramsB >= 1 ? `${m.paramsB}B` : `${m.paramsB * 1000}M`}</td>
              <td>{m.minVramInferenceGb < 1 ? `${(m.minVramInferenceGb * 1024).toFixed(0)}MB` : `${m.minVramInferenceGb}GB`}</td>
              <td>{m.minVramLoraFtGb < 1 ? `${(m.minVramLoraFtGb * 1024).toFixed(0)}MB` : `${m.minVramLoraFtGb}GB`}</td>
              <td>{m.minVramFullFtGb < 1 ? `${(m.minVramFullFtGb * 1024).toFixed(0)}MB` : `${m.minVramFullFtGb}GB`}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Will it fit on your GPU?</h3>
      <ModelMemoryCalculator />
      <RealWorldExample
        title="model selection under a real budget"
        scenarios={[
          {
            label: "Startup with one A10 GPU",
            scenario: "A startup rents a single 24GB A10 instance and wants to fine-tune a chat model on their support-ticket history.",
            outcome: "Llama-3.1-8B with LoRA fits comfortably (~19GB inference + a few GB for the adapter); full fine-tuning Llama-3.1-8B (~154GB) is simply off the table on this hardware — the choice isn't preference, it's physics.",
          },
          {
            label: "Enterprise with an 8xA100 cluster",
            scenario: "A larger company has a dedicated 8×A100 80GB training cluster and needs the best possible quality for a legal-document assistant.",
            outcome: "Full fine-tuning of a 70B model becomes feasible by sharding the ~1.3TB optimizer-state requirement across 8 GPUs (ZeRO/FSDP) — the same math from the calculator above, just solved with more GPUs instead of a smaller model.",
          },
        ]}
      />

      <h2>Resources</h2>
      <ResourceList resources={day1Resources} />
    </div>
  );
}
