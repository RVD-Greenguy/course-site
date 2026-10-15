import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/day/1", label: "Day 1 · Summarization & Multimodal" },
  { to: "/day/2", label: "Day 2 · LoRA Fine-tuning" },
  { to: "/day/3", label: "Day 3 · Document Loaders & RAG" },
  { to: "/day/4", label: "Day 4 · Pre-training & Agentic AI" },
  { to: "/project", label: "★ Group Project" },
  { to: "/model-evaluation", label: "Model Training Evaluation" },
  { to: "/cheatsheet", label: "Cheatsheet" },
  { to: "/resources", label: "Resources" },
];

export default function Sidebar() {
  return (
    <nav
      style={{
        width: 260,
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        position: "sticky",
        top: 56,
        height: "calc(100vh - 56px)",
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, padding: "0 8px" }}>
        Custom Generative AI
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10, padding: "0 8px" }}>
        Systems for Enterprises · NUS-ISS
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginBottom: 20, padding: "0 8px", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--accent)" }}>Group 7</strong>
        <br />
        Goh Kok Boon
        <br />
        Ravikkumar Vignesh Kumar
        <br />
        Yap Wen Lai
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            style={({ isActive }) => ({
              padding: "9px 10px",
              borderRadius: 7,
              fontSize: 13,
              color: isActive ? "var(--bg)" : "var(--text)",
              background: isActive ? "var(--accent)" : "transparent",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
