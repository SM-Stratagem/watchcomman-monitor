"use client";
import { useEffect, useMemo, useState } from "react";

type Bucket = { hour: string; signals: number; news: number; high: number };
type Apply = { hour: string; iso: string; date: Date };

export function TimelineScrubber({ apiKey }: { apiKey?: string | null }) {
  const [hoursWindow, setHoursWindow] = useState<24 | 72 | 168 | 720>(168);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const url = `/api/v1/timeline?hours=${hoursWindow}` + (apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "");
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "API key required (the timeline is part of the gated API; add it in the box above)" : `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (!cancelled) { setBuckets(d.buckets ?? []); setIdx((d.buckets?.length ?? 1) - 1); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hoursWindow, apiKey]);

  const max = useMemo(() => Math.max(1, ...buckets.map((b) => Math.max(b.signals, b.news))), [buckets]);
  const cur: Apply | null = useMemo(() => {
    const b = buckets[idx];
    if (!b) return null;
    return { hour: b.hour, iso: b.hour, date: new Date(b.hour) };
  }, [buckets, idx]);

  return (
    <div className="wm-glass" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>TIME MACHINE · {hoursWindow}h WINDOW</div>
          <div style={{ marginTop: 6, fontSize: 22, color: "var(--ink-0)" }}>
            {cur ? cur.date.toUTCString().slice(0, 25) + " UTC" : loading ? "Loading…" : "—"}
          </div>
          {cur && buckets[idx] ? (
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-2)" }}>
              {buckets[idx].signals} signals · {buckets[idx].high} high+ · {buckets[idx].news} news in this hour
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[24, 72, 168, 720].map((h) => (
            <button
              key={h}
              onClick={() => setHoursWindow(h as 24 | 72 | 168 | 720)}
              className="wm-mono"
              style={{
                background: hoursWindow === h ? "var(--accent)" : "transparent",
                color: hoursWindow === h ? "var(--bg-0)" : "var(--ink-1)",
                border: "1px solid " + (hoursWindow === h ? "var(--accent)" : "var(--line-strong)"),
                padding: "4px 10px",
                borderRadius: 5,
                fontSize: 10,
                letterSpacing: "0.18em",
                cursor: "pointer",
              }}
            >
              {h < 168 ? `${h}H` : h === 168 ? "7D" : "30D"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="wm-mono" style={{ marginTop: 16, color: "var(--accent-warm)", fontSize: 11, padding: "10px 12px", border: "1px solid var(--accent-warm)", borderRadius: 6 }}>
          ⚠ {error}
        </div>
      ) : null}

      {/* Histogram */}
      <div style={{ marginTop: 18, height: 80, display: "flex", alignItems: "flex-end", gap: 1 }}>
        {buckets.map((b, i) => {
          const totalH = Math.max(2, Math.round((b.signals / max) * 70));
          const newsH = Math.round((b.news / max) * 70);
          const isCur = i === idx;
          return (
            <button
              key={b.hour}
              onMouseEnter={() => setIdx(i)}
              onFocus={() => setIdx(i)}
              title={`${b.hour} · ${b.signals} signals · ${b.news} news`}
              style={{
                flex: 1, minWidth: 1, height: "100%",
                display: "flex", flexDirection: "column-reverse",
                background: "transparent", border: "none", padding: 0, cursor: "pointer",
                outline: isCur ? "2px solid var(--accent)" : "none",
              }}
            >
              <div style={{ height: totalH, background: b.high > 0 ? "var(--accent-hot)" : "var(--accent)", opacity: isCur ? 1 : 0.7 }} />
              <div style={{ height: Math.min(newsH, 8), background: "var(--accent-cool)", opacity: 0.5 }} />
            </button>
          );
        })}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={Math.max(0, buckets.length - 1)}
        value={idx}
        onChange={(e) => setIdx(Number(e.target.value))}
        style={{ width: "100%", marginTop: 12 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-3)" }} className="wm-mono">
        <span>{buckets[0]?.hour.replace("T", " ").slice(0, 16) ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.hour.replace("T", " ").slice(0, 16) ?? ""}</span>
      </div>
    </div>
  );
}
