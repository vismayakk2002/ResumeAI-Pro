import "../../styles/app.css";

function colorForScore(score) {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#f59e0b";
  return "#dc2626";
}

export default function CircularProgress({ score = 0, size = 96, stroke = 10 }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct / 100);
  const col = colorForScore(pct);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(15,23,42,.10)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={col}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={c}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .35s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 1000, color: "#0f172a" }}>{pct}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(15,23,42,.65)" }}>% ATS</div>
      </div>
    </div>
  );
}

