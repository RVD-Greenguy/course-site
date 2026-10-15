import { useState } from "react";
import AnimatedFlow, { useStepPlayer, type FlowStep } from "../components/AnimatedFlow";

const SCENARIOS: Record<string, FlowStep[]> = {
  "What is the box office for Nezha 2?": [
    { label: "User message", detail: '"What is the box office for Nezha 2"' },
    { label: "Claude: tool_use", detail: 'stop_reason="tool_use" → calls get_article(search_term="Nezha 2")' },
    { label: "Execute tool", detail: "wikipediaapi fetches the Wikipedia page content" },
    { label: "tool_result → Claude", detail: "Article text (truncated to 4000 chars) appended as tool_result block" },
    { label: "Final answer", detail: '"Nezha 2 grossed over $2 billion worldwide, becoming the highest-grossing animated film ever."' },
  ],
  "What is 2 + 2?": [
    { label: "User message", detail: '"What is 2 + 2?"' },
    { label: "Claude: end_turn", detail: 'stop_reason="end_turn" — no tool needed' },
    { label: "Final answer", detail: '"4" — answered directly from internal knowledge, tool never invoked' },
  ],
};

export default function ToolUseLoopSandbox() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("What is the box office for Nezha 2?");
  const steps = SCENARIOS[scenario];
  const { activeIndex, playing, play, reset } = useStepPlayer(steps, 1100);

  function choose(s: keyof typeof SCENARIOS) {
    setScenario(s);
    reset();
  }

  return (
    <div className="sandbox">
      <h4>Sandbox — Anthropic Tool-Use Agentic Loop</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Step through the real decision loop from <code>tooluse_anthropic.ipynb</code>: Claude decides
        whether a question needs the Wikipedia tool, and only calls it when necessary.
      </p>
      <div className="pill-row">
        {Object.keys(SCENARIOS).map((s) => (
          <button key={s} className={s === scenario ? "active" : ""} onClick={() => choose(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="run-controls">
        <button onClick={play} disabled={playing}>{playing ? "Running…" : "▶ Run example"}</button>
        <button onClick={reset}>Reset</button>
      </div>
      <AnimatedFlow steps={steps} activeIndex={activeIndex} />
      <div className="step-payload fade-in" key={activeIndex}>
        {activeIndex >= 0 ? steps[activeIndex].detail : "Click \"Run example\" to step through the loop."}
      </div>
    </div>
  );
}
