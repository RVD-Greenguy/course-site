import { useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import Formula from "../components/Formula";
import Evidence from "../components/Evidence";

// A small "song library" with hand-picked feature vectors — the same idea as
// Spotify's real audio-features API (danceability, energy, valence, acousticness,
// tempo all 0-1 or normalized), shrunk to 4 dims so every component is visible.
// [energy, valence (mood: sad->happy), danceability, acousticness]
interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  vector: [number, number, number, number];
}

const LIBRARY: Song[] = [
  { id: "s1", title: "Blinding Lights", artist: "The Weeknd", genre: "Synth-pop", vector: [0.9, 0.8, 0.8, 0.1] },
  { id: "s2", title: "Levitating", artist: "Dua Lipa", genre: "Disco-pop", vector: [0.85, 0.85, 0.9, 0.05] },
  { id: "s3", title: "As It Was", artist: "Harry Styles", genre: "Pop", vector: [0.6, 0.55, 0.65, 0.2] },
  { id: "s4", title: "Flowers", artist: "Miley Cyrus", genre: "Pop", vector: [0.65, 0.6, 0.7, 0.15] },
  { id: "s5", title: "Someone Like You", artist: "Adele", genre: "Ballad", vector: [0.2, 0.15, 0.25, 0.75] },
  { id: "s6", title: "Easy On Me", artist: "Adele", genre: "Ballad", vector: [0.25, 0.2, 0.3, 0.7] },
  { id: "s7", title: "Blinding (Acoustic)", artist: "Cover Artist", genre: "Acoustic", vector: [0.3, 0.65, 0.35, 0.8] },
  { id: "s8", title: "Starboy", artist: "The Weeknd", genre: "Synth-pop", vector: [0.8, 0.6, 0.75, 0.1] },
  { id: "s9", title: "Say So", artist: "Doja Cat", genre: "Disco-pop", vector: [0.8, 0.9, 0.85, 0.08] },
  { id: "s10", title: "Skinny Love", artist: "Bon Iver", genre: "Folk", vector: [0.15, 0.1, 0.2, 0.85] },
  { id: "s11", title: "Fast Car", artist: "Tracy Chapman", genre: "Folk", vector: [0.3, 0.4, 0.3, 0.8] },
  { id: "s12", title: "Industry Baby", artist: "Lil Nas X", genre: "Hip-hop", vector: [0.95, 0.75, 0.9, 0.05] },
];

function dot(a: number[], b: number[]) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function magnitude(a: number[]) {
  return Math.sqrt(dot(a, a));
}
function cosineSimilarity(a: number[], b: number[]) {
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dot(a, b) / denom;
}

const DIM_LABELS = ["Energy", "Valence (mood)", "Danceability", "Acousticness"];

