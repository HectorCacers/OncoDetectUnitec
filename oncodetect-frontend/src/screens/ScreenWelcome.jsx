export default function ScreenWelcome({ state }) {
  const { withSpinner, setScreen } = state;
  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <div className="welcome-logo">Onco<span>Detect</span></div>
        <div className="welcome-subtitle">Tamizaje Oncológico Pediátrico · V5</div>
        <div className="welcome-disclaimer">
          <div className="disclaimer-title">⚠️ Aviso Importante</div>
          <div className="disclaimer-text">
            OncoDetect es una <strong style={{color:"#fff"}}>herramienta educativo-informativa</strong> de
            apoyo a la decisión clínica. <strong style={{color:"#fbbf24"}}>No emite diagnósticos médicos.</strong>
            <br/><br/>
            Los resultados deben ser interpretados exclusivamente por personal de salud calificado
            y no reemplazan la evaluación clínica, el juicio médico ni los protocolos institucionales vigentes.
            <br/><br/>
            Desarrollado bajo los lineamientos éticos de la <strong style={{color:"#fff"}}>OMS (2021)</strong> e{" "}
            <strong style={{color:"#fff"}}>IMDRF (2025)</strong>. Diseñado para los 6 cánceres pediátricos
            índice según criterios OPS/SIOP.
          </div>
        </div>
        <button className="welcome-btn" onClick={() => withSpinner(() => setScreen("profile"), "nav", 1200)}>
          He leído y acepto · Continuar
        </button>
      </div>
    </div>
  );
}
