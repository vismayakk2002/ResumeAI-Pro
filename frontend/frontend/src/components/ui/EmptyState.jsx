import "../../styles/app.css";

export default function EmptyState({ title, description, action }) {
  return (
    <div
      className="card"
      style={{
        padding: 22,
        textAlign: "center",
        marginTop: 14,
        borderStyle: "dashed",
      }}
    >
      <div style={{ fontSize: 38, marginBottom: 8 }}>🧾</div>
      <div style={{ fontWeight: 1000, color: "#0f172a", fontSize: 18 }}>{title}</div>
      {description ? (
        <div style={{ marginTop: 6, color: "rgba(15,23,42,.65)", lineHeight: 1.4, fontWeight: 700 }}>
          {description}
        </div>
      ) : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

