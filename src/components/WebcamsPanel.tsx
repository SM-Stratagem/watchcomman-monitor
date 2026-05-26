// Curated, publicly-embeddable live streams (YouTube live, Windy.com webcams).
// All entries are public 24/7 streams or operator-published embeds.

type Webcam = {
  id: string;
  label: string;
  region: string;
  embed: string;
  fallback: string;
};

const WEBCAMS: Webcam[] = [
  // Earth views (NASA / Space)
  { id: "earth-iss", label: "ISS Earth Live", region: "Space",
    embed: "https://www.youtube.com/embed/H999s0P1Er0?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=H999s0P1Er0" },
  // Cities
  { id: "times-sq", label: "Times Square, NYC", region: "Americas",
    embed: "https://www.youtube.com/embed/eJ7ZkQ5TC08?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=eJ7ZkQ5TC08" },
  { id: "abbey-road", label: "Abbey Road, London", region: "Europe",
    embed: "https://www.youtube.com/embed/AnApcQzcfQg?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=AnApcQzcfQg" },
  { id: "shibuya", label: "Shibuya Crossing, Tokyo", region: "Asia",
    embed: "https://www.youtube.com/embed/3kPH7kTphnE?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=3kPH7kTphnE" },
  { id: "jerusalem-wall", label: "Western Wall, Jerusalem", region: "Middle East",
    embed: "https://www.youtube.com/embed/dRdQNS6t1J4?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=dRdQNS6t1J4" },
  { id: "mecca", label: "Makkah Live (Kaaba)", region: "Middle East",
    embed: "https://www.youtube.com/embed/sezOuMlQ4Lk?autoplay=1&mute=1&modestbranding=1",
    fallback: "https://www.youtube.com/watch?v=sezOuMlQ4Lk" },
];

export function WebcamsPanel() {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, background: "rgba(8,12,24,0.55)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-1)", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
          LIVE WEBCAMS
        </div>
        <span className="wm-mono" style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.2em" }}>
          {WEBCAMS.length} STREAMS
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, padding: 8 }}>
        {WEBCAMS.map((w) => (
          <div key={w.id} style={{ border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", background: "#000" }}>
            <iframe
              src={w.embed}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ display: "block", width: "100%", aspectRatio: "16 / 9", border: 0 }}
              title={w.label}
            />
            <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="wm-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                ● {w.region}
              </span>
              <a href={w.fallback} target="_blank" rel="noopener noreferrer" className="wm-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.12em" }}>
                {w.label} ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
