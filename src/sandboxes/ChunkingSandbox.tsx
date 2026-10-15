import { useMemo, useState } from "react";
import Evidence from "../components/Evidence";

const DEFAULT_TEXT =
  "Marley was dead, to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it. And Scrooge's name was good upon 'Change for anything he chose to put his hand to. Old Marley was as dead as a door-nail.";

const COLORS = ["#7c9eff33", "#68d7a033", "#f0a86033", "#e07a7a33"];

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  if (chunkSize <= 0) return [text];
  const step = Math.max(1, chunkSize - overlap);
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += step) {
    chunks.push(text.slice(i, i + chunkSize));
    if (i + chunkSize >= text.length) break;
  }
  return chunks;
}

export default function ChunkingSandbox() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [chunkSize, setChunkSize] = useState(80);
  const [overlap, setOverlap] = useState(15);

  const chunks = useMemo(() => chunkText(text, chunkSize, overlap), [text, chunkSize, overlap]);

  return (
    <div className="sandbox">
      <h4>Sandbox — RecursiveCharacterTextSplitter Visualizer</h4>
      <Evidence
        kind="course"
        source="Day 3 slides, p.71 — recursive chunking worked example"
        note="Slide's own numeric example: a 1,850-token section splits into Paragraph A (620 tokens) and Paragraph B (1,230 tokens), which further split into sub-chunks of 430/510/290 tokens. Below is the same idea on editable text (character-width windows, not the real recursive-separator-priority logic LangChain uses)."
      />
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Edit the text and chunk_size/chunk_overlap to see how the splitter would carve it up before
        embedding (simplified: fixed-width windows, not the real recursive-separator logic).
      </p>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" }}>
        <label>
          chunk_size: {chunkSize}
          <input type="range" min={20} max={200} step={5} value={chunkSize} onChange={(e) => setChunkSize(+e.target.value)} />
        </label>
        <label>
          chunk_overlap: {overlap}
          <input type="range" min={0} max={chunkSize - 1} step={5} value={overlap} onChange={(e) => setOverlap(+e.target.value)} />
        </label>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>{chunks.length} chunks</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {chunks.map((c, i) => (
          <div
            key={i}
            style={{
              background: COLORS[i % COLORS.length],
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 12.5,
            }}
          >
            <span style={{ color: "var(--text-dim)", marginRight: 8 }}>#{i}</span>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
