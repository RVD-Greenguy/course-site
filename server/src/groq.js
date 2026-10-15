const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function groqChatCompletion({ model, messages, tools, toolChoice }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set on the server.");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, tools, tool_choice: tools ? toolChoice ?? "auto" : undefined }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq request failed (${res.status}): ${body}`);
  }

  return res.json();
}
