import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({
  code,
  language = "python",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  return (
    <div style={{ margin: "14px 0", borderRadius: "var(--radius)", overflow: "hidden", border: "1px solid var(--border)" }}>
      {title && (
        <div
          style={{
            background: "var(--bg-panel-2)",
            padding: "6px 14px",
            fontSize: 12,
            color: "var(--text-dim)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {title}
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: "var(--code-bg)", fontSize: 13 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
