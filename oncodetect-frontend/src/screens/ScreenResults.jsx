import { useState } from "react";
import { LEVEL_LABELS, LEVEL_SIMPLE } from "../data/clinicalData";
import { generatePDF } from "../utils/pdfUtils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmails(raw) {
  if (!raw || !raw.trim()) return { valid: false, errors: [] };
  const parts = raw.split(",").map((e) => e.trim()).filter(Boolean);
  if (parts.length === 0) return { valid: false, errors: [] };
  const errors = parts.filter((e) => !EMAIL_RE.test(e));
  return { valid: errors.length === 0, errors, parts };
}

export default function ScreenResults({ state }) {
  const {
    results, userMode, patientData, patientFullName, patientIdentidad,
    ageFormatted, dobFormatted, patientDepto, patientMunicipio,
    selectedSymptoms, uniqueCareCodes,
    email, setEmail, emailStatus, setEmailStatus, showEmailInput, setShowEmailInput,
    handleSendEmail, handleReset
  } = state;

  const [emailErrors, setEmailErrors] = useState([]);

  const onEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailErrors([]);
  };

  const sorted       = [...results].sort((a, b) => b.suspicionLevel - a.suspicionLevel);
  const symptomsForPDF = userMode === "medico" ? selectedSymptoms : uniqueCareCodes;

  return (
    <>
      <header className="app-header">
        <div className="header-logo">Onco<span>Detect</span></div>
        <div className="header-badge">Resultados</div>
        <div className={`header-profile ${userMode}`}>{userMode === "medico" ? "🩺 Modo Médico" : "👨‍👩‍👧 Modo Cuidador"}</div>
      </header>
      <div className="main-container results-section">
        <div className="info-banner">
          ⚠️ <strong>Aviso:</strong> Los resultados son orientativos y deben ser interpretados por personal de salud calificado.
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-icon">📋</div>Resumen de la Evaluación</div>
          <p style={{fontSize:"14px",color:"var(--muted)",marginBottom:"4px"}}><strong style={{color:"var(--navy)"}}>Paciente:</strong> {patientFullName}</p>
          {patientIdentidad && <p style={{fontSize:"14px",color:"var(--muted)",marginBottom:"4px"}}><strong style={{color:"var(--navy)"}}>N.º de identidad:</strong> {patientIdentidad}</p>}
          <p style={{fontSize:"14px",color:"var(--muted)",marginBottom:"4px"}}><strong style={{color:"var(--navy)"}}>Fecha de nacimiento:</strong> {dobFormatted}</p>
          <p style={{fontSize:"14px",color:"var(--muted)",marginBottom:"4px"}}><strong style={{color:"var(--navy)"}}>Edad:</strong> {ageFormatted}</p>
          <p style={{fontSize:"14px",color:"var(--muted)",marginBottom:"4px"}}><strong style={{color:"var(--navy)"}}>Procedencia:</strong> {patientDepto}{patientMunicipio ? `, ${patientMunicipio}` : ""}</p>
          <p style={{fontSize:"14px",color:"var(--muted)"}}><strong style={{color:"var(--navy)"}}>Síntomas evaluados:</strong> {symptomsForPDF.length} síntoma(s)</p>
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-icon">🔬</div>Niveles de Sospecha por Cáncer</div>
          {sorted.map((r) => (
            <div key={r.cancerId} className={`result-card level-${r.suspicionLevel}`}>
              <div className="result-header">
                <div className="result-cancer-name">{r.cancerName}</div>
                <div className={`level-badge badge-${r.suspicionLevel}`}>Nivel {r.suspicionLevel} — {LEVEL_LABELS[r.suspicionLevel]}</div>
              </div>
              <div className="result-simple">
                <span className="result-simple-label">En términos simples</span>
                {LEVEL_SIMPLE[r.suspicionLevel]}
              </div>
              {userMode === "cuidador" && <p className="tech-note">Información técnica para mostrar al médico:</p>}
              <div className="result-technical">
                <strong>Interpretación técnica:</strong> Score: <strong>{r.totalScore}</strong> pts ·
                Discriminadores: <strong>{r.uniqueDiscriminators}</strong> ·
                Reglas: <strong>{r.aggregationRules?.join(", ") || "Ninguna"}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title"><div className="card-title-icon">📤</div>Exportar Resultados</div>
          <div className="actions-row">
            <button className="action-btn btn-pdf" onClick={() => generatePDF(patientData, symptomsForPDF, sorted, userMode)}>
              🖨️ Generar PDF / Imprimir
            </button>
            <button className="action-btn btn-email" onClick={() => { setShowEmailInput(!showEmailInput); setEmail(""); setEmailStatus(null); setEmailErrors([]); }}>
              ✉️ Enviar por Correo
            </button>
            <button className="action-btn btn-reset" onClick={handleReset}>🔄 Nueva Evaluación</button>
          </div>
          {showEmailInput && (
            <div style={{marginTop:"18px"}}>
              <label>Correo electrónico destinatario(s)</label>
              <p style={{fontSize:"12px",color:"var(--muted)",margin:"2px 0 6px"}}>Separe varios correos con coma</p>
              <div className="email-input-row">
                <input type="text" className="input-field" placeholder="medico@correo.com, admin@correo.com"
                  value={email} onChange={onEmailChange} />
                <button className="send-btn" onClick={() => {
                  const { valid, errors } = validateEmails(email);
                  if (!valid) { setEmailErrors(errors); setEmailStatus(null); return; }
                  setEmailErrors([]);
                  handleSendEmail();
                }} disabled={emailStatus === "sending" || emailStatus === "queued" || !email}>
                  {emailStatus === "sending" ? "Enviando..." : emailStatus === "queued" ? "En cola ⏳" : "Enviar"}
                </button>
              </div>
              {emailErrors.length > 0 && (
                <div className="toast toast-error" style={{marginTop:"6px"}}>
                  Correo(s) inválido(s): {emailErrors.join(", ")}
                </div>
              )}
              {emailStatus === "ok"     && <div className="toast toast-success">✅ Reporte enviado a {email}</div>}
              {emailStatus === "err"    && <div className="toast toast-error">❌ No se pudo enviar. Verifique la(s) dirección(es).</div>}
              {emailStatus === "queued" && <div className="toast toast-info">📥 Sin conexión. El correo se enviará automáticamente cuando vuelva el internet.</div>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
