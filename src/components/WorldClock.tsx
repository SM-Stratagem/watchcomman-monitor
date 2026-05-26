"use client";
import { useEffect, useState } from "react";

const CITIES: Array<{ tz: string; label: string; flag: string }> = [
  { tz: "UTC", label: "UTC", flag: "🛰" },
  { tz: "America/New_York", label: "New York", flag: "🇺🇸" },
  { tz: "America/Los_Angeles", label: "Los Angeles", flag: "🇺🇸" },
  { tz: "Europe/London", label: "London", flag: "🇬🇧" },
  { tz: "Europe/Berlin", label: "Berlin", flag: "🇩🇪" },
  { tz: "Europe/Moscow", label: "Moscow", flag: "🇷🇺" },
  { tz: "Asia/Jerusalem", label: "Jerusalem", flag: "🇮🇱" },
  { tz: "Asia/Tehran", label: "Tehran", flag: "🇮🇷" },
  { tz: "Asia/Dubai", label: "Dubai", flag: "🇦🇪" },
  { tz: "Asia/Kolkata", label: "New Delhi", flag: "🇮🇳" },
  { tz: "Asia/Shanghai", label: "Beijing", flag: "🇨🇳" },
  { tz: "Asia/Tokyo", label: "Tokyo", flag: "🇯🇵" },
  { tz: "Asia/Pyongyang", label: "Pyongyang", flag: "🇰🇵" },
  { tz: "Australia/Sydney", label: "Sydney", flag: "🇦🇺" },
];

export function WorldClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          WORLD CLOCK
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em" }}>LIVE</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {CITIES.map((c) => {
          const t = new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
          const day = new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, weekday: "short" }).format(now);
          return (
            <li key={c.tz} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 8, padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{c.flag}</span>
              <span style={{ fontSize: 11, color: "var(--ink-1)" }}>{c.label}</span>
              <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.16em" }}>{day}</span>
              <span className="wm-mono" style={{ fontSize: 12, color: "var(--ink-0)", letterSpacing: "0.06em" }}>{t}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
