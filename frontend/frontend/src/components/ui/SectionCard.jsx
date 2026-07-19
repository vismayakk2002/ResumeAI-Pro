import "../../styles/app.css";

export default function SectionCard({ title, subtitle, right, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-inner" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 1000, color: "#0f172a" }}>{title}</div>
            {subtitle ? (
              <div style={{ marginTop: 3, color: "rgba(15,23,42,.68)", lineHeight: 1.35, fontWeight: 700, fontSize: 13 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

