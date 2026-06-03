import { SYMPTOM_LABEL_MAP, LEVEL_LABELS, LEVEL_SIMPLE } from "../data/clinicalData";
import { getNow } from "./dateUtils";
import { explainAggRules } from "./ruleUtils";

const LEVEL_COLORS = { 1: "#2e7d32", 2: "#d97706", 3: "#ea580c", 4: "#b91c1c" };

const buildResultsHTML = (results, mode) =>
  results.map((r) => {
    const hasDisc    = r.uniqueDiscriminators > 0;
    const aggExplain = explainAggRules(r.aggregationRules);
    const techNote   = mode === "cuidador"
      ? `<p style="margin:0 0 8px;font-size:11px;color:#6b7a8d;font-style:italic;">Sección para mostrar al médico tratante:</p>`
      : "";
    return `
      <div style="border-left:5px solid ${LEVEL_COLORS[r.suspicionLevel]};padding:14px 18px;margin-bottom:16px;background:#fafafa;border-radius:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <strong style="font-size:16px;color:#0b2545;">${r.cancerName}</strong>
          <span style="background:${LEVEL_COLORS[r.suspicionLevel]};color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;">
            Nivel ${r.suspicionLevel} — ${LEVEL_LABELS[r.suspicionLevel]}
          </span>
        </div>
        <div style="background:#f0f9ff;border-left:4px solid #1a8fe3;padding:12px 14px;border-radius:6px;margin-bottom:10px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#134074;text-transform:uppercase;letter-spacing:0.8px;">En términos simples</p>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">${LEVEL_SIMPLE[r.suspicionLevel]}</p>
        </div>
        <div style="background:#f0f4f8;border-radius:6px;padding:12px 14px;">
          ${techNote}
          <p style="margin:0 0 4px;color:#374151;font-size:13px;"><strong>Score clínico agregado:</strong> ${r.totalScore} pts</p>
          <p style="margin:0 0 4px;color:#374151;font-size:13px;"><strong>Discriminadores únicos activos:</strong> ${r.uniqueDiscriminators}${hasDisc ? " — síntoma(s) de alta especificidad identificado(s)." : " — ninguno."}</p>
          <p style="margin:0;color:#374151;font-size:13px;"><strong>Reglas de agregación:</strong> ${aggExplain}</p>
        </div>
      </div>`;
  }).join("");

