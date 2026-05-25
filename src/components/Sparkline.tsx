export function Sparkline({
  data,
  width = 280,
  height = 60,
  color = "var(--accent)",
  label,
}: {
  data: Array<{ date: string; count: number }>;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => d.count));
  const stepX = width / Math.max(1, data.length - 1);
  const points = data
    .map((d, i) => `${(i * stepX).toFixed(1)},${(height - (d.count / max) * height).toFixed(1)}`)
    .join(" ");
  const area = `0,${height} ${points} ${width},${height}`;
  return (
    <div>
      {label ? (
        <div className="wm-mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.2em", marginBottom: 6, textTransform: "uppercase" }}>
          {label}
        </div>
      ) : null}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="sparkline">
        <defs>
          <linearGradient id={`spark-${label || "x"}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#spark-${label || "x"})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.4" />
        {data.map((d, i) => (
          <circle
            key={d.date}
            cx={(i * stepX).toFixed(1)}
            cy={(height - (d.count / max) * height).toFixed(1)}
            r="1.6"
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.35}
          />
        ))}
      </svg>
    </div>
  );
}
