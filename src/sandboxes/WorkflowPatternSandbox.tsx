import { useState } from "react";
import AnimatedFlow, { useStepPlayer, type FlowStep } from "../components/AnimatedFlow";

const PATTERNS: Record<string, { steps: FlowStep[]; note: string }> = {
  "Prompt Chaining": {
    steps: [
      { label: "Input", detail: '"Write a blog post about LoRA"' },
      { label: "LLM Call 1", detail: "Generate outline: 3 sections (what/why/how)" },
      { label: "LLM Call 2", detail: "Draft each section from the outline" },
      { label: "LLM Call 3", detail: "Edit draft for tone & length" },
      { label: "Output", detail: "Final polished blog post" },
    ],
    note: "Fixed sequence — each step's output feeds the next. Good for tasks that decompose into clear subtasks.",
  },
  Routing: {
    steps: [
      { label: "Input", detail: '"Refund my order #4521"' },
      { label: "Classifier", detail: "intent = billing_issue (confidence 0.94)" },
      { label: "Specialized Prompt", detail: "Routed to Billing-Agent prompt template" },
      { label: "Output", detail: "Refund initiated, confirmation emailed" },
    ],
    note: "Classify the input, then direct it to one of several specialized downstream handlers.",
  },
  Parallelization: {
    steps: [
      { label: "Input", detail: '"Review this PR for bugs, style, and security"' },
      { label: "Subtask 1 ∥ 2 ∥ 3", detail: "Bugs-check, Style-check, Security-check run concurrently" },
      { label: "Aggregator", detail: "Merge 3 reviewer reports into one" },
      { label: "Output", detail: "Combined PR review comment" },
    ],
    note: "Sectioning (independent subtasks) or Voting (same task run multiple times for consensus).",
  },
  "Orchestrator-Workers": {
    steps: [
      { label: "Input", detail: '"Build a competitor analysis report"' },
      { label: "Orchestrator LLM", detail: "Decides: need pricing, features, reviews data" },
      { label: "Worker 1 / 2 / N", detail: "Each worker LLM fetches+summarizes one data type" },
      { label: "Synthesize", detail: "Orchestrator merges worker outputs" },
      { label: "Output", detail: "Final structured report" },
    ],
    note: "A central LLM dynamically breaks the task apart and delegates — unlike Parallelization, subtasks aren't known in advance.",
  },
  "Evaluator-Optimizer": {
    steps: [
      { label: "Input", detail: '"Translate this contract clause to French"' },
      { label: "Generator LLM", detail: "Produces first translation" },
      { label: "Evaluator LLM", detail: "Flags: legal term mistranslated" },
      { label: "Refine (loop)", detail: "Generator revises based on feedback" },
      { label: "Output", detail: "Accepted translation" },
    ],
    note: "One LLM generates, another critiques; loop until the evaluator is satisfied.",
  },
};

export default function WorkflowPatternSandbox() {
  const [pattern, setPattern] = useState<keyof typeof PATTERNS>("Routing");
  const { steps, note } = PATTERNS[pattern];
  const { activeIndex, playing, play, reset } = useStepPlayer(steps, 1000);

  function choose(p: keyof typeof PATTERNS) {
    setPattern(p);
    reset();
  }

  return (
    <div className="sandbox">
      <h4>Sandbox — Anthropic's 5 Agentic Workflow Patterns</h4>
      <div className="pill-row">
        {Object.keys(PATTERNS).map((p) => (
          <button key={p} className={p === pattern ? "active" : ""} onClick={() => choose(p as keyof typeof PATTERNS)}>
            {p}
          </button>
        ))}
      </div>
      <div className="run-controls">
        <button onClick={play} disabled={playing}>{playing ? "Running…" : "▶ Run example"}</button>
        <button onClick={reset}>Reset</button>
      </div>
      <AnimatedFlow steps={steps} activeIndex={activeIndex} />
      <div className="step-payload fade-in" key={activeIndex}>
        {activeIndex >= 0 ? steps[activeIndex].detail : "Click \"Run example\" to step through this pattern."}
      </div>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 14 }}>{note}</p>
    </div>
  );
}