export const generatePDF = (patientData, selectedSymptoms, results, mode) => {
  const evaluationDate = getNow();
  const modeLabel      = mode === "medico" ? "Modo Médico" : "Modo Cuidador";
  const symptomsText   = selectedSymptoms.map((c) => `${c} — ${SYMPTOM_LABEL_MAP[c] || c}`).join("<br>");
  const proceInfo      = patientData.departamento
    ? `${patientData.departamento}${patientData.municipio ? `, ${patientData.municipio}` : ""}` : "No especificada";
  const identityRow    = patientData.identidad
    ? `<p style="margin:4px 0;font-size:14px;"><strong>N.º de identidad:</strong> ${patientData.identidad}</p>` : "";

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Reporte OncoDetect</title>
    <style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:720px;margin:0 auto;padding:32px;color:#1a1a2e;}@media print{body{padding:0;}}</style>
    </head><body>
    <div style="background:linear-gradient(135deg,#0b2545,#134074);padding:28px 32px;border-radius:12px;margin-bottom:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">🔬 OncoDetect</h1>
      <p style="color:#93c5fd;margin:6px 0 2px;font-size:13px;">Sistema de Apoyo a la Decisión Clínica · Tamizaje Oncológico Pediátrico</p>
      <p style="color:rgba(255,255,255,0.45);margin:0;font-size:11px;">${modeLabel}</p>
    </div>
    <div style="background:#f0f4f8;padding:16px 20px;border-radius:10px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;color:#134074;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Datos de la Evaluación</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Fecha:</strong> ${evaluationDate}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Paciente:</strong> ${patientData.fullName}</p>
      ${identityRow}
      <p style="margin:4px 0;font-size:14px;"><strong>Fecha de nacimiento:</strong> ${patientData.dobFormatted}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Edad:</strong> ${patientData.ageFormatted}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Procedencia:</strong> ${proceInfo}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Síntomas (${selectedSymptoms.length}):</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151;line-height:1.9;padding-left:8px;">${symptomsText}</p>
    </div>
    <p style="font-size:11px;font-weight:700;color:#134074;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Resultados por Tipo de Cáncer</p>
    ${buildResultsHTML(results, mode)}
    <div style="border:1px solid #fcd34d;background:#fffbeb;padding:16px 20px;border-radius:10px;margin-top:24px;">
      <p style="margin:0;font-size:12px;color:#78350f;line-height:1.75;">
        <strong>⚠️ AVISO LEGAL:</strong> OncoDetect es una herramienta educativo-informativa. <strong>No emite diagnósticos médicos.</strong>
        Desarrollado bajo lineamientos OMS (2021) e IMDRF (2025).
      </p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;">
      Generado por OncoDetect · ${modeLabel} · UNITEC San Pedro Sula · ${new Date().getFullYear()}
    </p>
    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

export const buildReportHtml = (patientData, symptoms, results, mode, evaluationDate) => {
  const modeLabel    = mode === "medico" ? "Modo Médico" : "Modo Cuidador";
  const symptomsText = symptoms.map((c) => `${c} — ${SYMPTOM_LABEL_MAP[c] || c}`).join("<br>");
  const proceInfo    = patientData.departamento
    ? `${patientData.departamento}${patientData.municipio ? `, ${patientData.municipio}` : ""}` : "No especificada";
  const identityRow  = patientData.identidad
    ? `<p style="margin:4px 0;font-size:14px;"><strong>N.º de identidad:</strong> ${patientData.identidad}</p>` : "";
  const sorted       = [...results].sort((a, b) => b.suspicionLevel - a.suspicionLevel);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:720px;margin:0 auto;padding:32px;color:#1a1a2e;}</style>
    </head><body>
    <div style="background:linear-gradient(135deg,#0b2545,#134074);padding:28px 32px;border-radius:12px;margin-bottom:28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">🔬 OncoDetect</h1>
      <p style="color:#93c5fd;margin:6px 0 2px;font-size:13px;">Sistema de Apoyo a la Decisión Clínica · Tamizaje Oncológico Pediátrico</p>
      <p style="color:rgba(255,255,255,0.45);margin:0;font-size:11px;">${modeLabel}</p>
    </div>
    <div style="background:#f0f4f8;padding:16px 20px;border-radius:10px;margin-bottom:24px;">
      <p style="margin:4px 0;font-size:14px;"><strong>Fecha:</strong> ${evaluationDate}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Paciente:</strong> ${patientData.fullName}</p>
      ${identityRow}
      <p style="margin:4px 0;font-size:14px;"><strong>Fecha de nacimiento:</strong> ${patientData.dobFormatted}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Edad:</strong> ${patientData.ageFormatted}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Procedencia:</strong> ${proceInfo}</p>
      <p style="margin:4px 0;font-size:14px;"><strong>Síntomas (${symptoms.length}):</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151;line-height:1.9;padding-left:8px;">${symptomsText}</p>
    </div>
    ${buildResultsHTML(sorted, mode)}
    <div style="border:1px solid #fcd34d;background:#fffbeb;padding:16px 20px;border-radius:10px;margin-top:24px;">
      <p style="margin:0;font-size:12px;color:#78350f;line-height:1.75;">
        <strong>⚠️ AVISO LEGAL:</strong> OncoDetect es una herramienta educativo-informativa. <strong>No emite diagnósticos médicos.</strong>
      </p>
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:24px;">
      Generado por OncoDetect · ${modeLabel} · UNITEC San Pedro Sula · ${new Date().getFullYear()}
    </p>
    </body></html>`;
};
