import { useState, useEffect, useRef } from "react";

const SPINNER_MSGS = {
  boot: [
    "Iniciando sistema...",
    "Conectando con el servidor...",
    "Servidor iniciando, espera unos segundos...",
    "Cargando motor de reglas...",
    "Listo en un momento...",
  ],
  nav:  ["Cargando...", "Un momento...", "Preparando interfaz...", "Listo..."],
  eval: [
    "Procesando síntomas...",
    "Aplicando criterios OPS/SIOP...",
    "Calculando niveles de sospecha...",
    "Generando recomendaciones clínicas...",
  ],
};

// Microscopio PNG en base64 (embebido para evitar dependencia de archivo público)
const SCOPE_SRC = "/microscope.png";
// NOTA: copia aquí el valor completo de MICROSCOPE_B64 del App.jsx original

export default function SpinnerOverlay({ visible, mode = "nav" }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [show, setShow]           = useState(false);
  const [msgIdx, setMsgIdx]       = useState(0);
  const intervalRef               = useRef(null);
  const msgs = SPINNER_MSGS[mode] || SPINNER_MSGS.nav;

  useEffect(() => {
    if (visible) {
      setShow(true); setFadingOut(false); setMsgIdx(0);
      intervalRef.current = setInterval(
        () => setMsgIdx((i) => (i + 1) % msgs.length),
        2200
      );
    } else {
      clearInterval(intervalRef.current);
      setFadingOut(true);
      setTimeout(() => setShow(false), 520);
    }
    return () => clearInterval(intervalRef.current);
  }, [visible]);

  if (!show) return null;
  return (
    <div className={`spinner-overlay${fadingOut ? " fade-out" : ""}`}>
      <div className="spinner-scope-wrap">
        <div className="spinner-pulse"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring-2"></div>
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
        <div className="spinner-dot"></div>
        <img
          className="spinner-scope-img"
          src={SCOPE_SRC}
          alt="OncoDetect cargando"
        />
      </div>
      <div className="spinner-text-block">
        <div className="spinner-logo">Onco<span>Detect</span></div>
        <div className="spinner-msg" key={msgIdx}>{msgs[msgIdx]}</div>
        <div className="spinner-bar-track">
          <div className="spinner-bar-fill"></div>
        </div>
      </div>
      <div className="spinner-footer-wrap">
        <div className="spinner-footer spinner-footer-left">UNITEC | SPS 2026</div>
        <div className="spinner-footer spinner-footer-right">V5 por: Luis V. y Fernando H.</div>
      </div>
    </div>
  );
}
