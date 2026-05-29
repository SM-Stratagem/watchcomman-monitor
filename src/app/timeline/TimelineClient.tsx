"use client";
import { useEffect, useState } from "react";
import { TimelineScrubber } from "@/components/TimelineScrubber";

const STORAGE_KEY = "wm:api_key:v1";

function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  try { return window.localStorage.getItem(STORAGE_KEY) ?? ""; } catch { return ""; }
}

export function TimelineClient() {
  const [apiKey, setApiKey] = useState<string>(loadApiKey);
  const [input, setInput] = useState<string>(apiKey);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, apiKey); } catch {}
  }, [apiKey]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="wm-glass" style={{ padding: 14 }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>API KEY</div>
        <p style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 6, marginBottom: 10 }}>
          The Time Machine reads the gated <code>/api/v1/timeline</code>. Paste your key (or set <code>API_PUBLIC_READ=1</code> server-side to disable the gate). Stored only in this browser.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="wm_live_…"
            className="wm-mono"
            style={{ flex: 1, background: "rgba(8,12,24,0.55)", border: "1px solid var(--line)", color: "var(--ink-0)", padding: "8px 10px", fontSize: 12, borderRadius: 6, outline: "none" }}
          />
          <button onClick={() => setApiKey(input.trim())} className="wm-mono" style={{ padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent", borderRadius: 6, fontSize: 10, letterSpacing: "0.18em", cursor: "pointer" }}>
            APPLY
          </button>
          {apiKey && <button onClick={() => { setApiKey(""); setInput(""); }} className="wm-mono" style={{ padding: "8px 14px", border: "1px solid var(--line-strong)", color: "var(--ink-3)", background: "transparent", borderRadius: 6, fontSize: 10, letterSpacing: "0.18em", cursor: "pointer" }}>CLEAR</button>}
        </div>
      </div>
      <TimelineScrubber apiKey={apiKey || null} />
    </div>
  );
}
