import { useState } from "react";
import { getPendingItems } from "../utils/offlineQueue";

function itemLabel(item) {
  if (item.type === "evaluate") {
    const name = item.payload?.meta?.save?.patientName;
    const count = item.payload?.symptoms?.length ?? 0;
    return name ? `Paciente: ${name}` : `${count} síntoma(s) evaluado(s)`;
  }
  if (item.type === "email") {
    const raw = item.payload?.recipientEmail ?? "";
    const parts = raw.split(",").map((e) => e.trim()).filter(Boolean);
    if (parts.length <= 1) return `Para: ${parts[0] || "sin destinatario"}`;
    return `Para: ${parts[0]} +${parts.length - 1} más`;
  }
  return "Acción pendiente";
}

function itemTime(iso) {
  try {
    return new Date(iso).toLocaleString("es", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function OfflineBanner({ isOnline, pendingCount, completedCount, offlineMessage, onDismiss, onViewCompleted }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState([]);

  const toggleDetail = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    try {
      setItems(await getPendingItems());
    } catch {
      setItems([]);
    }
  };

  if (isOnline && pendingCount === 0 && completedCount === 0 && !offlineMessage) return null;

  const hasPending   = pendingCount > 0;
  const hasCompleted = completedCount > 0;

  return (
    <div className={`offline-banner ${!isOnline ? "offline" : hasPending ? "syncing" : hasCompleted ? "ready" : ""}`}>
      <div className="offline-banner-inner">
        {!isOnline ? (
          <span>📡 Sin conexión. Los datos se guardarán y se sincronizarán automáticamente.</span>
        ) : hasPending ? (
          <span>🔄 {pendingCount === 1 ? "1 acción pendiente de sincronizar" : `${pendingCount} acciones pendientes de sincronizar`}. Se enviará cuando haya conexión.</span>
        ) : offlineMessage ? (
          <span>{offlineMessage}</span>
        ) : null}
        {hasPending && (
          <button type="button" className="offline-banner-detail" onClick={toggleDetail}>
            {expanded ? "Ocultar ▴" : "Ver detalle ▾"}
          </button>
        )}
        {offlineMessage && onDismiss && (
          <button type="button" className="offline-banner-dismiss" onClick={onDismiss} aria-label="Cerrar">✕</button>
        )}
      </div>
      {hasCompleted && (
        <div className="offline-banner-completed">
          <span className="offline-banner-completed-icon">📊</span>
          <span className="offline-banner-completed-text">
            {completedCount === 1
              ? "1 resultado listo para ver"
              : `${completedCount} resultados listos para ver`}
            . Evaluación de cuidador procesada al sincronizar.
          </span>
          <button type="button" className="offline-banner-completed-view" onClick={onViewCompleted}>
            Ver resultado
          </button>
        </div>
      )}
      {hasPending && expanded && (
        <div className="offline-banner-items">
          {items.length === 0 ? (
            <div className="offline-banner-item">Cargando acciones pendientes...</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="offline-banner-item">
                <span className="offline-banner-item-icon">{it.type === "evaluate" ? "📋" : "✉️"}</span>
                <span className="offline-banner-item-text">
                  <strong>{it.type === "evaluate" ? "Evaluación" : "Correo"}</strong>
                  <span className="offline-banner-item-desc">{itemLabel(it)}</span>
                </span>
                {itemTime(it.timestamp) && (
                  <span className="offline-banner-item-time">{itemTime(it.timestamp)}</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
