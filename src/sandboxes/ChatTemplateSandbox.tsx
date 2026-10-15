import { useState } from "react";

const TEMPLATES: Record<string, (sys: string, user: string) => string> = {
  Llama: (sys, user) => `[INST] <<SYS>>\n${sys}\n<</SYS>>\n\n${user} [/INST]`,
  ChatML: (sys, user) => `<|im_start|>system\n${sys}<|im_end|>\n<|im_start|>user\n${user}<|im_end|>\n<|im_start|>assistant\n`,
  Qwen: (sys, user) => `<|im_start|>system\n${sys}<|im_end|>\n<|im_start|>user\n${user}<|im_end|>\n<|im_start|>assistant\n`,
};

export default function ChatTemplateSandbox() {
  const [family, setFamily] = useState<keyof typeof TEMPLATES>("Qwen");
  const [sys, setSys] = useState("You are a helpful assistant.");
  const [user, setUser] = useState("Where is the baby bear?");

  return (
    <div className="sandbox">
      <h4>Sandbox — Chat Template Visualizer</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        Every chat-tuned model expects its own token format. Pick a family to see how the same
        system/user turn gets formatted via <code>apply_chat_template</code>.
      </p>
      <div className="pill-row">
        {Object.keys(TEMPLATES).map((f) => (
          <button key={f} className={f === family ? "active" : ""} onClick={() => setFamily(f as keyof typeof TEMPLATES)}>
            {f}
          </button>
        ))}
      </div>
      <label style={{ display: "block", marginBottom: 10 }}>
        System prompt
        <textarea rows={2} value={sys} onChange={(e) => setSys(e.target.value)} />
      </label>
      <label style={{ display: "block", marginBottom: 10 }}>
        User message
        <textarea rows={2} value={user} onChange={(e) => setUser(e.target.value)} />
      </label>
      <pre
        style={{
          background: "var(--code-bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 14,
          fontSize: 12.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {TEMPLATES[family](sys, user)}
      </pre>
    </div>
  );
}
