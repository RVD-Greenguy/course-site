export interface EvalTool {
  name: string;
  category: string;
  url: string;
  desc: string;
}

export const EVAL_TOOLS: EvalTool[] = [
  {
    name: "Hugging Face evaluate",
    category: "Metric library",
    url: "https://huggingface.co/docs/evaluate",
    desc: "evaluate.load('rouge'|'bleu'|'perplexity'|...) — the exact library used in Day 2's eval cell. One-line access to 100+ standard metric implementations instead of hand-rolling ROUGE/BLEU math.",
  },
  {
    name: "Hugging Face Open LLM Leaderboard",
    category: "Benchmark leaderboard",
    url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
    desc: "Standardized benchmark suite (MMLU, GPQA, BBH, MATH, IFEval, MuSR) run identically across thousands of public models — use it to see how a candidate model ranks before you commit to fine-tuning it.",
  },
  {
    name: "lm-evaluation-harness (EleutherAI)",
    category: "Benchmark runner",
    url: "https://github.com/EleutherAI/lm-evaluation-harness",
    desc: "The actual harness behind the Open LLM Leaderboard. Run the same standardized benchmarks yourself, locally, against your own fine-tuned checkpoint.",
  },
  {
    name: "Weights & Biases (W&B)",
    category: "Training tracking",
    url: "https://wandb.ai/",
    desc: "Logs loss curves, learning rate schedules, GPU utilization, and sample generations across training runs — the standard way to see *during* training whether a fine-tune is converging or overfitting, not just the final metric.",
  },
  {
    name: "TensorBoard",
    category: "Training tracking",
    url: "https://www.tensorflow.org/tensorboard",
    desc: "Local, free alternative to W&B — HF's Trainer logs to it automatically with report_to='tensorboard'. Good default when you don't want an external account/service.",
  },
  {
    name: "Hugging Face Trainer built-in eval",
    category: "Training loop",
    url: "https://huggingface.co/docs/transformers/main_classes/trainer",
    desc: "TrainingArguments(eval_strategy='epoch', metric_for_best_model=...) runs your compute_metrics function (e.g. the ROUGE/BLEU call from Day 2) on the validation set automatically each epoch.",
  },
  {
    name: "LangSmith",
    category: "LLM-app / agent evaluation",
    url: "https://www.langchain.com/langsmith",
    desc: "Traces and evaluates multi-step LLM pipelines (RAG, agents) end-to-end — closer fit than a single ROUGE score for grading the Day 3/Day 4-style pipelines in the group project.",
  },
  {
    name: "Ragas",
    category: "RAG evaluation",
    url: "https://docs.ragas.io/",
    desc: "Purpose-built metrics for RAG systems: faithfulness (is the answer grounded in retrieved context?), context precision/recall, answer relevance — exactly what the group project's RAG pipeline needs beyond plain ROUGE/BLEU.",
  },
  {
    name: "Perplexity (intrinsic)",
    category: "Metric",
    url: "https://huggingface.co/docs/transformers/perplexity",
    desc: "Task-independent fit measure (see the Day 2 calculator) — cheap to compute on held-out text, useful as an early overfitting signal before running the full task-specific eval.",
  },
];

export interface EvalMetricRow {
  metric: string;
  measures: string;
  bestFor: string;
}

export const EVAL_METRICS: EvalMetricRow[] = [
  { metric: "ROUGE-1/2/L", measures: "N-gram / longest-common-subsequence overlap with a reference", bestFor: "Summarization, extraction-style tasks" },
  { metric: "BLEU", measures: "Precision-weighted n-gram overlap with brevity penalty", bestFor: "Translation, generation close to a reference" },
  { metric: "Perplexity", measures: "How well the model predicts held-out text (exp of cross-entropy)", bestFor: "Comparing checkpoints during training, overfitting detection" },
  { metric: "Exact Match / F1", measures: "String-level match against a gold answer", bestFor: "Extractive QA, classification" },
  { metric: "MMLU / BBH / GPQA (harness)", measures: "Multiple-choice accuracy on broad knowledge/reasoning sets", bestFor: "Comparing base model capability before fine-tuning" },
  { metric: "Faithfulness / context precision (Ragas)", measures: "Whether a RAG answer is actually grounded in retrieved chunks", bestFor: "RAG pipelines (Day 3, group project)" },
  { metric: "Trainable-param % (PEFT)", measures: "Share of total params updated during fine-tuning", bestFor: "Reporting LoRA efficiency vs full fine-tuning (Day 2)" },
];

export interface Checklist {
  stage: string;
  items: string[];
}

export const WORKFLOW_CHECKLIST: Checklist[] = [
  {
    stage: "Before training",
    items: [
      "Pick metrics that match the task (ROUGE for summarization, not accuracy)",
      "Hold out a validation + test split that the model never trains on",
      "Record the base (pre-fine-tune) model's score as your baseline",
    ],
  },
  {
    stage: "During training",
    items: [
      "Track loss + eval metric every epoch (Trainer eval_strategy, logged to TensorBoard/W&B)",
      "Watch for train loss falling while val loss/perplexity rises → overfitting",
      "Checkpoint and keep the best-eval checkpoint, not just the last one",
    ],
  },
  {
    stage: "After training",
    items: [
      "Compare fine-tuned vs base model on the same held-out test set, same metric",
      "Report trainable-param % for LoRA runs alongside the quality delta",
      "For agent/RAG pipelines, add a pipeline-level eval (Ragas/LangSmith) on top of the component-level metric",
    ],
  },
];
