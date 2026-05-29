"use client";
import { useEffect, useState } from "react";
import type { NewsRow, SignalRow } from "@/lib/dashboard";
import { affiliationColor, affiliationLabel, flagEmoji, getProvenance } from "@/lib/provenance";
import { formatRelative, severityColor } from "@/lib/format";

const STORAGE_KEY = "wm:watchlist:v1";

type Match = { count: number; news: NewsRow[]; signals: SignalRow[]; terms?: string[] };

function loadStoredTerms(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

export function WatchlistManager() {
  const [terms, setTerms] = useState<string[]>(loadStoredTerms);
  const [input, setInput] = useState("");
  const [data, setData] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(terms)); } catch {}
    if (terms.length === 0) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/v1/watchlist?q=${encodeURIComponent(terms.join(","))}&sinceHours=72`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [terms]);

  // When no terms are tracked, ignore any prior data — derived, not stateful.
  const display: Match | null = terms.length === 0 ? null : data;

  const addTerm = () => {
    const t = input.trim();
    if (!t) return;
    if (terms.some((x) => x.toLowerCase() === t.toLowerCase())) { setInput(""); return; }
    setTerms([...terms, t]);
    setInput("");
  };
  const removeTerm = (t: string) => setTerms(terms.filter((x) => x !== t));
  const clear = () => setTerms([]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2.2fr)", gap: 14 }}>
      {/* LEFT: term input + list */}
      <div className="wm-glass" style={{ padding: 16 }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>WATCHLIST</div>
        <h2 style={{ fontSize: 18, color: "var(--ink-0)", margin: "6px 0 10px" }}>Entities & keywords</h2>
        <p style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.5 }}>
          Track entities, regions, technologies, or any keyword. Saved locally — never sent anywhere except as a search query.
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTerm()}
            placeholder="e.g. tsmc, taiwan strait, kalibr"
            className="wm-mono"
            style={{
              flex: 1,
              background: "rgba(8,12,24,0.55)",
              border: "1px solid var(--line)",
              color: "var(--ink-0)",
              padding: "8px 10px",
              fontSize: 12,
              borderRadius: 6,
              outline: "none",
            }}
          />
          <button
            onClick={addTerm}
            className="wm-mono"
            style={{ padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent", borderRadius: 6, fontSize: 10, letterSpacing: "0.18em", cursor: "pointer" }}
          >
            ADD
          </button>
        </div>
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {terms.length === 0 ? (
            <span className="wm-mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.16em" }}>NO TERMS · ADD ONE TO BEGIN</span>
          ) : (
            terms.map((t) => (
              <span key={t} className="wm-mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--ink-0)", padding: "4px 8px", border: "1px solid var(--accent)", borderRadius: 999, letterSpacing: "0.12em" }}>
                {t}
                <button onClick={() => removeTerm(t)} style={{ background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer", padding: 0, fontSize: 12 }}>×</button>
              </span>
            ))
          )}
        </div>
        {terms.length > 0 && (
          <button onClick={clear} className="wm-mono" style={{ marginTop: 12, padding: "6px 10px", border: "1px solid var(--line-strong)", background: "transparent", color: "var(--ink-3)", fontSize: 10, letterSpacing: "0.16em", cursor: "pointer", borderRadius: 4 }}>
            CLEAR ALL
          </button>
        )}
      </div>

      {/* RIGHT: results */}
      <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 360 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>RESULTS</div>
            <div style={{ fontSize: 14, color: "var(--ink-0)", marginTop: 2 }}>
              {loading ? "Scanning…" : display ? `${(display.news.length + display.signals.length).toLocaleString()} matches across ${terms.length} term${terms.length === 1 ? "" : "s"}` : "Add a term to start watching"}
            </div>
          </div>
          {display && display.news.length + display.signals.length > 0 && (
            <a
              className="wm-mono"
              href={`/briefing?watchlist=${encodeURIComponent(terms.join(","))}`}
              style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}
            >EXPORT BRIEF ↗</a>
          )}
        </div>
        <div style={{ overflow: "auto", flex: 1 }}>
          {display?.signals && display.signals.length > 0 && (
            <div>
              <div className="wm-mono" style={{ padding: "8px 14px", fontSize: 9, color: "var(--accent-warm)", letterSpacing: "0.22em", borderBottom: "1px solid var(--line)" }}>
                SIGNALS · {display.signals.length}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {display.signals.map((s) => (
                  <li key={s.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                      <span className="wm-mono" style={{ fontSize: 9, color: severityColor(s.severity), letterSpacing: "0.16em" }}>
                        {s.severity.toUpperCase()} · {s.source}
                      </span>
                      <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{formatRelative(s.occurredAt)}</span>
                    </div>
                    <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>{s.title}</div>
                    {s.country && <div style={{ marginTop: 2, color: "var(--ink-3)", fontSize: 10 }}>{s.country} · {s.region}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {display?.news && display.news.length > 0 && (
            <div>
              <div className="wm-mono" style={{ padding: "8px 14px", fontSize: 9, color: "var(--accent-cool)", letterSpacing: "0.22em", borderBottom: "1px solid var(--line)" }}>
                NEWS · {display.news.length}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {display.news.map((n) => {
                  const p = getProvenance(n.sourceSlug, n.region);
                  return (
                    <li key={n.id} style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <a href={n.link} target="_blank" rel="noopener noreferrer">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                            <span>{flagEmoji(p.country)}</span>
                            <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em" }}>{n.sourceName}</span>
                            <span
                              className="wm-mono"
                              style={{ fontSize: 8, color: affiliationColor(p.affiliation), border: `1px solid ${affiliationColor(p.affiliation)}`, padding: "0 5px", borderRadius: 3, letterSpacing: "0.12em" }}
                            >
                              {affiliationLabel(p.affiliation)}
                            </span>
                          </span>
                          <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{formatRelative(n.publishedAt)}</span>
                        </div>
                        <div style={{ marginTop: 3, color: "var(--ink-0)", fontSize: 12, lineHeight: 1.35 }}>{n.title}</div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!loading && (!display || (display.news.length === 0 && display.signals.length === 0)) && terms.length > 0 && (
            <div className="wm-mono" style={{ padding: 18, textAlign: "center", color: "var(--ink-3)", fontSize: 11 }}>
              NO MATCHES IN LAST 72H · TRY BROADER TERMS
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
