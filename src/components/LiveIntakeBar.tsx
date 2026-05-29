"use client";
import { useEffect, useState } from "react";

type Snapshot = {
  signals: number;
  high: number;
  flights: number;
  news24: number;
  ingestSecondsAgo: number | null;
};

const initial: Snapshot = { signals: 0, high: 0, flights: 0, news24: 0, ingestSecondsAgo: null };

// Polls every 30s and shows what just came in.
export function LiveIntakeBar() {
  const [snap, setSnap] = useState<Snapshot>(initial);
  const [tick, setTick] = useState<number>(0);

  // Poll the public /api/live counter endpoint every 30s.
  useEffect(() => {
    let cancelled = false;
    const fetchSnap = async () => {
      try {
        const r = await fetch("/api/live");
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        const ingestAt = d.lastIngestAt ? new Date(d.lastIngestAt).getTime() : null;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSnap({
          signals: d.activeSignals ?? 0,
          high: d.highSeverity ?? 0,
          flights: d.flightCount ?? 0,
          news24: d.news24 ?? 0,
          ingestSecondsAgo: ingestAt ? Math.max(0, Math.floor((Date.now() - ingestAt) / 1000)) : null,
        });
      } catch {}
    };
    fetchSnap();
    const id = setInterval(fetchSnap, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Live seconds counter (1Hz) so "ago" updates between fetches.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = (s: number | null) => {
    if (s == null) return "—";
    const now = s + tick;
    if (now < 60) return `${now}s ago`;
    if (now < 3600) return `${Math.floor(now / 60)}m ago`;
    return `${Math.floor(now / 3600)}h ago`;
  };

  return (
    <div className="wm-glass" style={{
      padding: "12px 18px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 18,
      alignItems: "center",
      borderRadius: 12,
      background: "linear-gradient(180deg, rgba(20,28,52,0.85), rgba(10,14,28,0.85))",
      borderColor: "var(--line-strong)",
    }}>
      <Item icon="●" label="LIVE" value="ON AIR" accent="var(--accent)" pulse />
      <Item icon="✈" label="LIVE FLIGHTS" value={snap.flights.toLocaleString()} accent="var(--accent-cool)" sub="refreshing every 45s" />
      <Item icon="●" label="ACTIVE SIGNALS" value={snap.signals.toLocaleString()} accent="var(--accent-warm)" sub={`${snap.high} high+`} />
      <Item icon="📰" label="NEWS · 24H" value={snap.news24.toLocaleString()} accent="var(--accent)" sub="380+ sources" />
      <Item icon="⟳" label="LAST INGEST" value={ago(snap.ingestSecondsAgo)} accent="var(--accent)" sub="auto every 30 min" />
      <Item icon="🚢" label="CHOKEPOINTS" value="8 monitored" accent="var(--accent-warm)" sub="live risk scoring" />
    </div>
  );
}

function Item({ icon, label, value, accent, sub, pulse }: { icon: string; label: string; value: string; accent: string; sub?: string; pulse?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18, color: accent, opacity: pulse ? undefined : 0.9 }} className={pulse ? undefined : undefined}>
        {pulse ? <span className="wm-pulse" aria-hidden style={{ background: accent }} /> : icon}
      </span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>{label}</span>
        <span style={{ fontSize: 16, color: "var(--ink-0)", fontWeight: 500, marginTop: 4 }}>{value}</span>
        {sub ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em", marginTop: 2 }}>{sub}</span> : null}
      </div>
    </div>
  );
}
