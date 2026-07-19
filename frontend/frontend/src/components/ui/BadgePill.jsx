import "../../styles/app.css";

export default function BadgePill({ tone = "primary", children }) {
  const style =
    tone === "success"
      ? { background: "rgba(22,163,74,.12)", color: "#15803d" }
      : tone === "warning"
      ? { background: "rgba(245,158,11,.14)", color: "#b45309" }
      : tone === "danger"
      ? { background: "rgba(220,38,38,.12)", color: "#b91c1c" }
      : { background: "rgba(37,99,235,.12)", color: "#1d4ed8" };

  return (
    <span className="badge" style={{ ...style, borderColor: "rgba(15,23,42,.12)" }}>
      {children}
    </span>
  );
}

