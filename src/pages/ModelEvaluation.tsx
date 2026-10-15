import DashboardTabs from "../components/DashboardTabs";
import StatRow from "../components/StatRow";
import Evidence from "../components/Evidence";
import RougeBleuCalculator from "../sandboxes/RougeBleuCalculator";
import PerplexityCalculator from "../sandboxes/PerplexityCalculator";
import ModelMemoryCalculator from "../sandboxes/ModelMemoryCalculator";
import { EVAL_TOOLS, EVAL_METRICS, WORKFLOW_CHECKLIST } from "../data/evaluation";

export default function ModelEvaluation() {
  return (
    <div>
      <h1>Model Training Evaluation</h1>
      <p style={{ color: "var(--text-dim)" }}>
        How to tell whether a fine-tuned (or base) model is actually any good: which metric fits
        which task, which Hugging Face / third-party tools run that metric for you, and a
        before/during/after checklist for a training run.
      </p>

      <Evidence
        kind="external"
        source="Hugging Face evaluate docs + EleutherAI lm-evaluation-harness + Ragas — not a single course page"
        note="This page consolidates evaluation tooling that's scattered across Day 2's ROUGE/BLEU/perplexity examples and the group project's RAG pipeline needs into one reference, plus the surrounding tools (leaderboards, training trackers) the course notebooks don't mention at all."
      />

      <StatRow
        stats={[
          { label: "Metrics covered", value: `${EVAL_METRICS.length}` },
          { label: "Tools cataloged", value: `${EVAL_TOOLS.length}` },
          { label: "LoRA trainable params (Day 2)", value: "0.71%" },
          { label: "Workflow stages", value: "3" },
        ]}
      />

      <h2>Evaluation dashboard</h2>
      <DashboardTabs
        defaultTab="metrics"
        tabs={[
          {
            id: "metrics",
            label: "Metrics",
            content: (
              <>
                <table className="table">
                  <thead><tr><th>Metric</th><th>Measures</th><th>Best for</th></tr></thead>
                  <tbody>
                    {EVAL_METRICS.map((m) => (
                      <tr key={m.metric}>
                        <td><code>{m.metric}</code></td>
                        <td style={{ fontSize: 12.5 }}>{m.measures}</td>
                        <td style={{ fontSize: 12.5 }}>{m.bestFor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ),
          },
          {
            id: "rouge-bleu",
            label: "ROUGE / BLEU",
            badge: "interactive",
            content: <RougeBleuCalculator />,
          },
          {
            id: "perplexity",
            label: "Perplexity",
            badge: "interactive",
            content: <PerplexityCalculator />,
          },
          {
            id: "resources",
            label: "VRAM check",
            badge: "interactive",
            content: (
              <>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  Evaluation isn't just quality — it's also whether you can afford to run the
                  comparison at all. Same calculator as Day 1, surfaced here for convenience when
                  planning an eval run (e.g. loading both base and fine-tuned checkpoints at once).
                </p>
                <ModelMemoryCalculator />
              </>
            ),
          },
          {
            id: "tools",
            label: "Tools",
            content: (
              <table className="table">
                <thead><tr><th>Tool</th><th>Category</th><th>What it's for</th></tr></thead>
                <tbody>
                  {EVAL_TOOLS.map((t) => (
                    <tr key={t.name}>
                      <td><a href={t.url} target="_blank" rel="noreferrer"><strong>{t.name}</strong></a></td>
                      <td style={{ fontSize: 12 }}>{t.category}</td>
                      <td style={{ fontSize: 12.5 }}>{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ),
          },
          {
            id: "workflow",
            label: "Workflow checklist",
            content: (
              <>
                {WORKFLOW_CHECKLIST.map((c) => (
                  <div key={c.stage} className="card">
                    <h4 style={{ marginTop: 0, color: "var(--accent-2)" }}>{c.stage}</h4>
                    <ul className="link-list">
                      {c.items.map((it) => (
                        <li key={it} style={{ fontSize: 13 }}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ),
          },
        ]}
      />

      <h2>Where this fits in the group project</h2>
      <p>
        The fine-tuning lead reports trainable-param % and ROUGE/BLEU vs the base model (Day 2's
        own metrics). The RAG lead should add a RAG-specific eval (Ragas: faithfulness, context
        precision/recall) on top, since ROUGE alone can't tell you whether a RAG answer is grounded
        in the retrieved chunks or hallucinated despite good n-gram overlap.
      </p>
    </div>
  );
}
