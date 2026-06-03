export default function ScreenHistorial({ state }) {
  const {
    doctorUsername, adminMode, setAdminMode, adminModalOpen, setAdminModalOpen,
    adminPass, setAdminPass, adminError, adminLoading, handleVerifyAdmin,
    setHistorialScreen, selectedToDelete, setSelectedToDelete,
    toggleSelectEval, handleDeleteSelected,
    historialQuery, setHistorialQuery, historialResults,
    historialLoading, historialError, recentEvals,
    handleHistorialSearch
  } = state;

  const allIds      = (historialResults || []).map((ev) => ev._id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedToDelete.includes(id));

  const lvlClass = (n) => `h-level-badge h-level-${n}`;
  const lvlLabel = { 1:"Sospecha Baja", 2:"Sospecha Moderada", 3:"Sospecha Alta", 4:"Sospecha Muy Alta" };

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <header className="app-header">
        <div className="header-logo">Onco<span>Detect</span></div>
        <div className="header-badge">Historial</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginLeft:"auto"}}>
          <div style={{fontSize:"13px",color:"rgba(255,255,255,0.75)"}}>👤 {doctorUsername}</div>
          {!adminMode && (
            <button onClick={() => { setAdminModalOpen(true); }}
              style={{padding:"7px 13px",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.35)",background:"transparent",color:"rgba(255,255,255,0.85)",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>
              🔑 Admin
            </button>
          )}
          {adminMode && (
            <button onClick={() => { setAdminMode(false); setSelectedToDelete([]); }}
              style={{padding:"7px 13px",borderRadius:"8px",border:"1.5px solid #6ee7b7",background:"rgba(16,185,129,0.15)",color:"#6ee7b7",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>
              🔓 Admin activo — salir
            </button>
          )}
          <button onClick={() => { setHistorialScreen(false); setAdminMode(false); setSelectedToDelete([]); }}
            style={{padding:"7px 14px",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.12)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>
            Volver
          </button>
        </div>
      </header>

      <div style={{padding:"24px",maxWidth:"900px",margin:"0 auto"}}>
        {/* Modal admin */}
        {adminModalOpen && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#fff",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"360px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:"var(--navy)",marginBottom:"6px"}}>🔑 Acceso Administrador</div>
              {adminError && <div className="login-error">{adminError}</div>}
              <input className="input-field" type="password" placeholder="Contraseña admin"
                value={adminPass} onChange={e => setAdminPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerifyAdmin()}
                style={{marginBottom:"14px"}} />
              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={() => setAdminModalOpen(false)}
                  style={{flex:1,padding:"10px",borderRadius:"8px",border:"1.5px solid #e2e8f0",background:"transparent",color:"var(--muted)",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",cursor:"pointer"}}>
                  Cancelar
                </button>
                <button onClick={handleVerifyAdmin} disabled={adminLoading || !adminPass}
                  style={{flex:1,padding:"10px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,var(--navy),var(--teal))",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer",opacity:adminLoading||!adminPass?0.6:1}}>
                  {adminLoading ? "Verificando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="card" style={{marginBottom:"20px"}}>
          <div className="card-title"><div className="card-title-icon">🔍</div>Buscar paciente</div>
          <div className="historial-search-row">
            <input className="input-field" placeholder="Nombre, apellido o número de identidad"
              value={historialQuery} onChange={e => setHistorialQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleHistorialSearch()} />
            <button className="eval-btn" style={{padding:"10px 20px",fontSize:"14px"}}
              onClick={handleHistorialSearch} disabled={historialLoading || !historialQuery.trim()}>
              {historialLoading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {historialError && <div className="age-error" style={{marginTop:"8px"}}>⚠️ {historialError}</div>}
        </div>

        {/* Barra admin */}
        {adminMode && historialResults && historialResults.length > 0 && (
          <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:"10px",padding:"12px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
            <input type="checkbox" checked={allSelected}
              onChange={() => setSelectedToDelete(allSelected ? [] : allIds)}
              style={{width:"16px",height:"16px",cursor:"pointer"}} />
            <span style={{fontSize:"13px",color:"#991b1b",fontWeight:600}}>
              {selectedToDelete.length > 0 ? `${selectedToDelete.length} seleccionada(s)` : "Seleccionar evaluaciones a eliminar"}
            </span>
            {selectedToDelete.length > 0 && (
              <button onClick={handleDeleteSelected}
                style={{marginLeft:"auto",padding:"7px 16px",borderRadius:"8px",border:"none",background:"#DC2626",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
                🗑️ Eliminar {selectedToDelete.length}
              </button>
            )}
          </div>
        )}

        {/* Resultados */}
        {historialResults && (
          <div className="card">
            <div className="card-title"><div className="card-title-icon">👤</div>{historialResults.length} resultado(s)</div>
            {historialResults.map((ev) => (
              <div key={ev._id} className="historial-eval-card"
                style={{border: adminMode && selectedToDelete.includes(ev._id) ? "2px solid #DC2626" : "1px solid #e2e8f0", background: adminMode && selectedToDelete.includes(ev._id) ? "#FEF2F2" : "#fff"}}>
                <div className="historial-eval-header">
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    {adminMode && (
                      <input type="checkbox" checked={selectedToDelete.includes(ev._id)}
                        onChange={() => toggleSelectEval(ev._id)} style={{width:"16px",height:"16px",cursor:"pointer"}} />
                    )}
                    <div>
                      <div style={{fontWeight:700,color:"var(--navy)",fontSize:"15px"}}>{ev.patientName}</div>
                      <div style={{fontSize:"12px",color:"var(--muted)"}}>
                        {new Date(ev.evaluationDate).toLocaleDateString("es-HN",{day:"2-digit",month:"2-digit",year:"numeric"})}
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:"right",fontSize:"12px",color:"var(--muted)"}}>
                    <div>{ev.patientAge ? `${Math.floor(ev.patientAge)} año(s)` : ""}</div>
                    <div>{ev.patientDepto}{ev.patientMunicipio ? `, ${ev.patientMunicipio}` : ""}</div>
                  </div>
                </div>
                {(ev.results || []).map((r) => (
                  <div key={r.cancerId} style={{borderLeft:`3px solid ${r.suspicionLevel>=3?"#ef4444":r.suspicionLevel===2?"#f59e0b":"#10b981"}`,paddingLeft:"10px",marginBottom:"10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"3px"}}>
                      <span style={{fontSize:"13px",color:"var(--navy)",fontWeight:700}}>{r.cancerName}</span>
                      <span className={lvlClass(r.suspicionLevel)}>N{r.suspicionLevel} — {lvlLabel[r.suspicionLevel]}</span>
                    </div>
                    <div style={{fontSize:"11px",color:"var(--muted)"}}>
                      Score: <strong>{r.totalScore} pts</strong> · Síntomas: <strong>{r.matchedCount}</strong> · Discriminadores: <strong>{r.uniqueDiscriminators}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Recientes */}
        {recentEvals.length > 0 && !historialResults && (
          <div className="card">
            <div className="card-title"><div className="card-title-icon">🕐</div>Evaluaciones recientes</div>
            {recentEvals.map((ev) => (
              <div key={ev._id} className="historial-eval-card" style={{cursor:"pointer"}}
                onClick={() => { setHistorialQuery(ev.patientName); handleHistorialSearch(); }}>
                <div className="historial-eval-header">
                  <div>
                    <div style={{fontWeight:700,color:"var(--navy)",fontSize:"14px"}}>{ev.patientName}</div>
                    <div style={{fontSize:"12px",color:"var(--muted)"}}>{ev.patientId}</div>
                  </div>
                  <div style={{fontSize:"12px",color:"var(--muted)"}}>
                    {new Date(ev.evaluationDate).toLocaleDateString("es-HN",{day:"2-digit",month:"2-digit",year:"numeric"})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
