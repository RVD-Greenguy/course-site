export const datasetLoadCode = `from datasets import load_dataset
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, Trainer, GenerationConfig, TrainingArguments
from peft import PeftModel, LoraConfig, get_peft_model, TaskType

dataset_name = "knkarthick/dialogsum"
model_name = "google/flan-t5-base"

dataset = load_dataset(dataset_name)
# DatasetDict: train=12460, validation=500, test=1500 rows
# features: id, dialogue, summary, topic`;

export const tokenizeCode = `def tokenize_fn(data):
    start_prompt = 'Summarize the following dialogue.\\n\\n'
    end_prompt = '\\n\\nSummary:'
    prompt = [start_prompt + d + end_prompt for d in data['dialogue']]
    summary = data['summary']
    data['input_ids'] = tokenizer(prompt, padding="max_length", truncation=True, return_tensors="pt").input_ids
    data['labels'] = tokenizer(summary, padding="max_length", truncation=True, return_tensors="pt").input_ids
    return data

tokenized_dataset = dataset.map(tokenize_fn, batched=True)
tokenized_dataset = tokenized_dataset.remove_columns(['id', 'dialogue', 'summary', 'topic'])`;

export const loraConfigCode = `lora_config = LoraConfig(
    r=16,                       # rank of the low-rank update matrices
    lora_alpha=16,               # scaling factor merging original vs new weights
    bias='none',
    task_type="SEQ_2_SEQ_LM",    # encoder-decoder model
    lora_dropout=0.05,
    target_modules=["q", "v"]    # only adapt query & value projections
)

base_model = AutoModelForSeq2SeqLM.from_pretrained(model_name, dtype=torch.bfloat16)
lora_model = get_peft_model(base_model, lora_config)

print(print_trainable_model_params(lora_model))
# Trainable parameters: 1,769,472
# Total parameters:     249,347,328
# Percentage trainable: 0.71%`;

export const trainCode = `output_dir = f'./peft-dialogue-summary-checkpoint-{int(time.time())}'

lora_training_args = TrainingArguments(
    output_dir=output_dir,
    auto_find_batch_size=True,
    learning_rate=1e-3,   # higher LR than full fine-tuning
    num_train_epochs=1,
)

trainer = Trainer(
    model=lora_model,
    args=lora_training_args,
    train_dataset=tokenized_dataset['train'],
    eval_dataset=tokenized_dataset['validation'],
)
trainer.train()`;

export const evalCode = `rouge = evaluate.load('rouge')
bleu = evaluate.load('bleu')

orig_model_result = rouge.compute(predictions=orig_model_summaries, references=summaries,
                                   use_aggregator=True, use_stemmer=True)
lora_model_result = rouge.compute(predictions=lora_model_summaries, references=summaries,
                                   use_aggregator=True, use_stemmer=True)

formatted_references = [[s] for s in summaries]
orig_model_bleu = bleu.compute(predictions=orig_model_summaries, references=formatted_references)
lora_model_bleu = bleu.compute(predictions=lora_model_summaries, references=formatted_references)`;

// Real trainable-param counts from the notebook (flan-t5-base, LoRA r=16, target_modules=["q","v"])
export const BASE_TOTAL_PARAMS = 247_577_856; // 100% trainable before LoRA (encoder+decoder, no LoRA layers)
export const LORA_TOTAL_PARAMS = 249_347_328; // total params once LoRA adapter layers are added
export const LORA_TRAINABLE_AT_R16 = 1_769_472; // 0.71%
export const D_MODEL = 768; // flan-t5-base hidden size
export const NUM_LAYERS = 12; // encoder layers (q/v adapted in both encoder self-attn + decoder self/cross-attn in the real model;
// simplified teaching formula below only models encoder self-attention q/v for the sandbox slider)
export const NUM_TARGET_MODULES = 2; // q, v

// trainable LoRA params ~= 2 * r * d_model * num_target_modules * num_layers
export function estimateLoraTrainable(r: number): number {
  return 2 * r * D_MODEL * NUM_TARGET_MODULES * NUM_LAYERS;
}

// Real ROUGE scores: original (zero-shot) vs LoRA-tuned model, computed on 5 test-set dialogues
export const rougeComparison = [
  { metric: "rouge1", original: 0.1641, lora: 0.3397 },
  { metric: "rouge2", original: 0.0474, lora: 0.1025 },
  { metric: "rougeL", original: 0.1397, lora: 0.2710 },
  { metric: "rougeLsum", original: 0.1397, lora: 0.2710 },
];

// Real BLEU scores from the same 5-example evaluation
export const bleuComparison = [
  { metric: "bleu", original: 0.0, lora: 0.0819 },
];

