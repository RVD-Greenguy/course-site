import CodeBlock from "../components/CodeBlock";
import RealWorldExample from "../components/RealWorldExample";
import LoraSandbox from "../sandboxes/LoraSandbox";
import RougeBleuCalculator from "../sandboxes/RougeBleuCalculator";
import PerplexityCalculator from "../sandboxes/PerplexityCalculator";
import Evidence from "../components/Evidence";
import ResourceList from "../components/ResourceList";
import { datasetLoadCode, tokenizeCode, loraConfigCode, trainCode, evalCode, day2Resources } from "../data/day2";

export default function Day2() {
  return (
    <div>
      <h1>Day 2 — Fine-tuning with LoRA / PEFT</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Parameter-efficient fine-tuning of <code>google/flan-t5-base</code> on dialogue
        summarization using LoRA adapters.
      </p>

      <h2>Dataset</h2>
      <Evidence kind="course" source="day02-lora-v2-completed.ipynb">
        <code>knkarthick/dialogsum</code> — 12,460 train / 500 validation / 1,500 test dialogue-summary pairs.
      </Evidence>
      <CodeBlock code={datasetLoadCode} title="load dataset & model" />
      <RealWorldExample
        title="why fine-tune on your own dialogue data at all"
        scenarios={[
          {
            label: "Call-center summaries",
            scenario: "A telecom's call-center wants post-call summaries in a very specific internal format (issue → resolution → follow-up), not generic prose.",
            outcome: "Fine-tuning on a few hundred internal call transcripts labeled in that exact format teaches the house style — a base FLAN-T5 can summarize, but won't spontaneously match a company-specific template without examples.",
          },
          {
            label: "Multilingual support tickets",
            scenario: "A SEA e-commerce company gets tickets in Bahasa, Thai, and Vietnamese mixed with English, and the base model's summaries are inconsistent across languages.",
            outcome: "Fine-tuning on dialogue-summary pairs in those specific languages (same idea as DialogSum, swapped corpus) closes the gap — this is exactly why SEA-LION (Day 4) exists as a continued-pretrain on SEA languages before anyone fine-tunes it further.",
          },
        ]}
      />

      <h2>Tokenization (seq2seq)</h2>
      <p>Prompt template: <code>{'"Summarize the following dialogue.\\n\\n{dialogue}\\n\\nSummary:"'}</code></p>
      <CodeBlock code={tokenizeCode} title="tokenize_fn" />

      <h2>LoRA configuration</h2>
      <p>
        Freeze the base model, add low-rank adapters to the attention query/value projections only.
        The real notebook run: <strong>r=16</strong> → 1,769,472 / 249,347,328 trainable params (0.71%),
        vs 100% for full fine-tuning.
      </p>
      <CodeBlock code={loraConfigCode} title="LoraConfig + get_peft_model" />
      <LoraSandbox />
      <RealWorldExample
        title="LoRA solving a real constraint"
        scenarios={[
          {
            label: "Many customers, one base model",
            scenario: "A SaaS company serves 200 enterprise customers who each want a chatbot fine-tuned on their own product docs — but hosting 200 full 8B-parameter model copies is unaffordable.",
            outcome: "One frozen base model + 200 small LoRA adapters (each a few MB instead of ~16GB) — swap the adapter per request, same GPU serves every customer.",
          },
          {
            label: "On-call bug-triage assistant",
            scenario: "An engineering team wants a model that understands their own codebase's jargon and past incident reports, trained overnight on a single GPU, not a multi-day multi-GPU job.",
            outcome: "r=16 LoRA (0.71% trainable params, this page's own notebook numbers) finishes training in hours on one GPU — full fine-tuning the same model would need the ~16GB-per-billion-param Adam memory this page's Day 1 calculator computes, usually multiple GPUs.",
          },
        ]}
      />

      <h2>Training</h2>
      <CodeBlock code={trainCode} title="Trainer + TrainingArguments" />

      <h2>Evaluation metrics — the math</h2>
      <p>
        ROUGE measures n-gram overlap with a reference summary; BLEU measures precision of n-gram
        matches with a brevity penalty. Both range 0–1, higher is better. Perplexity is a separate,
        intrinsic metric — it measures how well the model predicts held-out text, independent of any
        downstream task.
      </p>
      <CodeBlock code={evalCode} title="evaluate ROUGE + BLEU" />
      <RougeBleuCalculator />
      <RealWorldExample
        title="when ROUGE/BLEU catch (and miss) real problems"
        scenarios={[
          {
            label: "Caught a real regression",
            scenario: "A team retrains their summarizer weekly on fresh data; this week's checkpoint scores ROUGE-1 F1=0.41 on the held-out test set vs last week's 0.58.",
            outcome: "The eval catches a real regression (maybe a bad data batch) before it ships — this is exactly why Day 2's Trainer runs eval every epoch instead of trusting \"it looks fine\" from eyeballing a few outputs.",
          },
          {
            label: "A high score that still fails",
            scenario: "A medical-notes summarizer scores ROUGE-1 F1=0.85 — very high — but a doctor reviewing outputs finds it occasionally inverts \"patient does NOT have condition X\" into \"patient has condition X.\"",
            outcome: "High n-gram overlap (ROUGE counts \"patient\", \"has\"/\"does not have\", \"condition X\" as mostly-matching) can completely miss a negation flip that changes the clinical meaning — this is why Ragas-style faithfulness checks (Model Training Evaluation page) exist on top of ROUGE/BLEU for anything safety-critical.",
          },
        ]}
      />
      <PerplexityCalculator />

      <h2>Resources</h2>
      <ResourceList resources={day2Resources} />
    </div>
  );
}
