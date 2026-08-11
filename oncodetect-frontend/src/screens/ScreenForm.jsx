import {
  CANCERS,
  MEDICAL_SYSTEMS,
  SYMPTOMS_BY_CANCER,
  SYMPTOMS_CAREGIVER,
} from "../data/clinicalData";
import { DEPARTAMENTOS_HN, MUNICIPIOS_HN } from "../data/locationData";
import { audioUrlFor } from "../data/audioData";
import AudioButton from "../components/AudioButton";

export default function ScreenForm({ state }) {
  const {
    userMode,
    setScreen,
    withSpinner,
    doctorToken,
    doctorUsername,
    handleLogout,
    loadRecentEvals,
    setHistorialScreen,

    patientFirstName,
    setPatientFirstName,
    patientLastName,
    setPatientLastName,

    patientDob,
    dobTextInput,
    patientIdentidad,
    setPatientIdentidad,

    patientDepto,
    setPatientDepto,
    patientMunicipio,
    setPatientMunicipio,

    ageCalc,
    ageFormatted,
    dobIsInvalid,
    dobMin,
    dobMax,

    handleDobTextChange,
    handleDobPickerChange,

    selectedCancers,
    selectedSymptoms,
    selectedCareSymptoms,

    toggleCancer,
    toggleSymptom,
    toggleCareSymptom,

    canProceedAge,
    canProceedCancer,
    canEvaluate,

    loading,
    handleEvaluate,
  } = state;

  const selectedMedicalSymptoms = selectedCancers
    .flatMap((cancerId) => SYMPTOMS_BY_CANCER[cancerId] || [])
    .filter(
      (symptom, index, symptoms) =>
        symptoms.findIndex(
          (currentSymptom) => currentSymptom.code === symptom.code
        ) === index
    );

  const symptomsBySystem = MEDICAL_SYSTEMS.reduce(
    (groups, system) => {
      const systemSymptoms = selectedMedicalSymptoms.filter(
        (symptom) => symptom.system === system.id
      );

      if (systemSymptoms.length > 0) {
        groups[system.id] = systemSymptoms;
      }

      return groups;
    },
    {}
  );

  const allCancersSelected = CANCERS.every((cancer) =>
    selectedCancers.includes(cancer.id)
  );

  const handleToggleAllCancers = () => {
    const allCancerIds = CANCERS.map((cancer) => cancer.id);

    const areAllSelected = allCancerIds.every((cancerId) =>
      selectedCancers.includes(cancerId)
    );

    if (areAllSelected) {
      CANCERS.forEach((cancer) => {
        if (selectedCancers.includes(cancer.id)) {
          toggleCancer(cancer.id);
        }
      });

      return;
    }

    CANCERS.forEach((cancer) => {
      if (!selectedCancers.includes(cancer.id)) {
        toggleCancer(cancer.id);
      }
    });
  };

  const handleIdentityChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "");

    let formattedIdentity = digits;

    if (digits.length > 8) {
      formattedIdentity =
        digits.slice(0, 4) +
        "-" +
        digits.slice(4, 8) +
        "-" +
        digits.slice(8, 13);
    } else if (digits.length > 4) {
      formattedIdentity =
        digits.slice(0, 4) +
        "-" +
        digits.slice(4);
    }

    setPatientIdentidad(formattedIdentity);
  };

  const openDatePicker = () => {
    const datePicker = document.getElementById("dob-picker-hidden");

    if (!datePicker) {
      return;
    }

    if (typeof datePicker.showPicker === "function") {
      datePicker.showPicker();
      return;
    }

    datePicker.click();
  };

  return (
    <>
      <header className="app-header">
        <div className="header-logo">
          Onco<span>Detect</span>
        </div>

        <div className="header-badge">Nueva Evaluación</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "auto",
          }}
        >
          <div className={`header-profile ${userMode}`}>
            {userMode === "medico"
              ? "🩺 Modo Médico"
              : "👨‍👩‍👧 Modo Cuidador"}
          </div>

          {userMode === "cuidador" && (
            <button
              type="button"
              onClick={() =>
                withSpinner(() => setScreen("profile"))
              }
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border:
                  "1.5px solid rgba(255,255,255,0.4)",
                background:
                  "rgba(255,255,255,0.12)",
                color:
                  "rgba(255,255,255,0.85)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Volver
            </button>
          )}

          {doctorToken && (
            <button
              type="button"
              onClick={() => {
                loadRecentEvals();
                setHistorialScreen(true);
              }}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border:
                  "1.5px solid rgba(255,255,255,0.4)",
                background:
                  "rgba(255,255,255,0.15)",
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              📋
              <span className="header-btn-text">
                Historial
              </span>
            </button>
          )}

          {doctorToken && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border:
                  "1.5px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color:
                  "rgba(255,255,255,0.75)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <span className="header-btn-text">
                Cerrar sesión
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="main-container">
        {}

        <div className="card">
          <div className="card-title">
            <div className="card-title-icon">👤</div>
            Datos del Paciente
          </div>

          <div className="name-row">
            <div>
              <label htmlFor="patient-first-name">
                Nombre
              </label>

              <input
                id="patient-first-name"
                type="text"
                className="input-field"
                placeholder="Ej: María"
                value={patientFirstName}
                onChange={(event) =>
                  setPatientFirstName(event.target.value)
                }
              />
            </div>

            <div>
              <label htmlFor="patient-last-name">
                Apellido
              </label>

              <input
                id="patient-last-name"
                type="text"
                className="input-field"
                placeholder="Ej: García"
                value={patientLastName}
                onChange={(event) =>
                  setPatientLastName(event.target.value)
                }
              />
            </div>
          </div>

          <div className="two-col-row">
            <div>
              <label htmlFor="patient-dob">
                Fecha de nacimiento
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="patient-dob"
                  type="text"
                  className="input-field"
                  placeholder="DD/MM/AAAA"
                  value={dobTextInput}
                  onChange={(event) =>
                    handleDobTextChange(event.target.value)
                  }
                  maxLength={10}
                  style={{ paddingRight: "44px" }}
                />

                <input
                  type="date"
                  id="dob-picker-hidden"
                  min={dobMin}
                  max={dobMax}
                  value={patientDob}
                  onChange={(event) =>
                    handleDobPickerChange(
                      event.target.value
                    )
                  }
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "36px",
                    height: "36px",
                    right: "4px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                />

                <button
                  type="button"
                  onClick={openDatePicker}
                  style={{
                    position: "absolute",
                    right: "4px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "36px",
                    height: "36px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    zIndex: 1,
                    borderRadius: "6px",
                  }}
                  title="Abrir calendario"
                  aria-label="Abrir calendario"
                >
                  📅
                </button>
              </div>

              {patientDob && ageCalc && (
                <div className="age-display">
                  🎂 Edad calculada:{" "}
                  <span className="age-value">
                    {ageFormatted}
                  </span>
                </div>
              )}

              {dobIsInvalid && (
                <div className="age-error">
                  ⚠️ Fecha inválida. El paciente debe
                  tener entre 0 y 18 años.
                </div>
              )}

              {!patientDob && (
                <div className="form-hint">
                  Formato: día/mes/año · Rango: 0–18
                  años
                </div>
              )}
            </div>

            <div>
              <label htmlFor="patient-identity">
                N.º de identidad{" "}
                {userMode === "medico" ? (
                  <span
                    style={{
                      color: "var(--teal)",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    ● obligatorio
                  </span>
                ) : (
                  <span className="optional">
                    (opcional)
                  </span>
                )}
              </label>

              <input
                id="patient-identity"
                type="text"
                className="input-field"
                placeholder="0000-0000-00000"
                value={patientIdentidad}
                onChange={handleIdentityChange}
                maxLength={15}
              />

              <div className="form-hint">
                Formato hondureño: 0000-0000-00000
              </div>
            </div>
          </div>

          <div className="two-col-row">
            <div>
              <label htmlFor="patient-department">
                Departamento de procedencia
              </label>

              <select
                id="patient-department"
                className="select-field"
                value={patientDepto}
                onChange={(event) => {
                  setPatientDepto(event.target.value);
                  setPatientMunicipio("");
                }}
              >
                <option value="">
                  — Seleccionar departamento —
                </option>

                {DEPARTAMENTOS_HN.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="patient-municipality">
                Municipio{" "}
                <span className="optional">
                  (opcional)
                </span>
              </label>

              <select
                id="patient-municipality"
                className="select-field"
                value={patientMunicipio}
                onChange={(event) =>
                  setPatientMunicipio(
                    event.target.value
                  )
                }
                disabled={!patientDepto}
              >
                <option value="">
                  — Seleccionar municipio —
                </option>

                {patientDepto &&
                  (
                    MUNICIPIOS_HN[patientDepto] || []
                  ).map((municipality) => (
                    <option
                      key={municipality}
                      value={municipality}
                    >
                      {municipality}
                    </option>
                  ))}
              </select>

              {!patientDepto && (
                <div className="form-hint">
                  Seleccione primero el departamento
                </div>
              )}
            </div>
          </div>
        </div>

        {}

        {userMode === "medico" &&
          canProceedAge && (
            <div className="card">
              <div className="card-title">
                <div className="card-title-icon">
                  🎯
                </div>
                Selección de Cánceres a Evaluar
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--muted)",
                    margin: 0,
                  }}
                >
                  Seleccione uno o más tipos de
                  cáncer según la sospecha clínica.
                </p>

                <button
                  type="button"
                  onClick={handleToggleAllCancers}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "8px",
                    border:
                      "1.5px solid var(--teal)",
                    background:
                      allCancersSelected
                        ? "linear-gradient(135deg,var(--teal),#0e76c8)"
                        : "transparent",
                    color: allCancersSelected
                      ? "#fff"
                      : "var(--teal)",
                    fontFamily:
                      "'DM Sans', sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  {allCancersSelected
                    ? "✓ Todos seleccionados"
                    : "Seleccionar todos"}
                </button>
              </div>

              <div className="cancer-grid">
                {CANCERS.map((cancer) => {
                  const isSelected =
                    selectedCancers.includes(
                      cancer.id
                    );

                  return (
                    <div
                      key={cancer.id}
                      className={`cancer-chip ${
                        isSelected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleCancer(cancer.id)
                      }
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          toggleCancer(cancer.id);
                        }
                      }}
                    >
                      <div className="chip-dot" />

                      <div>
                        <div className="chip-label">
                          {cancer.name}
                        </div>

                        <div className="chip-code">
                          {cancer.abbr}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {}

        {userMode === "medico" &&
          canProceedAge &&
          canProceedCancer && (
            <div className="card">
              <div className="card-title">
                <div className="card-title-icon">
                  🩺
                </div>
                Evaluación Clínica por Sistemas
              </div>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginBottom: "20px",
                }}
              >
                Marque todos los hallazgos observados
                durante la consulta. Los síntomas se
                encuentran organizados por sistemas
                anatómicos para facilitar la evaluación
                clínica.
              </p>

              <div className="medical-systems-list">
                {MEDICAL_SYSTEMS.map((system) => {
                  const symptoms =
                    symptomsBySystem[system.id] || [];

                  if (symptoms.length === 0) {
                    return null;
                  }

                  const selectedCount =
                    symptoms.filter((symptom) =>
                      selectedSymptoms.includes(
                        symptom.code
                      )
                    ).length;

                  return (
                    <details
                      key={system.id}
                      className="medical-system-group"
                      open
                    >
                      <summary className="medical-system-summary">
                        <div className="medical-system-title-wrap">
                          <span className="medical-system-icon">
                            {system.icon}
                          </span>

                          <div>
                            <div className="medical-system-title">
                              {system.name}
                            </div>

                            <div className="medical-system-description">
                              {system.description}
                            </div>
                          </div>
                        </div>

                        <div className="medical-system-counter">
                          {selectedCount > 0
                            ? `${selectedCount} de ${symptoms.length}`
                            : symptoms.length}
                        </div>
                      </summary>

                      <div className="medical-system-body">
                        <div className="symptom-grid">
                          {symptoms.map((symptom) => {
                            const isSelected =
                              selectedSymptoms.includes(
                                symptom.code
                              );

                            return (
                              <div
                                key={symptom.code}
                                className={`symptom-chip ${
                                  isSelected
                                    ? "selected"
                                    : ""
                                }`}
                                onClick={() =>
                                  toggleSymptom(
                                    symptom.code
                                  )
                                }
                                role="checkbox"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (
                                    event.key ===
                                      "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();

                                    toggleSymptom(
                                      symptom.code
                                    );
                                  }
                                }}
                              >
                                <div className="symptom-checkbox" />

                                <div className="symptom-label">
                                  {symptom.label}
                                </div>

                                <div
                                  className={`symptom-level level-${symptom.level}`}
                                >
                                  N{symptom.level}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}

        {}

        {/* ── Symptoms (cuidador) ── */}
{/* ── Symptoms (cuidador) ── */}
{userMode === "cuidador" && canProceedAge && (
  <div className="card">
    <div className="card-title">
      <div className="card-title-icon">🩺</div>
      ¿Qué síntomas presenta el niño?
    </div>

    <div className="caregiver-audio-note">
      <span className="caregiver-audio-note-icon">🔊</span>
      <span>
        Presiona el <strong>altavoz</strong> para escuchar cada síntoma en voz alta.
      </span>
    </div>

    <p
      style={{
        fontSize: "13px",
        color: "var(--muted)",
        marginBottom: "24px",
      }}
    >
      Toca la tarjeta para marcarla. Marca solo lo que hayas notado en las últimas semanas.
    </p>

    {SYMPTOMS_CAREGIVER.map((group) => (
      <div key={group.category} className="cat-group">
        <div className="cat-header">
          {group.category}
        </div>

        {group.symptoms.map((s) => (
          <div
            key={s.id}
            className={`parent-chip caregiver-chip ${
              selectedCareSymptoms.includes(s.id) ? "selected" : ""
            }`}
            onClick={() => toggleCareSymptom(s.id)}
          >
            <div className="parent-checkbox" />

            <div className="parent-label">
              {s.label}
            </div>

            <AudioButton
              src={audioUrlFor(s.id)}
              label={`Escuchar: ${s.label}`}
            />
          </div>
        ))}
      </div>
    ))}
  </div>
)}

        {canProceedAge &&
          (userMode === "medico"
            ? canProceedCancer
            : true) && (
            <button
              type="button"
              className="eval-btn"
              disabled={!canEvaluate || loading}
              onClick={handleEvaluate}
            >
              {loading ? (
                <>
                  <div
                    className="spinner"
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                  />
                  Analizando síntomas...
                </>
              ) : (
                <>🔬 Evaluar Síntomas</>
              )}
            </button>
          )}
      </div>
    </>
  );
}