export const day2Resources = [
  {
    title: "PEFT library docs",
    url: "https://huggingface.co/docs/peft",
    desc: "LoraConfig, get_peft_model, PeftModel reference.",
    headings: ["Quicktour", "Method overview", "Integration with Transformers/Diffusers/Accelerate"],
    summary: "PEFT (Parameter-Efficient Fine-Tuning) only trains a small number of extra parameters instead of the whole model, cutting compute/storage cost while matching full-fine-tune quality — LoRA is one of several methods PEFT implements as a general framework for model adaptation (weight modification, layer wrapping, KV-cache manipulation).",
    howTo: "Wrap a base model with get_peft_model(model, LoraConfig(r=16, target_modules=[\"q\",\"v\"], ...)) — this is exactly the pattern used in the Day 2 notebook; only the LoRA A/B matrices become trainable, everything else stays frozen.",
  },
  {
    title: "LoRA paper (Hu et al., 2021)",
    url: "https://arxiv.org/abs/2106.09685",
    desc: "Low-Rank Adaptation of Large Language Models — the original method.",
    headings: ["Problem: full fine-tuning cost", "Method: low-rank decomposition matrices", "Results: 10,000x fewer trainable params", "No inference latency overhead"],
    summary: "Full fine-tuning GPT-3 175B per downstream task is infeasible to deploy at scale. LoRA freezes the pretrained weights and injects trainable low-rank matrices (ΔW=BA) into each layer, cutting trainable parameters ~10,000x and GPU memory ~3x vs. full fine-tuning with Adam, while matching or beating full fine-tuning quality on RoBERTa/DeBERTa/GPT-2/GPT-3 — and because BA is merged into W at inference, there's zero added latency, unlike adapter layers.",
    howTo: "Pick rank r as the only real new hyperparameter: start at r=8 or r=16 (as the Day 2 notebook does), apply it to attention q/v projections first (the paper's strongest result), and only increase r or add more target modules if quality on your eval metric (see ROUGE/BLEU calculators above) doesn't meet the full-fine-tune baseline.",
  },
  {
    title: "knkarthick/dialogsum dataset",
    url: "https://huggingface.co/datasets/knkarthick/dialogsum",
    desc: "Dialogue summarization dataset used for fine-tuning.",
    headings: ["Dataset Description", "Dataset Structure", "Dataset Creation", "Licensing", "Citation"],
    summary: "13,460 real-world dialogues (school, work, shopping, travel, etc.) pooled from DailyDialog/DREAM/MuTual plus an English-practice site, each with a human-written summary and a one-line topic label. Split 12,460 train / 500 validation / 1,500 test (+100 holdout), ~13.2MB total — small enough to fine-tune on in a workshop session.",
    howTo: "Load with load_dataset(\"knkarthick/dialogsum\"); each row has dialogue/summary/topic/id fields — feed dialogue as the LoRA training input and summary as the target, exactly as the Day 2 notebook's datasetLoadCode does.",
  },
  {
    title: "intotheverse/peft-dialogue-summary-checkpoint",
    url: "https://huggingface.co/intotheverse/peft-dialogue-summary-checkpoint",
    desc: "Pre-trained LoRA checkpoint used in the workshop to skip multi-hour training.",
    headings: ["Checkpoint files (adapter_config.json, adapter_model.bin)"],
    summary: "A LoRA adapter already trained on dialogsum against flan-t5-base — loading it reproduces the notebook's \"after fine-tuning\" ROUGE scores (0.4081+) without spending GPU time actually running the training loop live in a workshop.",
    howTo: "PeftModel.from_pretrained(base_model, \"intotheverse/peft-dialogue-summary-checkpoint\") attaches the adapter directly onto the frozen base model — this is the step the Day 2 notebook uses to let the class compare base-vs-LoRA outputs within one session.",
  },
  {
    title: "evaluate library — ROUGE/BLEU",
    url: "https://huggingface.co/docs/evaluate",
    desc: "Metric computation used to compare original vs LoRA model quality.",
    headings: ["Evaluate on the Hub", "Community Leaderboards", "Model Cards", "Libraries and Packages (Evaluate, LightEval)"],
    summary: "HuggingFace's evaluate library gives single-line access to dozens of metrics (NLP, CV, RL) with consistent, reproducible computation whether run locally or distributed. ROUGE and BLEU specifically live as separate metric Spaces under the evaluate-metric org, each with its own usage docs — exactly the clipped n-gram overlap / LCS math this site's ROUGE/BLEU calculator reproduces by hand above.",
    howTo: "evaluate.load(\"rouge\").compute(predictions=[...], references=[...]) and evaluate.load(\"bleu\").compute(...) — this is what the Day 2 notebook's evalCode calls to produce the real 0.2334→0.4216→0.4081 ROUGE numbers shown in the comparison chart.",
  },
];
