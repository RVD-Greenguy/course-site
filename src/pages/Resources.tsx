import { day1Resources } from "../data/day1";
import { day2Resources } from "../data/day2";
import { day3Resources } from "../data/day3";
import { day4Resources } from "../data/day4";

const groups = [
  { title: "Day 1 — Summarization & Multimodal", items: day1Resources },
  { title: "Day 2 — Fine-tuning (LoRA)", items: day2Resources },
  { title: "Day 3 — Document Loaders & RAG", items: day3Resources },
  { title: "Day 4 — Pre-training & Agentic AI", items: day4Resources },
];

export default function Resources() {
  return (
    <div>
      <h1>Resources</h1>
      <p style={{ color: "var(--text-dim)" }}>Curated external links, organized by day.</p>
      {groups.map((g) => (
        <div key={g.title}>
          <h2>{g.title}</h2>
          <ul className="link-list">
            {g.items.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
                <span className="desc">{r.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
