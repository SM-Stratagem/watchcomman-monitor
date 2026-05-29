"use client";
import { useEffect, useMemo, useState } from "react";
import type { SignalRow } from "@/lib/dashboard";
import { LAYERS, type MapMarker } from "@/lib/map-layers";
import { severityColor } from "@/lib/format";
import { LiveVesselsOverlay } from "./LiveVesselsOverlay";
import { CHOKEPOINTS } from "@/lib/maritime";

const W = 1800;
const H = 900;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

const SEV_R: Record<string, number> = { critical: 9, high: 7, elevated: 5.5, moderate: 4.4, low: 3.4 };

type Flight = { icao24: string; callsign: string; lat: number; lng: number; alt: number | null; heading: number | null };

// Tiny simplified world borders fetched from CDN (natural earth via geojson).
// We use a public mirror; if it 404s, we silently fall back to grid only.
const WORLD_GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Topo = { type: "Topology"; objects: { countries: unknown }; arcs: number[][][]; transform?: { scale: [number, number]; translate: [number, number] } };

export function OsintMap({ signals }: { signals: SignalRow[] }) {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.slug, l.defaultOn])),
  );
  const [hover, setHover] = useState<{ kind: "signal"; sig: SignalRow } | { kind: "marker"; m: MapMarker; layer: string } | { kind: "flight"; f: Flight } | null>(null);
  const [sevFilter, setSevFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showFlights, setShowFlights] = useState(true);
  const [showShips, setShowShips] = useState(true);
  const [borderPaths, setBorderPaths] = useState<string>("");
  const [flightsUpdatedAt, setFlightsUpdatedAt] = useState<number>(0);

  // Lazy-load country borders
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        if (!res.ok) return;
        const topo = (await res.json()) as Topo;
        const paths = topojsonToSvgPaths(topo);
        if (!cancelled) setBorderPaths(paths);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Live flights — refresh every 45s for a steadier "live" feel.
  useEffect(() => {
    if (!showFlights) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/v1/flights");
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFlights(d.flights ?? []);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFlightsUpdatedAt(Date.now());
        }
      } catch {}
    };
    tick();
    const t = setInterval(tick, 45_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [showFlights]);

  const visibleSignals = useMemo(() => signals.filter((s) => {
    if (s.latitude == null || s.longitude == null) return false;
    if (sevFilter && s.severity !== sevFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(s.title.toLowerCase().includes(q) || (s.country ?? "").toLowerCase().includes(q) || (s.region ?? "").toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  }), [signals, sevFilter, query]);

  const totalActiveCount = visibleSignals.length;
  const layerCount = LAYERS.filter((l) => activeLayers[l.slug]).reduce((sum, l) => sum + l.data.length, 0);
  // 1Hz ticker so the "Xs ago" updates between fetches without re-running the polling effect.
  const [nowMs, setNowMs] = useState<number>(0);
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const lastFlightUpdate = flightsUpdatedAt && nowMs ? Math.max(0, Math.floor((nowMs - flightsUpdatedAt) / 1000)) : 0;

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "radial-gradient(ellipse at center, #0a1024 0%, #04060c 60%)" }}>
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", gap: 10, flexWrap: "wrap",
        background: "linear-gradient(180deg, rgba(4,6,12,0.85), rgba(4,6,12,0))",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="wm-pulse" aria-hidden style={{ background: "var(--accent)" }} />
            <span className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.22em" }}>LIVE INTAKE</span>
          </span>
          <span className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.18em" }}>
            ✈ <strong style={{ color: "var(--accent-cool)" }}>{flights.length.toLocaleString()}</strong> AIRCRAFT
            {" · "}🚢 <strong style={{ color: "var(--accent-warm)" }}>{showShips ? CHOKEPOINTS.length : 0}</strong> CHOKEPOINTS
            {" · "}● <strong style={{ color: severityColor("high") }}>{totalActiveCount}</strong> SIGNALS
            {" · "}📡 <strong>{layerCount}</strong> STRATEGIC SITES
            {showFlights && lastFlightUpdate > 0 ? ` · ↻ ${lastFlightUpdate}s ago` : ""}
          </span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country, region, keyword…"
          className="wm-mono"
          style={{
            background: "rgba(0,0,0,0.4)", border: "1px solid var(--line-strong)",
            padding: "5px 12px", borderRadius: 999, color: "var(--ink-0)",
            fontSize: 11, letterSpacing: "0.1em", width: 240,
          }}
        />
      </div>

      {/* Left layer panel */}
      <div style={{
        position: "absolute", top: 56, left: 10, zIndex: 4,
        background: "rgba(4,6,12,0.78)", border: "1px solid var(--line)",
        borderRadius: 10, padding: "12px 12px 10px", minWidth: 200,
        backdropFilter: "blur(8px)",
      }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.22em", marginBottom: 10 }}>LAYERS</div>
        <div style={{ display: "grid", gap: 6 }}>
          {LAYERS.map((l) => (
            <label key={l.slug} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
              <input
                type="checkbox"
                checked={!!activeLayers[l.slug]}
                onChange={(e) => setActiveLayers((s) => ({ ...s, [l.slug]: e.target.checked }))}
                style={{ accentColor: l.color }}
              />
              <span style={{ color: l.color, fontWeight: 600, width: 12 }}>{l.glyph}</span>
              <span className="wm-mono" style={{ color: "var(--ink-1)", letterSpacing: "0.1em", fontSize: 10, textTransform: "uppercase" }}>
                {l.label}
              </span>
              <span className="wm-mono" style={{ marginLeft: "auto", fontSize: 9, color: "var(--ink-3)" }}>{l.data.length}</span>
            </label>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
            <input type="checkbox" checked={showFlights} onChange={(e) => setShowFlights(e.target.checked)} style={{ accentColor: "#a8e6ff" }} />
            <span style={{ color: "#a8e6ff", fontWeight: 600, width: 12 }}>✈</span>
            <span className="wm-mono" style={{ color: "var(--ink-1)", letterSpacing: "0.1em", fontSize: 10, textTransform: "uppercase" }}>Live flights</span>
            <span className="wm-mono" style={{ marginLeft: "auto", fontSize: 9, color: "var(--ink-3)" }}>{flights.length || "—"}</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
            <input type="checkbox" checked={showShips} onChange={(e) => setShowShips(e.target.checked)} style={{ accentColor: "var(--accent-warm)" }} />
            <span style={{ color: "var(--accent-warm)", fontWeight: 600, width: 12 }}>🚢</span>
            <span className="wm-mono" style={{ color: "var(--ink-1)", letterSpacing: "0.1em", fontSize: 10, textTransform: "uppercase" }}>Chokepoints</span>
            <span className="wm-mono" style={{ marginLeft: "auto", fontSize: 9, color: "var(--ink-3)" }}>{CHOKEPOINTS.length}</span>
          </label>
        </div>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.2em", marginTop: 12 }}>SEVERITY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {[null, "critical", "high", "elevated", "moderate", "low"].map((s, i) => (
            <button
              key={s ?? `all-${i}`}
              onClick={() => setSevFilter(s)}
              className="wm-mono"
              style={{
                padding: "3px 7px", borderRadius: 999, cursor: "pointer", border: "1px solid",
                borderColor: sevFilter === s ? severityColor(s ?? "low") : "rgba(255,255,255,0.1)",
                background: sevFilter === s ? "rgba(255,255,255,0.06)" : "transparent",
                color: sevFilter === s ? severityColor(s ?? "low") : "var(--ink-2)",
                fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase",
              }}
            >{s ?? "All"}</button>
          ))}
        </div>
      </div>

      {/* MAP SVG */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {/* Grid */}
        {[15, 30, 45, 60, 75].map((g) => (
          <g key={g} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
            <line x1="0" x2={W} y1={(90 - g) / 180 * H} y2={(90 - g) / 180 * H} />
            <line x1="0" x2={W} y1={(90 + g) / 180 * H} y2={(90 + g) / 180 * H} />
          </g>
        ))}
        {Array.from({ length: 11 }).map((_, i) => {
          const g = -150 + i * 30;
          return <line key={g} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"
            x1={((g + 180) / 360) * W} x2={((g + 180) / 360) * W} y1="0" y2={H} />;
        })}
        <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
        <line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

        {/* Country borders (lazy-loaded) */}
        {borderPaths ? (
          <g fill="rgba(40,55,90,0.18)" stroke="rgba(125,160,220,0.18)" strokeWidth="0.4">
            <path d={borderPaths} />
          </g>
        ) : null}

        {/* Flights — bigger, brighter, with glow halo */}
        {showFlights && flights.map((f) => {
          const [x, y] = project(f.lat, f.lng);
          return (
            <g key={f.icao24}
              onMouseEnter={() => setHover({ kind: "flight", f })}
              onMouseLeave={() => setHover((h) => (h?.kind === "flight" && h.f.icao24 === f.icao24 ? null : h))}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={y} r="4.5" fill="#7ab8ff" opacity="0.15" />
              <g transform={`translate(${x}, ${y})${f.heading != null ? ` rotate(${f.heading})` : ""}`}>
                <path d="M0,-5 L3.5,3.5 L0,1.8 L-3.5,3.5 Z" fill="#a8e6ff" opacity="0.95" stroke="#7ab8ff" strokeWidth="0.3" />
              </g>
            </g>
          );
        })}

        {/* Chokepoints — strategic narrows always on the world map */}
        {showShips && CHOKEPOINTS.map((c) => {
          const [x, y] = project(c.lat, c.lng);
          return (
            <g key={c.slug} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="14" fill="var(--accent-warm)" opacity="0.07" />
              <circle cx={x} cy={y} r="8" fill="var(--accent-warm)" opacity="0.18" />
              <circle cx={x} cy={y} r="4.5" fill="var(--accent-warm)" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.8" />
              <text x={x + 9} y={y + 3.5} fontSize="8" fill="var(--accent-warm)" fontWeight="700" style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.85))" }}>{c.short.toUpperCase()}</text>
              <title>{c.name} — {c.blurb}</title>
            </g>
          );
        })}

        {/* Layers */}
        {LAYERS.filter((l) => activeLayers[l.slug]).map((l) => (
          <g key={l.slug}>
            {l.data.map((m) => {
              const [x, y] = project(m.coords[1], m.coords[0]);
              const isHover = hover?.kind === "marker" && hover.m.id === m.id;
              return (
                <g key={m.id}
                  onMouseEnter={() => setHover({ kind: "marker", m, layer: l.label })}
                  onMouseLeave={() => setHover((h) => (h?.kind === "marker" && h.m.id === m.id ? null : h))}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={x} cy={y} r={isHover ? 10 : 6} fill={l.color} opacity="0.15" />
                  <text x={x} y={y + 3} fontSize="10" textAnchor="middle" fill={l.color} fontWeight="700">{l.glyph}</text>
                </g>
              );
            })}
          </g>
        ))}

        {/* Signals */}
        {visibleSignals.map((s) => {
          const [x, y] = project(s.latitude!, s.longitude!);
          const r = SEV_R[s.severity] ?? 4;
          const c = severityColor(s.severity);
          const isHover = hover?.kind === "signal" && hover.sig.id === s.id;
          return (
            <g key={s.id}
              onMouseEnter={() => setHover({ kind: "signal", sig: s })}
              onMouseLeave={() => setHover((h) => (h?.kind === "signal" && h.sig.id === s.id ? null : h))}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={y} r={r * 2.6} fill={c} opacity={isHover ? 0.22 : 0.10} />
              <circle cx={x} cy={y} r={r * 1.5} fill={c} opacity="0.24" />
              <circle cx={x} cy={y} r={r} fill={c} stroke="#fff" strokeOpacity="0.7" strokeWidth="0.6" />
            </g>
          );
        })}
      </svg>

      <LiveVesselsOverlay />

      {/* Legend (bottom) */}
      <div style={{
        position: "absolute", bottom: 10, left: 10, right: 10, zIndex: 3,
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        padding: "8px 14px", background: "rgba(4,6,12,0.7)", borderRadius: 10, border: "1px solid var(--line)",
        backdropFilter: "blur(6px)",
      }}>
        {(["critical", "high", "elevated", "moderate", "low"] as const).map((s) => (
          <span key={s} className="wm-mono" style={{ fontSize: 9, color: "var(--ink-2)", letterSpacing: "0.18em", textTransform: "uppercase", display: "inline-flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 8, height: 8, borderRadius: 50, background: severityColor(s), boxShadow: `0 0 8px ${severityColor(s)}` }} /> {s}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        {LAYERS.filter((l) => activeLayers[l.slug]).map((l) => (
          <span key={l.slug} className="wm-mono" style={{ fontSize: 9, color: l.color, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {l.glyph} {l.label}
          </span>
        ))}
      </div>

      {/* Hover detail */}
      {hover ? (
        <div className="wm-glass" style={{
          position: "absolute", right: 16, top: 56, maxWidth: 360, padding: 14,
          borderRadius: 12, zIndex: 6,
        }}>
          {hover.kind === "signal" ? (
            <>
              <div className="wm-mono" style={{ fontSize: 10, color: severityColor(hover.sig.severity), letterSpacing: "0.2em", textTransform: "uppercase" }}>
                ● {hover.sig.severity} · {hover.sig.category}
              </div>
              <div style={{ marginTop: 6, color: "var(--ink-0)", fontSize: 13, lineHeight: 1.4 }}>
                {hover.sig.sourceUrl ? <a href={hover.sig.sourceUrl} target="_blank" rel="noopener noreferrer">{hover.sig.title}</a> : hover.sig.title}
              </div>
              {hover.sig.summary ? <div style={{ marginTop: 6, color: "var(--ink-2)", fontSize: 12, lineHeight: 1.5 }}>{hover.sig.summary}</div> : null}
              <div className="wm-mono" style={{ marginTop: 8, fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>
                {hover.sig.country ?? hover.sig.region ?? "—"} · {new Date(hover.sig.occurredAt).toLocaleString()}
              </div>
            </>
          ) : hover.kind === "marker" ? (
            <>
              <div className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {hover.layer}
              </div>
              <div style={{ marginTop: 6, color: "var(--ink-0)", fontSize: 14 }}>{hover.m.name}</div>
              {hover.m.country ? <div style={{ marginTop: 4, color: "var(--ink-2)", fontSize: 12 }}>{hover.m.country}</div> : null}
              {hover.m.note ? <div style={{ marginTop: 6, color: "var(--ink-3)", fontSize: 11 }}>{hover.m.note}</div> : null}
            </>
          ) : (
            <>
              <div className="wm-mono" style={{ fontSize: 10, color: "#a8e6ff", letterSpacing: "0.2em", textTransform: "uppercase" }}>✈ LIVE AIRCRAFT</div>
              <div style={{ marginTop: 6, color: "var(--ink-0)", fontSize: 14 }}>{hover.f.callsign}</div>
              <div className="wm-mono" style={{ marginTop: 6, fontSize: 11, color: "var(--ink-2)", letterSpacing: "0.06em" }}>
                ICAO {hover.f.icao24}{hover.f.alt != null ? ` · ${Math.round(hover.f.alt)} m` : ""}{hover.f.heading != null ? ` · HDG ${Math.round(hover.f.heading)}°` : ""}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Minimal TopoJSON → SVG path converter (single concatenated path string)
function topojsonToSvgPaths(topo: Topo): string {
  try {
    const objects = topo.objects.countries as { type: string; geometries: Array<{ type: string; arcs: number[][] | number[][][] }> };
    if (!objects || !objects.geometries) return "";
    const arcs = topo.arcs;
    const scale = topo.transform?.scale ?? [1, 1];
    const translate = topo.transform?.translate ?? [0, 0];

    function decodeArc(idx: number): number[][] {
      const reverse = idx < 0;
      const arc = arcs[reverse ? ~idx : idx];
      const pts: number[][] = [];
      let x = 0, y = 0;
      for (const [dx, dy] of arc) {
        x += dx; y += dy;
        const lng = x * scale[0] + translate[0];
        const lat = y * scale[1] + translate[1];
        pts.push([lng, lat]);
      }
      return reverse ? pts.reverse() : pts;
    }

    function ringToPath(ring: number[]): string {
      let d = "";
      let pts: number[][] = [];
      for (let i = 0; i < ring.length; i++) {
        const arcPts = decodeArc(ring[i]);
        if (i === 0) pts = arcPts;
        else pts = pts.concat(arcPts.slice(1));
      }
      for (let i = 0; i < pts.length; i++) {
        const [lng, lat] = pts[i];
        const x = ((lng + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }
      return d + "Z";
    }

    let path = "";
    for (const geo of objects.geometries) {
      if (geo.type === "Polygon") {
        for (const ring of (geo.arcs as number[][])) {
          path += ringToPath(ring);
        }
      } else if (geo.type === "MultiPolygon") {
        for (const poly of (geo.arcs as number[][][])) {
          for (const ring of poly) {
            path += ringToPath(ring);
          }
        }
      }
    }
    return path;
  } catch {
    return "";
  }
}
