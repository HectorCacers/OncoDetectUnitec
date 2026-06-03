export default function ScreenProfile({ state }) {
  const { withSpinner, setScreen, setUserMode, doctorToken, setFhncScreen } = state;
  return (
    <div className="profile-screen">
      <div className="profile-card-wrap">
        <div className="profile-heading">¿Quién está usando OncoDetect?</div>
        <div className="profile-subheading">Seleccione su perfil para adaptar la interfaz</div>
        <div className="profile-grid-3">
          <div className="profile-option informate" style={{gridColumn:"1 / -1"}} onClick={() => withSpinner(() => setFhncScreen(true))}>
            <span className="profile-icon">
              <img src="/listón_amarillo.png" alt="Listón amarillo" style={{width:"88px",height:"88px",objectFit:"contain"}} />
            </span>
            <div className="profile-title">Información y Recursos</div>
            <div className="profile-desc">Materiales educativos de la Fundación Hondureña para el Niño con Cáncer.</div>
          </div>
          <div className="profile-option medico" onClick={() => {
            if (doctorToken) { withSpinner(() => { setUserMode("medico"); setScreen("form"); }); }
            else { withSpinner(() => setScreen("login")); }
          }}>
            <span className="profile-icon">🩺</span>
            <div className="profile-title">Médico</div>
            <div className="profile-desc">Interfaz técnica con clasificación por tipo de cáncer y niveles de sospecha clínica N1–N4.</div>
          </div>
          <div className="profile-option cuidador" onClick={() => withSpinner(() => { setUserMode("cuidador"); setScreen("form"); })}>
            <span className="profile-icon">👨‍👩‍👧</span>
            <div className="profile-title">Cuidador</div>
            <div className="profile-desc">Interfaz simplificada con síntomas en lenguaje cotidiano. Ideal para padres y familiares.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
