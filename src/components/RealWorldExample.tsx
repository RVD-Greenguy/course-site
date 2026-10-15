import { useState } from "react";

export interface RealWorldScenario {
  label: string;
  scenario: string;
  outcome: string;
}

export default function RealWorldExample({
  title,
  scenarios,
}: {
  title: string;
  scenarios: RealWorldScenario[];
}) {
  const [active, setActive] = useState(0);
  const s = scenarios[active];

  return (
    <div className="real-world">
      <div className="real-world-title">🌍 Real-world example — {title}</div>
      {scenarios.length > 1 && (
        <div className="pill-row" style={{ marginTop: 10 }}>
          {scenarios.map((sc, i) => (
            <button key={sc.label} className={i === active ? "active" : ""} onClick={() => setActive(i)}>
              {sc.label}
            </button>
          ))}
        </div>
      )}
      <div className="real-world-body fade-in" key={active}>
        <p className="real-world-scenario">{s.scenario}</p>
        <p className="real-world-outcome">→ {s.outcome}</p>
      </div>
    </div>
  );
}
