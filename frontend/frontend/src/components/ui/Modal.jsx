import "../../styles/app.css";

export default function Modal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          width: "min(520px, 92vw)",
          borderRadius: 18,
          background: "#fff",
        }}
      >
        <div className="card-inner">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
              {description ? <p className="muted" style={{ margin: "8px 0 0", lineHeight: 1.4 }}>{description}</p> : null}
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: "8px 10px", borderRadius: 10 }}
              onClick={onClose}
              disabled={loading}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="hr" />

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
              {cancelText}
            </button>
            <button
              className={`btn ${tone === "danger" ? "btn-danger" : tone === "success" ? "btn-success" : "btn-primary"}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

