export const summarizationCode = `from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM, GenerationConfig

model_name = 'google/flan-t5-base'

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

text = """
Two roads diverged in a yellow wood,
And sorry I could not travel both
...
"""

# FLAN templates: https://github.com/google-research/FLAN/blob/main/flan/templates.py
prompt = f"Summarize the following text:\\n\\n{text}"

inputs = tokenizer(prompt, return_tensors="pt")

generation_config = GenerationConfig(
    max_new_tokens=60,
    temperature=0.7,
    top_p=0.9,
    top_k=50,
    do_sample=True,
)

outputs = model.generate(**inputs, generation_config=generation_config)
summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(summary)`;

export const multimodalCode = `from transformers import pipeline

model_name = "Qwen/Qwen3-VL-2B-Instruct"

image = "https://static.boredpanda.com/.../mother-bear-cubs.jpg"
text = "Where is the baby bear?"

# Structured chat-template input — every chat-tuned model expects
# its own token format (Llama [INST], ChatML <|im_start|>, Qwen variant, ...)
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text", "text": text},
        ],
    }
]

inputs = processor.apply_chat_template(
    messages,
    add_generation_prompt=True,  # append tokens telling model to respond
    tokenize=True,
    return_dict=True,
    return_tensors="pt",
)
# inputs: input_ids, attention_mask, mm_token_type_ids,
#         pixel_values, image_grid_thw (T/H/W patch layout)

outputs = model.generate(**inputs, max_new_tokens=64)
answer = processor.decode(outputs[0], skip_special_tokens=True)
print(answer)`;

export const flanModels = [
  { name: "google/flan-t5-small", note: "fastest, lowest quality" },
  { name: "google/flan-t5-base", note: "used in this workshop" },
  { name: "google/flan-t5-xl", note: "higher quality, heavier" },
  { name: "google/flan-t5-xxl", note: "full model" },
];

export const genConfigParams = [
  { param: "temperature", effect: "Higher = more random/creative token choices; lower = more deterministic." },
  { param: "top_p", effect: "Nucleus sampling — only sample from the smallest set of tokens whose cumulative probability ≥ top_p." },
  { param: "top_k", effect: "Only sample from the top_k most likely next tokens." },
  { param: "do_sample", effect: "If False, uses greedy/beam decoding and ignores temperature/top_p/top_k." },
];

export const mmInputFields = [
  { field: "input_ids", desc: "the tokens" },
  { field: "attention_mask", desc: "which tokens to attend to (identifies padding in a batch)" },
  { field: "mm_token_type_ids", desc: "identifies token type in the multimodal prompt" },
  { field: "pixel_values", desc: "the processed image data" },
  { field: "image_grid_thw", desc: "Time/Height/Width — how the image is divided into patches/tiles" },
];

export const day1Resources = [
  {
    title: "google/flan-t5-base model card",
    url: "https://huggingface.co/google/flan-t5-base",
    desc: "Base model used throughout the summarization workshop.",
    headings: ["Model Details", "Usage", "Direct & Downstream Use", "Bias, Risks & Limitations", "Training Details", "Evaluation", "Environmental Impact"],
    summary: "FLAN-T5-base is T5 fine-tuned on 1,000+ instruction tasks across 50+ languages (Apache 2.0). Intended for research/zero-shot & few-shot NLP, not production deployment without further testing — it can replicate biases from its training mixture. Scored 77.98 average across a 36-dataset evaluation, well above base T5.",
    howTo: "Load with AutoModelForSeq2SeqLM.from_pretrained(\"google/flan-t5-base\") + its matching tokenizer; it's seq2seq (encoder-decoder), so prompts go in whole and the answer is generated, not continued — this is why it suits summarization/QA better than open-ended chat.",
  },
  {
    title: "FLAN prompt templates",
    url: "https://github.com/google-research/FLAN/blob/main/flan/templates.py",
    desc: "Official template collection — pick a summarization template.",
    headings: ["PATTERNS dict (50+ task categories)", "Reasoning / Coreference / Semantic similarity", "Q&A", "Summarization", "Translation", "Classification"],
    summary: "A single PATTERNS dictionary mapping task categories (e.g. \"summarization\", \"qa\") to lists of (input_template, output_template) string pairs with placeholders like {premise}/{question}/{summary}. This is literally how Google generated FLAN's instruction-tuning data: many differently-worded instructions for the same underlying task, to make the model robust to phrasing.",
    howTo: "Pick the category matching your task (e.g. PATTERNS[\"summarize\"]), sample a template, and .format() it with your document text — this reproduces the exact instruction phrasing FLAN-T5 saw during training, which is why matching its template style gets more reliable output than an arbitrary custom prompt.",
  },
  {
    title: "Qwen3-VL-2B-Instruct model card",
    url: "https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct",
    desc: "Multimodal image-text-to-text model used for VQA.",
    headings: ["Key Enhancements", "Model Architecture Updates", "Model Performance", "Quickstart", "Generation Hyperparameters"],
    summary: "Alibaba's vision-language model: processes images+text with visual-agent/GUI-interaction ability, spatial object localization, a native 256K context (expandable to 1M), and 32-language OCR. Architecture adds Interleaved-MRoPE positional embeddings, DeepStack multi-level visual feature fusion, and text-timestamp alignment for video.",
    howTo: "Load via Transformers (AutoModelForImageTextToText + AutoProcessor), pass an image + a text question through the chat template together, and use separate generation hyperparameters for vision-language vs. text-only calls — the model card recommends different presets per modality.",
  },
  {
    title: "Chat templates — Transformers docs",
    url: "https://huggingface.co/docs/transformers/chat_templating",
    desc: "How apply_chat_template formats conversations per model family.",
    headings: ["Using apply_chat_template", "add_generation_prompt", "continue_final_message", "Model training with chat templates"],
    summary: "Chat models are still just causal LMs continuing a token sequence — the role/content message list you pass gets converted into model-specific control tokens ([INST]...[/INST] for Mistral, <|user|>/<|assistant|> for Zephyr, <|im_start|>/<|im_end|> for ChatML models). Using the wrong tokens for a model drastically hurts output quality, which is why apply_chat_template exists instead of hand-writing the format.",
    howTo: "Call tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=True) before generate() — add_generation_prompt=True appends the tokens that tell the model \"now reply as assistant\"; omitting it on a model that needs it can make the model continue the user's message instead of answering it.",
  },
  {
    title: "GenerationConfig reference",
    url: "https://huggingface.co/docs/transformers/main_classes/text_generation",
    desc: "temperature / top_p / top_k / do_sample semantics.",
    headings: ["Parameters controlling output length", "Parameters controlling the generation strategy", "Parameters for output logits/scores"],
    summary: "GenerationConfig is the single object controlling every generate() call: max_new_tokens caps length, do_sample=True switches from greedy/beam decoding to the sampling math this site's Day 1 sandbox implements (temperature scales logits before softmax; top_k keeps only the k highest-probability tokens; top_p keeps the smallest set of tokens whose cumulative probability exceeds p), and these combine — top_k and top_p can both apply as successive filters before the final sample is drawn.",
    howTo: "Set do_sample=True first (sampling params are ignored otherwise), then tune temperature (lower = more deterministic, higher = more diverse), top_k and/or top_p to shape the sampling pool — see the Sampling Math calculator above on this page for exactly how these interact numerically.",
  },
];
