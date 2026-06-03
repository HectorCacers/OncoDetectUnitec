export default function ScreenFHNC({ state }) {
  const { withSpinner, setFhncScreen } = state;

  const downloadImg = (imgId, filename) => {
    const img = document.getElementById(imgId);
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png"); a.download = filename; a.click();
  };

  return (
    <div className="fhnc-screen">
      <header className="fhnc-header">
        <div className="fhnc-header-title" style={{fontFamily:"'Permanent Marker', cursive",fontSize:"24px",textTransform:"none",letterSpacing:"0.3px",textAlign:"center",flex:1}}>
          OncoDetect para un <span>diagnóstico oportuno</span>
        </div>
        <div className="fhnc-header-actions">
          <button className="fhnc-btn-download" onClick={() => {
            downloadImg("img-signos", "12_Signos_de_Alerta_Cancer_Infantil.png");
            setTimeout(() => downloadImg("img-leucemia", "Lo_que_Debes_Saber_Sobre_la_Leucemia.png"), 400);
          }}>
            Descargar recursos
          </button>
          <button className="fhnc-btn-back" onClick={() => withSpinner(() => setFhncScreen(false))}>
            Volver
          </button>
        </div>
      </header>

      <div className="fhnc-body">
        <div className="fhnc-intro">
          <div className="fhnc-intro-title">🎗️ Fundación Hondureña para el Niño con Cáncer</div>
          <div className="fhnc-intro-text">
            La <strong>Fundación Hondureña para el Niño con Cáncer (FHNC)</strong> es una organización sin fines de lucro que desde 1982
            trabaja para garantizar el acceso a tratamiento oncológico pediátrico de calidad en Honduras. Bajo el lema{" "}
            <strong>«Salva Mi Vida»</strong>, la fundación opera unidades de hemato-oncología pediátrica y clínicas de quimioterapia
            ambulatoria, brindando atención integral a niños y adolescentes con cáncer de 0 a 18 años. Su sitio web es{" "}
            <a href="https://salvamivida.org" target="_blank" rel="noreferrer" style={{color:"#c0171a",fontWeight:700}}>salvamivida.org</a>.
          </div>
        </div>

        <div className="fhnc-section-title"><span style={{fontSize:"22px"}}>🗺️</span> Cobertura nacional</div>
        <div className="fhnc-map-wrap">
          <img src="/Ubicaciones_FHNC.png" alt="Ubicaciones FHNC en Honduras" />
        </div>

        <div className="fhnc-section-title"><span style={{fontSize:"22px"}}>📋</span> Materiales educativos</div>
        <div className="fhnc-resources-grid">
          <div className="fhnc-resource-card">
            <img id="img-signos" src="/12_Signos_de_Alerta_Cancer_Infantil.png"
              alt="12 Signos de Alerta del Cáncer Infantil" className="fhnc-resource-img" crossOrigin="anonymous" />
            <div className="fhnc-resource-caption">Fuente: Fundación Hondureña para el Niño con Cáncer</div>
          </div>
          <div className="fhnc-resource-card">
            <img id="img-leucemia" src="/Lo_que_Debes_Saber_Sobre_la_Leucemia.png"
              alt="Lo que Debes Saber Sobre la Leucemia" className="fhnc-resource-img" crossOrigin="anonymous" />
            <div className="fhnc-resource-caption">Fuente: Fundación Hondureña para el Niño con Cáncer</div>
          </div>
        </div>

        <div className="fhnc-contact-bar">
          <div className="fhnc-contact-item">
            <span className="fhnc-contact-icon">💬</span>
            <span>WhatsApp: <strong>9683-0000</strong></span>
          </div>
          <div className="fhnc-contact-item">
            <span className="fhnc-contact-icon">🌐</span>
            <span><a href="https://salvamivida.org" target="_blank" rel="noreferrer">salvamivida.org</a></span>
          </div>
          <div className="fhnc-contact-item">
            <span className="fhnc-contact-icon">📱</span>
            <span>Síguenos: <a href="https://facebook.com/salvamivida" target="_blank" rel="noreferrer">@salvamivida</a></span>
          </div>
          <div className="fhnc-contact-item">
            <span className="fhnc-contact-icon">❤️</span>
            <span>Anualmente se diagnostican <strong>más de 200 casos</strong> de leucemia infantil en Honduras</span>
          </div>
        </div>
      </div>
    </div>
  );
}
