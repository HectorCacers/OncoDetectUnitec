export default function ScreenLogin({ state }) {
  const { loginUser, setLoginUser, loginPass, setLoginPass, loginError, loginLoading, handleLogin, setScreen } = state;
  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🔬</div>
          <div>
            <div className="login-title">OncoDetect</div>
            <div className="login-subtitle">Acceso exclusivo — Modo Médico</div>
          </div>
        </div>
        <div className="login-badge">🔐 Área protegida</div>
        {loginError && <div className="login-error">{loginError}</div>}
        <div className="login-field">
          <label>Usuario</label>
          <input className="input-field" type="text" placeholder="Usuario médico"
            value={loginUser} onChange={e => setLoginUser(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div className="login-field">
          <label>Contraseña</label>
          <input className="input-field" type="password" placeholder="••••••••"
            value={loginPass} onChange={e => setLoginPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <button className="login-btn" onClick={handleLogin} disabled={loginLoading || !loginUser || !loginPass}>
          {loginLoading ? "Verificando..." : "Iniciar sesión"}
        </button>
        <div style={{textAlign:"center",marginTop:"16px"}}>
          <button onClick={() => setScreen("welcome")}
            style={{background:"none",border:"none",color:"var(--muted)",fontSize:"13px",cursor:"pointer"}}>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
