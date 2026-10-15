import * as cheerio from "cheerio";

// Free, keyless web search by scraping DuckDuckGo's HTML endpoint — the Node
// equivalent of Python's `ddgs` package used in the course notebooks.
export async function ddgsSearch(query, limit = 5) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; course-site-chat/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Search request failed: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];
  $(".result__body").each((_, el) => {
    if (results.length >= limit) return;
    const titleEl = $(el).find(".result__title a");
    const title = titleEl.text().trim();
    const href = titleEl.attr("href");
    const snippet = $(el).find(".result__snippet").text().trim();
    if (title && href) {
      results.push({ title, url: resolveRedirect(href), snippet });
    }
  });

  return results;
}

// DuckDuckGo's HTML result links are redirects (//duckduckgo.com/l/?uddg=<encoded-target>)
// rather than the real destination — unwrap them so links in the UI go somewhere useful.
function resolveRedirect(href) {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const target = url.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : href;
  } catch {
    return href;
  }
}

// Google Custom Search JSON API — needs a Programmable Search Engine (CSE) id
// and an API key, both free-tier (100 queries/day). Configure via
// GOOGLE_API_KEY and GOOGLE_CSE_ID in server/.env to enable "Google search"
// guardrail mode; without them this throws and the chat route surfaces a
// clear error instead of silently falling back to a different engine.
export async function googleSearch(query, limit = 5) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) {
    throw new Error("Google search mode needs GOOGLE_API_KEY and GOOGLE_CSE_ID set on the server.");
  }
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(
    cseId
  )}&num=${limit}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google search request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return (data.items || []).slice(0, limit).map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet || "",
  }));
}

// Dispatcher used by the chat route — keeps the engine choice (driven by the
// guardrail mode) out of index.js's request-handling logic.
export async function webSearch(query, engine, limit = 5) {
  if (engine === "google") return googleSearch(query, limit);
  return ddgsSearch(query, limit);
}
