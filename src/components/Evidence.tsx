import type { ReactNode } from "react";

// Distinguishes content lifted directly from the course slides/notebooks
// (kind="course", with a page/cell citation) from content we had to supply
// ourselves because the course materials skip it (kind="external"). The user
// explicitly wants to know which is which, so the two render with visibly
// different borders/labels rather than just a text label.
export default function Evidence({
  kind,
  source,
  note,
  children,
}: {
  kind: "course" | "external";
  source: string;
  note?: string;
  children?: ReactNode;
}) {
  const isCourse = kind === "course";
  return (
    <div
      style={{
        border: `1px ${isCourse ? "solid" : "dashed"} ${isCourse ? "var(--accent-2)" : "var(--accent-3)"}`,
        borderRadius: "var(--radius)",
        padding: "12px 16px",
        margin: "10px 0",
        background: "var(--bg-panel-2)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: isCourse ? "var(--accent-2)" : "var(--accent-3)",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {isCourse ? "📄 From course materials" : "⚠ Not in course materials — standard reference"} · {source}
      </div>
      {note && <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: children ? 6 : 0 }}>{note}</div>}
      {children && <div style={{ fontSize: 13.5 }}>{children}</div>}
    </div>
  );
}
