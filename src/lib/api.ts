export interface ChatModel {
  id: string;
  label: string;
}

export interface GuardrailMode {
  id: string;
  label: string;
  description: string;
}

export interface ChatSource {
  title: string;
  url: string;
  snippet: string;
}

export interface SiteLink {
  path: string;
  title: string;
  blurb: string;
}

export interface ChatResponse {
  blocked: boolean;
  reason?: string;
  reply?: string;
  sources?: ChatSource[];
  toolCalls?: { name: string; query: string; error?: string }[];
  guardrailMode?: string;
  siteLinks?: SiteLink[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function fetchModels(): Promise<ChatModel[]> {
  const res = await fetch("/api/models");
  if (!res.ok) throw new Error(`Failed to load models (${res.status})`);
  const data = await res.json();
  return data.models;
}

export async function fetchGuardrailModes(): Promise<GuardrailMode[]> {
  const res = await fetch("/api/guardrail-modes");
  if (!res.ok) throw new Error(`Failed to load guardrail modes (${res.status})`);
  const data = await res.json();
  return data.modes;
}

export async function sendChatMessage(params: {
  message: string;
  model: string;
  history: ChatHistoryMessage[];
  guardrailMode: string;
}): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Chat request failed (${res.status})`);
  return res.json();
}
