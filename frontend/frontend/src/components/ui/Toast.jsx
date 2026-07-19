import "../../styles/app.css";
import { useEffect } from "react";

export default function Toast({
  toast,
  onClose,
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onClose?.(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const tone = toast.tone || "success";
  const bg =
    tone === "success"
      ? "rgba(22,163,74,.12)"
      : tone === "error"
      ? "rgba(220,38,38,.12)"
      : "rgba(37,99,235,.12)";
  const color =
    tone === "success" ? "#15803d" : tone === "error" ? "#b91c1c" : "#1d4ed8";

  return (
    <div
      className="toast"
      style={{
        position: "fixed",
        top: 74,
        right: 18,
        zIndex: 10050,
        background: "#fff",
        border: "1px solid rgba(15,23,42,.12)",
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 18px 50px rgba(2,6,23,.14)",
        width: "min(420px, 92vw)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: bg,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
          }}
        >
          {tone === "success" ? "✓" : tone === "error" ? "!" : "•"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{toast.title || ""}</div>
          {toast.message ? (
            <div style={{ marginTop: 3, color: "#334155", lineHeight: 1.35 }}>{toast.message}</div>
          ) : null}
        </div>
        <button
          className="btn btn-ghost"
          style={{ padding: "6px 10px", borderRadius: 12 }}
          onClick={() => onClose?.(toast.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

