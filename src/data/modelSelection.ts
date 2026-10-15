export interface ModelCatalogEntry {
  model: string;
  task: string;
  paramsB: number;
  minVramInferenceGb: number;
  minVramFullFtGb: number;
  minVramLoraFtGb: number;
  notes: string;
}

// Param counts from each model's Hugging Face card; VRAM figures are the
// rule-of-thumb estimates from ModelMemoryCalculator at bf16 (inference/LoRA)
// and the ~16-bytes/param Adam full-fine-tune rate, rounded for the table.
export const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    model: "google/flan-t5-small",
    task: "Summarization / QA (seq2seq)",
    paramsB: 0.08,
    minVramInferenceGb: 0.2,
    minVramFullFtGb: 1.5,
    minVramLoraFtGb: 0.2,
    notes: "Runs on CPU. Good for a quick smoke test of a pipeline before scaling up.",
  },
  {
    model: "google/flan-t5-base",
    task: "Summarization / QA (seq2seq)",
    paramsB: 0.25,
    minVramInferenceGb: 0.6,
    minVramFullFtGb: 4.8,
    minVramLoraFtGb: 0.6,
    notes: "Used in the Day 1/Day 2 workshops. Comfortable on any free-tier GPU.",
  },
  {
    model: "google/flan-t5-xl",
    task: "Summarization / QA (seq2seq)",
    paramsB: 3,
    minVramInferenceGb: 7.2,
    minVramFullFtGb: 57.6,
    minVramLoraFtGb: 7.2,
    notes: "Full fine-tune needs an A100; LoRA fits a single consumer 24GB card.",
  },
  {
    model: "Qwen/Qwen3-VL-2B-Instruct",
    task: "Image-text-to-text (multimodal)",
    paramsB: 2,
    minVramInferenceGb: 4.8,
    minVramFullFtGb: 38.4,
    minVramLoraFtGb: 4.8,
    notes: "Used in Day 1 VQA workshop. Add ~1-2GB headroom per image for vision activations.",
  },
  {
    model: "meta-llama/Llama-3.1-8B-Instruct",
    task: "General chat / instruction-following",
    paramsB: 8,
    minVramInferenceGb: 19.2,
    minVramFullFtGb: 153.6,
    minVramLoraFtGb: 19.2,
    notes: "Gated on Hugging Face — request access first. Full fine-tune needs multi-GPU.",
  },
  {
    model: "openai/gpt-oss-20b",
    task: "General chat / tool use (powers this site's search bar)",
    paramsB: 20,
    minVramInferenceGb: 48,
    minVramFullFtGb: 384,
    minVramLoraFtGb: 48,
    notes: "Served via Groq's hosted API in this project — nobody on the team runs this locally.",
  },
  {
    model: "meta-llama/Llama-3.1-70B-Instruct",
    task: "General chat / instruction-following",
    paramsB: 70,
    minVramInferenceGb: 168,
    minVramFullFtGb: 1344,
    minVramLoraFtGb: 168,
    notes: "Needs multi-GPU (e.g. 2–4× A100 80GB) even just for inference at bf16; quantize to INT4 to fit one 80GB card.",
  },
];

export interface SelectionCriterion {
  question: string;
  guidance: string;
}

export const SELECTION_CRITERIA: SelectionCriterion[] = [
  {
    question: "What's the task?",
    guidance: "Seq2seq (encoder-decoder, e.g. FLAN-T5) suits summarization/translation/QA where the whole input is read before the output is generated. Decoder-only causal LMs (Llama, Qwen, GPT-OSS) suit open-ended chat/generation. Vision-language models (Qwen3-VL) are needed the moment an image enters the prompt.",
  },
  {
    question: "What hardware do you actually have?",
    guidance: "Check VRAM first (see the calculator below) — a model that doesn't fit at your target precision is disqualified regardless of how good its benchmark scores are. Quantization (INT8/INT4) and LoRA both trade some quality/flexibility for a much smaller footprint.",
  },
  {
    question: "Licence & gating",
    guidance: "Apache-2.0/MIT models (FLAN-T5, Qwen) can be used immediately. Llama-family models require accepting Meta's licence and requesting access on the model's Hugging Face page before the gated download works.",
  },
  {
    question: "Base vs instruction-tuned vs chat variant",
    guidance: "Suffixes matter: a bare base model continues text; '-Instruct'/'-Chat' variants are tuned to follow commands and use a specific chat template (see Day 1's apply_chat_template). Picking the wrong variant for your use case gives degraded output even if the architecture is identical.",
  },
  {
    question: "Full fine-tune vs LoRA vs frozen+prompting",
    guidance: "If the base model already does the task reasonably with the right prompt, don't fine-tune at all. If you need the task baked in and can't afford full fine-tune compute, use LoRA (Day 2) — it reaches most of full fine-tune's quality at a fraction of the trainable-parameter count and VRAM.",
  },
];
