import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// Renders a LaTeX formula via KaTeX, with an optional caption underneath
// (e.g. "where N = model params, D = training tokens").
export default function Formula({
  tex,
  caption,
  inline = false,
}: {
  tex: string;
  caption?: string;
  inline?: boolean;
}) {
  if (inline) return <InlineMath math={tex} />;

  return (
    <div
      style={{
        background: "var(--code-bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        margin: "10px 0",
        overflowX: "auto",
      }}
    >
      <BlockMath math={tex} />
      {caption && (
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{caption}</div>
      )}
    </div>
  );
}