export default function MusicVectorDbSandbox() {
  const [nowPlayingId, setNowPlayingId] = useState("s1");
  const nowPlaying = LIBRARY.find((s) => s.id === nowPlayingId)!;

  const ranked = useMemo(() => {
    return LIBRARY
      .filter((s) => s.id !== nowPlayingId)
      .map((s) => ({ ...s, similarity: cosineSimilarity(nowPlaying.vector, s.vector) }))
      .sort((a, b) => b.similarity - a.similarity);
  }, [nowPlayingId, nowPlaying]);

  const nextUp = ranked[0];

  const scatterData = LIBRARY.map((s) => ({
    x: s.vector[0], // energy
    y: s.vector[1], // valence
    z: s.id === nowPlayingId ? 400 : s.id === nextUp.id ? 300 : 150,
    title: s.title,
    isNowPlaying: s.id === nowPlayingId,
    isNext: s.id === nextUp.id,
  }));

  return (
    <div className="sandbox">
      <h4>Live demo — "Up Next" from a Vector Database (song recommendation)</h4>
      <Evidence
        kind="external"
        source="Modeled on Spotify's published audio-features API (danceability, energy, valence, acousticness) — not in Day 3 course materials"
        note="Real music recommenders (Spotify, YouTube Music) embed every track into a feature vector exactly like this (just 100s of dims instead of 4) and store it in a vector DB (Chroma/Pinecone/Milvus) so 'find songs like this one' is a nearest-neighbor query, not a manual genre tag lookup."
      />

      <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
        Pick a "Now Playing" song — each track is a 4-dimensional vector (Energy, Valence/mood,
        Danceability, Acousticness), the same structure ChromaDB stores for text chunks in the RAG
        pipeline above, just with audio features instead of sentence embeddings.
      </p>

      <div className="pill-row">
        {LIBRARY.map((s) => (
          <button
            key={s.id}
            className={s.id === nowPlayingId ? "active" : ""}
            onClick={() => setNowPlayingId(s.id)}
            title={`${s.title} — ${s.artist}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "14px 0" }}>
        <div className="card" style={{ margin: 0, borderColor: "var(--accent)" }}>
          <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase" }}>▶ Now Playing</div>
          <strong>{nowPlaying.title}</strong> — {nowPlaying.artist}
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{nowPlaying.genre}</div>
          <div style={{ fontFamily: "monospace", fontSize: 11.5, marginTop: 8, color: "var(--text-dim)" }}>
            [{nowPlaying.vector.map((v) => v.toFixed(2)).join(", ")}]
          </div>
        </div>
        <div className="card" style={{ margin: 0, borderColor: "var(--accent-2)" }}>
          <div style={{ fontSize: 11, color: "var(--accent-2)", textTransform: "uppercase" }}>⏭ Up Next (nearest neighbor)</div>
          <strong>{nextUp.title}</strong> — {nextUp.artist}
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{nextUp.genre}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent-2)", marginTop: 8 }}>
            cos = {nextUp.similarity.toFixed(3)}
          </div>
        </div>
      </div>

      <Formula
        tex="\mathrm{sim}(q, s) = \frac{\vec{q}\cdot\vec{s}}{\|\vec{q}\|\,\|\vec{s}\|}"
        caption="q = now-playing vector, s = candidate song vector. The vector DB computes this against every indexed song and returns the highest score — exactly the ANN (approximate nearest neighbor) query ChromaDB runs for text, just over audio features here."
      />

      <h5 style={{ marginBottom: 6 }}>Vector space — Energy vs Valence (closer dots = more similar)</h5>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
          <XAxis type="number" dataKey="x" domain={[0, 1]} name="Energy" stroke="#9aa3b2" fontSize={11} label={{ value: "Energy", position: "insideBottom", offset: -5, fill: "#9aa3b2", fontSize: 11 }} />
          <YAxis type="number" dataKey="y" domain={[0, 1]} name="Valence" stroke="#9aa3b2" fontSize={11} label={{ value: "Valence (mood)", angle: -90, position: "insideLeft", fill: "#9aa3b2", fontSize: 11 }} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip
            contentStyle={{ background: "#171a21", border: "1px solid #2a2f3a" }}
            formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
            labelFormatter={() => ""}
            content={({ payload }) => {
              if (!payload || !payload.length) return null;
              const p = payload[0].payload;
              return (
                <div style={{ background: "#171a21", border: "1px solid #2a2f3a", padding: 8, fontSize: 12 }}>
                  <strong>{p.title}</strong>
                  <div>energy={p.x.toFixed(2)}, valence={p.y.toFixed(2)}</div>
                </div>
              );
            }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((d, i) => (
              <Cell
                key={i}
                fill={d.isNowPlaying ? "#7c9eff" : d.isNext ? "#68d7a0" : "#f0a86099"}
                stroke={d.isNowPlaying || d.isNext ? "#fff" : "none"}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: -6 }}>
        🔵 now playing · 🟢 up next (nearest neighbor) · 🟠 rest of the library
      </p>

      <h5>Full ranked list (all 4 dimensions, not just the 2 plotted)</h5>
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th><th>Song</th><th>Genre</th>
            {DIM_LABELS.map((d) => <th key={d} style={{ fontSize: 10.5 }}>{d}</th>)}
            <th>cosine sim</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((s, i) => (
            <tr key={s.id} style={{ background: i === 0 ? "rgba(104, 215, 160, 0.08)" : undefined }}>
              <td>{i + 1}</td>
              <td>{s.title}</td>
              <td style={{ fontSize: 12 }}>{s.genre}</td>
              {s.vector.map((v, j) => <td key={j} style={{ fontSize: 11.5 }}>{v.toFixed(2)}</td>)}
              <td style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "var(--accent-2)" : undefined }}>
                {s.similarity.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
        Switch "Now Playing" between a high-energy pop track and a slow ballad — notice "Up Next"
        jumps from other high-energy/high-valence tracks to other slow/acoustic ones, purely from
        vector distance, with zero hand-written genre rules.
      </p>
    </div>
  );
}
