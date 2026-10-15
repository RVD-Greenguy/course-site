import { useMemo, useState } from "react";

// Mirrors the real QueryAnalysis logic from Lab1_introduction_to_agents_openAI.ipynb:
// intent/complexity/domain -> recommended_agent (FastAgent vs DeepThinkingAgent)
function analyze(query: string) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const complexWords = ["analyze", "trade-off", "trade-offs", "compare", "architecture", "design", "strategy", "explain"];
  const isComplex = words.length > 8 || complexWords.some((w) => query.toLowerCase().includes(w));
  const isQuestionMark = query.trim().endsWith("?") && words.length <= 5;

  const complexity = isComplex ? "complex" : words.length > 4 ? "medium" : "simple";
  const intent = isQuestionMark ? "question" : isComplex ? "research" : "task";
  const recommended_agent = isComplex ? "DeepThinkingAgent" : "FastAgent";

  return { intent, complexity, domain: "general", recommended_agent };
}

export default function RoutingSandbox() {
  const [query, setQuery] = useState("Analyze the trade-offs between microservices and monolithic architecture");
  const analysis = useMemo(() => analyze(query), [query]);

  return (
    <div className="sandbox">
      <h4>Sandbox — Conditional Routing (QueryAnalysis)</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Mirrors the real notebook's analyzer agent: classify a query's intent/complexity/domain,
        then route to <code>FastAgent</code> (gpt-5.4-mini) or <code>DeepThinkingAgent</code> (gpt-5.5).
        (Heuristic approximation here — the real version uses an LLM call with a Pydantic schema.)
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--code-bg)", color: "var(--text)", marginBottom: 16 }}
      />
      <div className="flow-step">
        <span className="flow-node">Query</span>
        <span className="flow-arrow">→</span>
        <span className="flow-node">QueryAnalyzer</span>
        <span className="flow-arrow">→</span>
        <span className="flow-node" style={{ borderColor: analysis.recommended_agent === "FastAgent" ? "var(--accent-2)" : "var(--accent-3)" }}>
          {analysis.recommended_agent}
        </span>
      </div>
      <table className="table" style={{ marginTop: 16 }}>
        <tbody>
          <tr><th>intent</th><td>{analysis.intent}</td></tr>
          <tr><th>complexity</th><td>{analysis.complexity}</td></tr>
          <tr><th>domain</th><td>{analysis.domain}</td></tr>
          <tr><th>recommended_agent</th><td>{analysis.recommended_agent}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
