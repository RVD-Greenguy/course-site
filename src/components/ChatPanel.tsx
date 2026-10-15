import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchModels, fetchGuardrailModes, sendChatMessage,
  type ChatModel, type ChatSource, type GuardrailMode, type SiteLink,
} from "../lib/api";

interface Message {
  role: "user" | "assistant" | "blocked";
  content: string;
  sources?: ChatSource[];
  toolCalls?: { name: string; query: string; error?: string }[];
  siteLinks?: SiteLink[];
}

const GUARDRAIL_STORAGE_KEY = "course-site-guardrail-mode";

export default function ChatPanel() {
  const [models, setModels] = useState<ChatModel[]>([]);
  const [model, setModel] = useState("");
  const [guardrailModes, setGuardrailModes] = useState<GuardrailMode[]>([]);
  const [guardrailMode, setGuardrailMode] = useState(
    () => localStorage.getItem(GUARDRAIL_STORAGE_KEY) || "course"
  );
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels()
      .then((m) => {
        setModels(m);
        setModel(m[0]?.id ?? "");
      })
      .catch(() => setError("Couldn't reach the search backend — is the server running?"));
    fetchGuardrailModes()
      .then(setGuardrailModes)
      .catch(() => {});
  }, []);

  function handleGuardrailChange(id: string) {
    setGuardrailMode(id);
    localStorage.setItem(GUARDRAIL_STORAGE_KEY, id);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setResultsOpen(true);
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await sendChatMessage({ message: text, model, history, guardrailMode });
      if (res.blocked) {
        setMessages((prev) => [...prev, { role: "blocked", content: res.reason || "Blocked by guardrails." }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.reply || "",
            sources: res.sources,
            toolCalls: res.toolCalls,
            siteLinks: res.siteLinks,
          },
        ]);
      }
    } catch {
      setError("Request failed. Is the search backend reachable?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-bar-wrap">
      <div className="search-bar">
        <span className="search-bar-icon">🔎</span>
        <input
          type="text"
          placeholder="Search this course site — Day 1-4, Group Project, Model Evaluation…"
          value={input}
          onFocus={() => messages.length > 0 && setResultsOpen(true)}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
            if (e.key === "Escape") setResultsOpen(false);
          }}
        />
        <select
          className="search-bar-guardrail"
          value={guardrailMode}
          onChange={(e) => handleGuardrailChange(e.target.value)}
          disabled={guardrailModes.length === 0}
          title="Guardrail mode"
        >
          {guardrailModes.length === 0 && <option>Loading…</option>}
          {guardrailModes.map((m) => (
            <option key={m.id} value={m.id} title={m.description}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="search-bar-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={models.length === 0}
          title="Model"
        >
          {models.length === 0 && <option>Loading…</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button onClick={handleSend} disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
        {messages.length > 0 && (
          <button
            className="search-bar-collapse"
            onClick={() => setResultsOpen((v) => !v)}
            aria-label={resultsOpen ? "Collapse results" : "Expand results"}
          >
            {resultsOpen ? "▲" : "▼"}
          </button>
        )}
      </div>

      {error && <div className="chat-blocked">{error}</div>}

      {resultsOpen && messages.length > 0 && (
        <div className="search-results" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-message chat-message-${m.role}`}>
              {m.role === "blocked" ? (
                <div className="chat-blocked">🛑 Guardrail — {m.content}</div>
              ) : (
                <>
                  {m.siteLinks && m.siteLinks.length > 0 && (
                    <div className="chat-site-links">
                      {m.siteLinks.map((l) => (
                        <Link key={l.path} to={l.path} className="chat-site-link" onClick={() => setResultsOpen(false)}>
                          <span className="chat-site-link-icon">📄</span>
                          <span>
                            <span className="chat-site-link-title">{l.title}</span>
                            <span className="chat-site-link-blurb">{l.blurb}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="chat-message-bubble">{m.content}</div>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="chat-tool-note">
                      {m.toolCalls.some((t) => t.error) ? "⚠ search failed: " : "🔎 searched: "}
                      {m.toolCalls.map((t) => t.error || t.query).join(", ")}
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="chat-sources">
                      {m.sources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="chat-source-link">
                          {s.title}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {loading && <div className="chat-message chat-message-assistant chat-message-loading">thinking…</div>}
        </div>
      )}
    </div>
  );
}
