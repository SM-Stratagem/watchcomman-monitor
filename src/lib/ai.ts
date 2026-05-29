// Real AI summarization. Reads ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY.
// Falls back to top headline if neither is set.

import type { NewsRow, SignalRow } from "./dashboard";
import { isIndependent, isStateMedia } from "./provenance";

const MODEL_ANTHROPIC = "claude-haiku-4-5-20251001";
const MODEL_OPENAI = "gpt-4o-mini";
const MODEL_GROQ = "llama-3.3-70b-versatile";
const MODEL_GEMINI = "gemini-2.5-flash";

type CacheEntry = { value: AiBrief; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 15 * 60 * 1000;

export type AiBrief = {
  headline: string;
  bullets: string[];
  theaters: Array<{ name: string; level: "HOT" | "ELEVATED" | "WATCH" | "STABLE"; note: string }>;
  generated: string;
  model: string | null;
  credibility: {
    sourcesAnalyzed: number;
    independentSources: number;
    stateMediaSources: number;
    confidence: "high" | "medium" | "low";
  };
};

function computeCredibility(news: NewsRow[]): AiBrief["credibility"] {
  const slugs = new Set(news.map((n) => n.sourceSlug));
  let independent = 0;
  let stateMedia = 0;
  for (const n of news) {
    if (isIndependent(n.sourceSlug, n.region)) independent++;
    else if (isStateMedia(n.sourceSlug, n.region)) stateMedia++;
  }
  const total = slugs.size;
  const indepRatio = total ? independent / news.length : 0;
  const confidence: AiBrief["credibility"]["confidence"] =
    total >= 12 && indepRatio >= 0.7 ? "high" : total >= 6 && indepRatio >= 0.5 ? "medium" : "low";
  return { sourcesAnalyzed: total, independentSources: independent, stateMediaSources: stateMedia, confidence };
}

function fallbackBrief(news: NewsRow[], signals: SignalRow[]): AiBrief {
  const head = news[0]?.title ?? signals[0]?.title ?? "Global situation nominal";
  const bullets = [...news.slice(0, 3), ...signals.slice(0, 2)]
    .map((x) => ("title" in x ? x.title : ""))
    .filter(Boolean)
    .slice(0, 4);
  return {
    headline: head,
    bullets,
    theaters: [
      { name: "Middle East", level: "HOT", note: "Active military strikes, hostage talks" },
      { name: "Eastern Europe", level: "ELEVATED", note: "Continued kinetic activity" },
      { name: "Indo-Pacific", level: "WATCH", note: "Taiwan Strait posturing" },
      { name: "Sahel", level: "ELEVATED", note: "Coup belt instability" },
    ],
    generated: new Date().toISOString(),
    model: null,
    credibility: computeCredibility(news),
  };
}

async function callAnthropic(prompt: string, key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL_ANTHROPIC,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

async function callOpenAI(prompt: string, key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL_OPENAI,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

async function callGroq(prompt: string, key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL_GROQ,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

async function callGemini(prompt: string, key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_GEMINI}:generateContent?key=${key}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      }),
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

function buildPrompt(news: NewsRow[], signals: SignalRow[]): string {
  const headlines = news.slice(0, 30).map((n) => `- [${n.sourceName}] ${n.title}`).join("\n");
  const sigText = signals.slice(0, 10).map((s) => `- [${s.severity.toUpperCase()}] ${s.title} (${s.country ?? s.region ?? ""})`).join("\n");
  return `You are an OSINT analyst. Based on the following global headlines from the past 12 hours and active disaster/conflict signals, produce a strictly neutral, non-partisan world brief.

HEADLINES:
${headlines}

ACTIVE SIGNALS:
${sigText}

Respond in JSON only (no markdown fences) with this exact schema:
{
  "headline": "single-sentence top-of-mind summary (max 200 chars)",
  "bullets": ["3-5 key developments, one sentence each, neutral wording"],
  "theaters": [
    {"name": "Middle East", "level": "HOT|ELEVATED|WATCH|STABLE", "note": "one-clause why"},
    {"name": "Eastern Europe", "level": "...", "note": "..."},
    {"name": "Indo-Pacific", "level": "...", "note": "..."},
    {"name": "Sahel", "level": "...", "note": "..."}
  ]
}
Do not editorialize. Cite no specific outlet by name in the output. Output JSON only.`;
}

function tryParseBrief(text: string): Partial<AiBrief> | null {
  // Strip code fences if any
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  // Find first { ... }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function getAiBrief(news: NewsRow[], signals: SignalRow[]): Promise<AiBrief> {
  const cacheKey = `brief:${news[0]?.id ?? "x"}:${signals[0]?.id ?? "x"}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const anth = process.env.ANTHROPIC_API_KEY;
  const oai = process.env.OPENAI_API_KEY;
  const groq = process.env.GROQ_API_KEY;
  const gem = process.env.GEMINI_API_KEY;
  if (!anth && !oai && !groq && !gem) {
    const fb = fallbackBrief(news, signals);
    cache.set(cacheKey, { value: fb, expiresAt: Date.now() + TTL_MS });
    return fb;
  }

  const prompt = buildPrompt(news, signals);
  let raw: string | null = null;
  let modelUsed: string | null = null;
  // Preference: Groq (fastest free) → Gemini → Anthropic → OpenAI
  if (groq) { raw = await callGroq(prompt, groq); modelUsed = raw ? "groq-llama-3.3-70b" : null; }
  if (!raw && gem) { raw = await callGemini(prompt, gem); modelUsed = raw ? "gemini-2.5-flash" : modelUsed; }
  if (!raw && anth) { raw = await callAnthropic(prompt, anth); modelUsed = raw ? "claude-haiku-4-5" : modelUsed; }
  if (!raw && oai) { raw = await callOpenAI(prompt, oai); modelUsed = raw ? "gpt-4o-mini" : modelUsed; }
  if (!raw) {
    const fb = fallbackBrief(news, signals);
    cache.set(cacheKey, { value: fb, expiresAt: Date.now() + 60_000 });
    return fb;
  }
  const parsed = tryParseBrief(raw);
  if (!parsed?.headline || !Array.isArray(parsed.bullets)) {
    const fb = fallbackBrief(news, signals);
    cache.set(cacheKey, { value: fb, expiresAt: Date.now() + 60_000 });
    return fb;
  }
  const brief: AiBrief = {
    headline: String(parsed.headline).slice(0, 280),
    bullets: (parsed.bullets || []).map((b: unknown) => String(b)).slice(0, 6),
    theaters: Array.isArray(parsed.theaters)
      ? parsed.theaters.slice(0, 5).map((t: { name?: string; level?: string; note?: string }) => ({
          name: String(t.name ?? ""),
          level: (["HOT", "ELEVATED", "WATCH", "STABLE"].includes(String(t.level)) ? t.level : "WATCH") as AiBrief["theaters"][number]["level"],
          note: String(t.note ?? ""),
        }))
      : fallbackBrief(news, signals).theaters,
    generated: new Date().toISOString(),
    model: modelUsed,
    credibility: computeCredibility(news),
  };
  cache.set(cacheKey, { value: brief, expiresAt: Date.now() + TTL_MS });
  return brief;
}
