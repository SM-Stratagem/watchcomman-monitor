"use client";
// AISStream.io browser WebSocket — overlays live vessel positions on the map
// when NEXT_PUBLIC_AISSTREAM_KEY is set. Renders inside an absolutely-positioned
// SVG over its parent (which must be `position:relative`).
//
// AISStream is free for non-commercial use; register at https://aisstream.io
// and set NEXT_PUBLIC_AISSTREAM_KEY in env.

import { useEffect, useRef, useState } from "react";

type Vessel = {
  mmsi: number;
  name: string | null;
  lat: number;
  lng: number;
  cog: number | null; // course over ground
  sog: number | null; // speed over ground knots
  shipType: number | null;
  ts: number;
};

const W = 1800;
const H = 900;
function project(lat: number, lng: number): [number, number] {
  return [((lng + 180) / 360) * W, ((90 - lat) / 180) * H];
}

// Strategic bounding boxes covering chokepoints (AISStream subscription filter).
const BBOXES: number[][][] = [
  // [[swLat, swLng], [neLat, neLng]]
  [[24, 54], [28, 58]],   // Hormuz
  [[10, 42], [14, 45]],   // Bab el-Mandeb
  [[29, 31], [33, 34]],   // Suez approaches
  [[1, 100], [4, 105]],   // Singapore Strait + Malacca
  [[40, 27], [42, 31]],   // Bosporus
  [[22, 118], [27, 122]], // Taiwan Strait
  [[8, -82], [11, -78]],  // Panama
  [[44, 35], [46, 38]],   // Kerch
];

export function LiveVesselsOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [vessels, setVessels] = useState<Map<number, Vessel>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_AISSTREAM_KEY;
  const hasKey = !!apiKey;

  useEffect(() => {
    if (!enabled || !hasKey) return;
    let stop = false;
    let retry: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (stop) return;
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: BBOXES,
          FilterMessageTypes: ["PositionReport"],
        }));
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const meta = msg?.MetaData;
          const pos = msg?.Message?.PositionReport;
          if (!pos || !meta) return;
          const v: Vessel = {
            mmsi: meta.MMSI,
            name: meta.ShipName ? meta.ShipName.trim() : null,
            lat: pos.Latitude,
            lng: pos.Longitude,
            cog: pos.Cog ?? null,
            sog: pos.Sog ?? null,
            shipType: null,
            ts: Date.now(),
          };
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setVessels((prev) => {
            const next = new Map(prev);
            next.set(v.mmsi, v);
            // Prune > 10 min stale every update.
            const cutoff = Date.now() - 10 * 60 * 1000;
            for (const [k, val] of next) if (val.ts < cutoff) next.delete(k);
            return next;
          });
        } catch {}
      };
      ws.onclose = () => {
        if (!stop) retry = setTimeout(connect, 5000);
      };
      ws.onerror = () => { try { ws.close(); } catch {} };
    };
    connect();
    return () => {
      stop = true;
      if (retry) clearTimeout(retry);
      try { wsRef.current?.close(); } catch {}
    };
  }, [enabled, apiKey, hasKey]);

  if (!hasKey) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setEnabled((e) => !e)}
        className="wm-mono"
        style={{
          position: "absolute",
          right: 10, top: 10,
          padding: "4px 10px", fontSize: 9, letterSpacing: "0.18em",
          background: enabled ? "var(--accent-cool)" : "transparent",
          color: enabled ? "var(--bg-0)" : "var(--ink-1)",
          border: `1px solid ${enabled ? "var(--accent-cool)" : "var(--line-strong)"}`,
          borderRadius: 5, cursor: "pointer", zIndex: 6,
        }}
      >
        {enabled ? `LIVE AIS · ${vessels.size}` : "LIVE AIS · OFF"}
      </button>
      {enabled && (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
          {Array.from(vessels.values()).map((v) => {
            const [x, y] = project(v.lat, v.lng);
            const cog = v.cog ?? 0;
            return (
              <g key={v.mmsi} transform={`translate(${x},${y}) rotate(${cog})`}>
                <polygon points="0,-4 3,4 -3,4" fill="var(--accent-cool)" opacity={0.85}>
                  <title>{v.name ?? `MMSI ${v.mmsi}`}{v.sog != null ? ` · ${v.sog} kt` : ""}</title>
                </polygon>
              </g>
            );
          })}
        </svg>
      )}
    </>
  );
}
