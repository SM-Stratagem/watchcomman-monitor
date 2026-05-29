import { countryFromHex, type MilFlight, regionForFlight } from "@/lib/military-flights";
import { flagEmoji } from "@/lib/provenance";

export function MilitaryAirPanel({ flights, compact = false }: { flights: MilFlight[]; compact?: boolean }) {
  const byRegion: Record<string, number> = {};
  const emergencies: MilFlight[] = [];
  const byCountry: Record<string, number> = {};
  for (const f of flights) {
    const r = regionForFlight(f);
    byRegion[r] = (byRegion[r] ?? 0) + 1;
    if (f.emergency) emergencies.push(f);
    const c = countryFromHex(f.icao24);
    if (c) byCountry[c] = (byCountry[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, compact ? 4 : 8);

  return (
    <div className="wm-glass" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 260 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em" }}>MILITARY AIR · LIVE</div>
          <div style={{ fontSize: 16, color: "var(--ink-0)", marginTop: 2, fontWeight: 500 }}>
            {flights.length.toLocaleString()} aircraft airborne now
          </div>
        </div>
        <a href="/military" className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.18em" }}>VIEW ALL ↗</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--line)" }}>
        <Stat label="EUROPE" value={byRegion["Europe"] ?? 0} />
        <Stat label="MIDDLE EAST" value={byRegion["Middle East"] ?? 0} accent="var(--accent-hot)" />
        <Stat label="ASIA-PAC" value={byRegion["Asia-Pacific"] ?? 0} />
        <Stat label="EMERGENCY" value={emergencies.length} accent={emergencies.length ? "var(--accent-hot)" : "var(--ink-3)"} />
      </div>

      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em", marginBottom: 6 }}>TOP COUNTRIES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {topCountries.map(([c, n]) => (
            <span key={c} className="wm-mono" style={{ fontSize: 10, padding: "3px 8px", border: "1px solid var(--line)", borderRadius: 999, color: "var(--ink-1)", letterSpacing: "0.12em" }}>
              <span style={{ marginRight: 4 }}>{flagEmoji(c)}</span>{c} · {n}
            </span>
          ))}
        </div>
      </div>

      <div style={{ overflow: "auto", flex: 1 }}>
        {emergencies.length > 0 && (
          <div>
            <div className="wm-mono" style={{ padding: "8px 14px", fontSize: 9, color: "var(--accent-hot)", letterSpacing: "0.22em", borderBottom: "1px solid var(--line)" }}>
              EMERGENCY / SQUAWK ALERT · {emergencies.length}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {emergencies.slice(0, 5).map((f) => <FlightRow key={f.icao24} f={f} alert />)}
            </ul>
          </div>
        )}
        {!compact && (
          <div>
            <div className="wm-mono" style={{ padding: "8px 14px", fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.22em", borderBottom: "1px solid var(--line)" }}>
              CURRENT TRACKS · {Math.min(flights.length, 40)}
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {flights.slice(0, 40).map((f) => <FlightRow key={f.icao24} f={f} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "var(--accent)" }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRight: "1px solid var(--line)" }}>
      <div className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.18em" }}>{label}</div>
      <div className="wm-display" style={{ fontSize: 22, marginTop: 2, color: accent }}>{value}</div>
    </div>
  );
}

function FlightRow({ f, alert = false }: { f: MilFlight; alert?: boolean }) {
  const c = countryFromHex(f.icao24);
  return (
    <li style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {c ? <span style={{ fontSize: 12 }}>{flagEmoji(c)}</span> : null}
        <span className="wm-mono" style={{ fontSize: 10, color: alert ? "var(--accent-hot)" : "var(--accent)", letterSpacing: "0.14em" }}>{f.callsign}</span>
        {f.type ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>{f.type}</span> : null}
        {f.emergency ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent-hot)", textTransform: "uppercase" }}>{f.emergency}</span> : null}
        {f.squawk && f.squawk !== "0000" ? <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>sq {f.squawk}</span> : null}
      </span>
      <span className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
        {f.alt != null ? `${Math.round(f.alt / 100)} FL` : "—"}{f.velocity != null ? ` · ${Math.round(f.velocity)} kt` : ""}
      </span>
    </li>
  );
}
