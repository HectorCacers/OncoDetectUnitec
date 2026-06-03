import { CANCERS, SYMPTOMS_BY_CANCER, SYMPTOMS_CAREGIVER } from "../data/clinicalData";
import { DEPARTAMENTOS_HN, MUNICIPIOS_HN } from "../data/locationData";

export default function ScreenForm({ state }) {
  const {
    userMode, setScreen, withSpinner, doctorToken, doctorUsername, handleLogout,
    loadRecentEvals, setHistorialScreen,
    patientFirstName, setPatientFirstName, patientLastName, setPatientLastName,
    patientDob, dobTextInput, patientIdentidad, setPatientIdentidad,
    patientDepto, setPatientDepto, patientMunicipio, setPatientMunicipio,
    ageCalc, ageFormatted, dobIsInvalid, dobMin, dobMax,
    handleDobTextChange, handleDobPickerChange,
    selectedCancers, selectedSymptoms, selectedCareSymptoms,
    toggleCancer, toggleSymptom, toggleCareSymptom,
    canProceedAge, canProceedCancer, canEvaluate,
    loading, handleEvaluate,
  } = state;

  return (
    <>
      <header className="app-header">
        <div className="header-logo">Onco<span>Detect</span></div>
        <div className="header-badge">Nueva Evaluación</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginLeft:"auto"}}>
          <div className={`header-profile ${userMode}`}>{userMode === "medico" ? "🩺 Modo Médico" : "👨‍👩‍👧 Modo Cuidador"}</div>
          {userMode === "cuidador" && (
            <button onClick={() => withSpinner(() => setScreen("profile"))}
              style={{padding:"7px 14px",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.85)",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>
              Volver
            </button>
          )}
          {doctorToken && (
            <button onClick={() => { loadRecentEvals(); setHistorialScreen(true); }}
              style={{padding:"7px 14px",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.15)",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"}}>
              📋 <span className="header-btn-text">Historial</span>
            </button>
          )}
          {doctorToken && (
            <button onClick={handleLogout}
              style={{padding:"7px 12px",borderRadius:"8px",border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"rgba(255,255,255,0.75)",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",cursor:"pointer"}}>
              <span className="header-btn-text">Cerrar sesión</span>
            </button>
          )}
        </div>
      </header>

      <div className="main-container">
        {/* ── Patient data ── */}
        <div className="card">
          <div className="card-title"><div className="card-title-icon">👤</div>Datos del Paciente</div>
          <div className="name-row">
            <div>
              <label>Nombre</label>
              <input type="text" className="input-field" placeholder="Ej: María"
                value={patientFirstName} onChange={(e) => setPatientFirstName(e.target.value)} />
            </div>
            <div>
              <label>Apellido</label>
              <input type="text" className="input-field" placeholder="Ej: García"
                value={patientLastName} onChange={(e) => setPatientLastName(e.target.value)} />
            </div>
          </div>
          <div className="two-col-row">
            <div>
              <label>Fecha de nacimiento</label>
              <div style={{position:"relative"}}>
                <input type="text" className="input-field" placeholder="DD/MM/AAAA"
                  value={dobTextInput} onChange={(e) => handleDobTextChange(e.target.value)}
                  maxLength={10} style={{paddingRight:"44px"}} />
                <input type="date" id="dob-picker-hidden" min={dobMin} max={dobMax}
                  value={patientDob} onChange={(e) => handleDobPickerChange(e.target.value)}
                  style={{position:"absolute",opacity:0,width:"36px",height:"36px",right:"4px",top:"50%",transform:"translateY(-50%)",cursor:"pointer",zIndex:2}} />
                <button type="button"
                  onClick={() => document.getElementById("dob-picker-hidden").showPicker?.() || document.getElementById("dob-picker-hidden").click()}
                  style={{position:"absolute",right:"4px",top:"50%",transform:"translateY(-50%)",width:"36px",height:"36px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",zIndex:1,borderRadius:"6px"}}
                  title="Abrir calendario">📅</button>
              </div>
              {patientDob && ageCalc && <div className="age-display">🎂 Edad calculada: <span className="age-value">{ageFormatted}</span></div>}
              {dobIsInvalid && <div className="age-error">⚠️ Fecha inválida. El paciente debe tener entre 0 y 18 años.</div>}
              {!patientDob && <div className="form-hint">Formato: día/mes/año · Rango: 0–18 años</div>}
            </div>
            <div>
              <label>N.º de identidad {userMode === "medico"
                ? <span style={{color:"var(--teal)",fontSize:"11px",fontWeight:700}}>● obligatorio</span>
                : <span className="optional">(opcional)</span>}
              </label>
              <input type="text" className="input-field" placeholder="0000-0000-00000"
                value={patientIdentidad}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  let f = digits;
                  if (digits.length > 8) f = digits.slice(0,4) + "-" + digits.slice(4,8) + "-" + digits.slice(8,13);
                  else if (digits.length > 4) f = digits.slice(0,4) + "-" + digits.slice(4);
                  setPatientIdentidad(f);
                }} maxLength={15} />
              <div className="form-hint">Formato hondureño: 0000-0000-00000</div>
            </div>
          </div>
          <div className="two-col-row">
            <div>
              <label>Departamento de procedencia</label>
              <select className="select-field" value={patientDepto}
                onChange={(e) => { setPatientDepto(e.target.value); setPatientMunicipio(""); }}>
                <option value="">— Seleccionar departamento —</option>
                {DEPARTAMENTOS_HN.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Municipio <span className="optional">(opcional)</span></label>
              <select className="select-field" value={patientMunicipio}
                onChange={(e) => setPatientMunicipio(e.target.value)} disabled={!patientDepto}>
                <option value="">— Seleccionar municipio —</option>
                {patientDepto && (MUNICIPIOS_HN[patientDepto] || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {!patientDepto && <div className="form-hint">Seleccione primero el departamento</div>}
            </div>
          </div>
        </div>

        {/* ── Cancer selector (médico) ── */}
        {userMode === "medico" && canProceedAge && (
          <div className="card">
            <div className="card-title"><div className="card-title-icon">🎯</div>Selección de Cánceres a Evaluar</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"16px"}}>
              <p style={{fontSize:"13px",color:"var(--muted)",margin:0}}>Seleccione uno o más tipos de cáncer según la sospecha clínica.</p>
              <button onClick={() => {
                const all = CANCERS.map((c) => c.id);
                const allSel = all.every((id) => selectedCancers.includes(id));
                if (allSel) { CANCERS.forEach((c) => selectedCancers.includes(c.id) && toggleCancer(c.id)); }
                else { CANCERS.forEach((c) => !selectedCancers.includes(c.id) && toggleCancer(c.id)); }
              }} style={{padding:"7px 16px",borderRadius:"8px",border:"1.5px solid var(--teal)",
                background: CANCERS.every((c) => selectedCancers.includes(c.id)) ? "linear-gradient(135deg,var(--teal),#0e76c8)" : "transparent",
                color: CANCERS.every((c) => selectedCancers.includes(c.id)) ? "#fff" : "var(--teal)",
                fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.18s"}}>
                {CANCERS.every((c) => selectedCancers.includes(c.id)) ? "✓ Todos seleccionados" : "Seleccionar todos"}
              </button>
            </div>
            <div className="cancer-grid">
              {CANCERS.map((c) => (
                <div key={c.id} className={`cancer-chip ${selectedCancers.includes(c.id) ? "selected" : ""}`} onClick={() => toggleCancer(c.id)}>
                  <div className="chip-dot" />
                  <div><div className="chip-label">{c.name}</div><div className="chip-code">{c.abbr}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Symptoms (médico) ── */}
        {userMode === "medico" && canProceedAge && canProceedCancer && (
          <div className="card">
            <div className="card-title"><div className="card-title-icon">🩺</div>Síntomas Presentes</div>
            <p style={{fontSize:"13px",color:"var(--muted)",marginBottom:"20px"}}>Marque todos los síntomas que el paciente presenta. Los niveles (N1–N4) indican la relevancia clínica según criterios OPS/SIOP.</p>
            {selectedCancers.map((cancerId) => {
              const cancer   = CANCERS.find((c) => c.id === cancerId);
              const symptoms = SYMPTOMS_BY_CANCER[cancerId] || [];
              return (
                <div key={cancerId} className="cancer-symptom-group">
                  <div className="cancer-symptom-header">{cancer?.name}</div>
                  <div className="symptom-grid">
                    {symptoms.map((s) => (
                      <div key={s.code} className={`symptom-chip ${selectedSymptoms.includes(s.code) ? "selected" : ""}`} onClick={() => toggleSymptom(s.code)}>
                        <div className="symptom-checkbox" />
                        <div className="symptom-label">{s.label}</div>
                        <div className={`symptom-level level-${s.level}`}>N{s.level}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Symptoms (cuidador) ── */}
        {userMode === "cuidador" && canProceedAge && (
          <div className="card">
            <div className="card-title"><div className="card-title-icon">🩺</div>¿Qué síntomas presenta el niño?</div>
            <p style={{fontSize:"13px",color:"var(--muted)",marginBottom:"24px"}}>Marque todo lo que haya notado en el niño en las últimas semanas.</p>
            {SYMPTOMS_CAREGIVER.map((group) => (
              <div key={group.category} className="cat-group">
                <div className="cat-header">{group.category}</div>
                {group.symptoms.map((s) => (
                  <div key={s.id} className={`parent-chip ${selectedCareSymptoms.includes(s.id) ? "selected" : ""}`} onClick={() => toggleCareSymptom(s.id)}>
                    <div className="parent-checkbox" />
                    <div className="parent-label">{s.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Eval button ── */}
        {canProceedAge && (userMode === "medico" ? canProceedCancer : true) && (
          <button className="eval-btn" disabled={!canEvaluate || loading} onClick={handleEvaluate}>
            {loading
              ? <><div className="spinner" style={{width:"20px",height:"20px"}} /> Analizando síntomas...</>
              : <>🔬 Evaluar Síntomas</>}
          </button>
        )}
      </div>
    </>
  );
}
