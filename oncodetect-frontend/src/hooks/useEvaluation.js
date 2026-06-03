import { useState, useCallback, useEffect, useRef } from "react";
import {
  checkHealth, login, verifyAdmin as apiVerifyAdmin,
  evaluate as apiEvaluate, sendReport as apiSendReport,
  saveEvaluation as apiSave, searchEvaluations, getRecentEvals,
  bulkDelete
} from "../services/api";
import { calcAge, formatAge, getNow, getDateLimits } from "../utils/dateUtils";
import { buildReportHtml } from "../utils/pdfUtils";
import { SYMPTOMS_CAREGIVER } from "../data/clinicalData";

export default function useEvaluation() {
  // ── Navigation ──────────────────────────────────────────────────────────────
  const [screen, setScreen]           = useState("welcome");
  const [userMode, setUserMode]       = useState(null);
  const [fhncScreen, setFhncScreen]   = useState(false);
  const [historialScreen, setHistorialScreen] = useState(false);

  // ── Spinner ──────────────────────────────────────────────────────────────────
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const [spinnerMode, setSpinnerMode]       = useState("nav");
  const bootDoneRef                         = useRef(false);

  const withSpinner = useCallback((action, mode = "nav", delay = 1200) => {
    const run = () => {
      setSpinnerMode(mode); setSpinnerVisible(true);
      setTimeout(() => { action(); }, delay * 0.6);
      setTimeout(() => { setSpinnerVisible(false); }, delay);
    };
    if (bootDoneRef.current) { run(); return; }
    const check = setInterval(() => {
      if (bootDoneRef.current) { clearInterval(check); run(); }
    }, 100);
    setTimeout(() => { clearInterval(check); run(); }, 60000);
  }, []);

  // ── Boot ping ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setSpinnerMode("boot"); setSpinnerVisible(true);
    let cancelled = false;
    const startTime = Date.now();
    const ping = async () => {
      try {
        await checkHealth();
        if (!cancelled) {
          const remaining = Math.max(0, 2000 - (Date.now() - startTime));
          setTimeout(() => { if (!cancelled) { bootDoneRef.current = true; setSpinnerVisible(false); } }, remaining);
        }
      } catch {
        if (!cancelled && Date.now() - startTime < 60000) setTimeout(ping, 3000);
        else if (!cancelled) { bootDoneRef.current = true; setSpinnerVisible(false); }
      }
    };
    ping();
    return () => { cancelled = true; };
  }, []);

  // ── Auth médico ──────────────────────────────────────────────────────────────
  const [doctorToken, setDoctorToken]       = useState(null);
  const [doctorUsername, setDoctorUsername] = useState("");
  const [loginUser, setLoginUser]           = useState("");
  const [loginPass, setLoginPass]           = useState("");
  const [loginError, setLoginError]         = useState("");
  const [loginLoading, setLoginLoading]     = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true); setLoginError("");
    try {
      const res = await login(loginUser, loginPass);
      setDoctorToken(res.data.token);
      setDoctorUsername(res.data.username);
      setLoginUser(""); setLoginPass("");
      setUserMode("medico"); setScreen("form");
    } catch (err) {
      setLoginError(err.response?.data?.error || "Error al iniciar sesión.");
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    setDoctorToken(null); setDoctorUsername("");
    setHistorialScreen(false); setHistorialResults(null);
    setScreen("welcome"); setUserMode(null);
  };

  // ── Admin ────────────────────────────────────────────────────────────────────
  const [adminMode, setAdminMode]           = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPass, setAdminPass]           = useState("");
  const [adminError, setAdminError]         = useState("");
  const [adminLoading, setAdminLoading]     = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState([]);

  const handleVerifyAdmin = async () => {
    setAdminLoading(true); setAdminError("");
    try {
      await apiVerifyAdmin(adminPass, doctorToken);
      setAdminMode(true); setAdminModalOpen(false); setAdminPass("");
    } catch (err) {
      setAdminError(err.response?.data?.error || "Contraseña incorrecta.");
    } finally { setAdminLoading(false); }
  };

  // ── Historial ────────────────────────────────────────────────────────────────
  const [historialQuery, setHistorialQuery]     = useState("");
  const [historialResults, setHistorialResults] = useState(null);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialError, setHistorialError]     = useState("");
  const [recentEvals, setRecentEvals]           = useState([]);

  const handleHistorialSearch = async () => {
    if (!historialQuery.trim()) return;
    setHistorialLoading(true); setHistorialError(""); setHistorialResults(null); setSelectedToDelete([]);
    try {
      const res = await searchEvaluations(historialQuery, doctorToken);
      setHistorialResults(res.data.evaluations);
    } catch (err) {
      setHistorialError(err.response?.data?.error || "No se encontraron resultados.");
    } finally { setHistorialLoading(false); }
  };

  const loadRecentEvals = async () => {
    if (!doctorToken) return;
    try {
      const res = await getRecentEvals(doctorToken);
      setRecentEvals(res.data.evaluations);
    } catch { /* silencioso */ }
  };

  const handleDeleteSelected = async () => {
    if (!selectedToDelete.length) return;
    if (!window.confirm(`¿Eliminar ${selectedToDelete.length} evaluación(es)?`)) return;
    try {
      await bulkDelete(selectedToDelete, doctorToken);
      setHistorialResults((prev) => prev.filter((ev) => !selectedToDelete.includes(ev._id)));
      setSelectedToDelete([]);
    } catch { alert("Error al eliminar evaluaciones."); }
  };

  const toggleSelectEval = (id) =>
    setSelectedToDelete((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // ── Patient data ─────────────────────────────────────────────────────────────
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName]   = useState("");
  const [patientDob, setPatientDob]             = useState("");
  const [dobTextInput, setDobTextInput]         = useState("");
  const [patientIdentidad, setPatientIdentidad] = useState("");
  const [patientDepto, setPatientDepto]         = useState("");
  const [patientMunicipio, setPatientMunicipio] = useState("");

  const { min: dobMin, max: dobMax } = getDateLimits();
  const ageCalc      = calcAge(patientDob);
  const ageFormatted = ageCalc ? formatAge(ageCalc) : "";
  const dobIsInvalid = patientDob && !ageCalc;
  const dobFormatted = patientDob
    ? new Date(patientDob + "T00:00:00").toLocaleDateString("es-HN", { day: "2-digit", month: "long", year: "numeric" })
    : "No especificada";
  const patientFullName = `${patientFirstName.trim()} ${patientLastName.trim()}`.trim() || "No especificado";
  const patientData = {
    fullName: patientFullName,
    identidad: patientIdentidad.trim(),
    dobFormatted, ageFormatted,
    departamento: patientDepto,
    municipio: patientMunicipio.trim(),
  };

  const handleDobTextChange = (raw) => {
    let val = raw.replace(/[^\d/]/g, "");
    if (raw.length > dobTextInput.length) {
      const digits = val.replace(/\//g, "");
      if (digits.length <= 2)      val = digits;
      else if (digits.length <= 4) val = digits.slice(0,2) + "/" + digits.slice(2);
      else val = digits.slice(0,2) + "/" + digits.slice(2,4) + "/" + digits.slice(4,8);
    }
    setDobTextInput(val);
    const parts = val.split("/");
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!isNaN(new Date(iso + "T00:00:00").getTime())) { setPatientDob(iso); return; }
    }
    setPatientDob("");
  };

  const handleDobPickerChange = (isoValue) => {
    setPatientDob(isoValue);
    if (isoValue) {
      const [y, m, d] = isoValue.split("-");
      setDobTextInput(`${d}/${m}/${y}`);
    } else { setDobTextInput(""); }
  };

  // ── Symptoms & cancers ───────────────────────────────────────────────────────
  const [selectedCancers, setSelectedCancers]           = useState([]);
  const [selectedSymptoms, setSelectedSymptoms]         = useState([]);
  const [selectedCareSymptoms, setSelectedCareSymptoms] = useState([]);

  const toggleCancer      = (id)   => { setSelectedCancers((p) => p.includes(id)   ? p.filter((c) => c !== id) : [...p, id]); setSelectedSymptoms([]); };
  const toggleSymptom     = (code) =>   setSelectedSymptoms((p)     => p.includes(code) ? p.filter((s) => s !== code) : [...p, code]);
  const toggleCareSymptom = (id)   =>   setSelectedCareSymptoms((p) => p.includes(id)   ? p.filter((s) => s !== id)   : [...p, id]);

  const uniqueCareCodes = [
    ...new Set(
      SYMPTOMS_CAREGIVER.flatMap((g) => g.symptoms)
        .filter((s) => selectedCareSymptoms.includes(s.id))
        .flatMap((s) => s.codes)
    ),
  ];

  // ── Validation ───────────────────────────────────────────────────────────────
  const canProceedAge    = patientFirstName.trim().length > 0 && ageCalc !== null && patientDepto !== ""
    && (userMode === "medico" ? patientIdentidad.trim().length > 0 : true);
  const canProceedCancer = selectedCancers.length > 0;
  const canEvaluate      = userMode === "medico"
    ? canProceedAge && canProceedCancer && selectedSymptoms.length > 0
    : canProceedAge && selectedCareSymptoms.length > 0;

  // ── Evaluate ─────────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);

  const handleEvaluate = useCallback(async () => {
    const symptoms = userMode === "medico" ? selectedSymptoms : uniqueCareCodes;
    if (!ageCalc || !symptoms.length) return;
    setLoading(true); setSpinnerMode("eval"); setSpinnerVisible(true);
    try {
      const res = await apiEvaluate(symptoms, parseFloat((ageCalc.totalMonths / 12).toFixed(2)));
      setResults(res.data.results);
      setSpinnerVisible(false); setScreen("results");
      if (userMode === "medico" && patientIdentidad.trim() && doctorToken) {
        try {
          await apiSave({
            patientId: patientIdentidad.trim(),
            patientName: patientFullName,
            patientDob,
            patientAge: parseFloat((ageCalc.totalMonths / 12).toFixed(2)),
            patientDepto, patientMunicipio,
            userMode, symptoms,
            results: res.data.results,
          }, doctorToken);
        } catch { /* silencioso */ }
      }
    } catch {
      setSpinnerVisible(false);
      alert("Error al conectar con el servidor. Verifica tu conexión.");
    } finally { setLoading(false); }
  }, [ageCalc, selectedSymptoms, uniqueCareCodes, userMode, patientIdentidad, doctorToken]);

  // ── Email ────────────────────────────────────────────────────────────────────
  const [email, setEmail]                 = useState("");
  const [emailStatus, setEmailStatus]     = useState(null);
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !results) return;
    setEmailStatus("sending");
    const symptoms       = userMode === "medico" ? selectedSymptoms : uniqueCareCodes;
    const evaluationDate = getNow();
    const reportHtml     = buildReportHtml(patientData, symptoms, results, userMode, evaluationDate);
    try {
      await apiSendReport({ recipientEmail: email, patientName: patientFullName, patientAge: ageFormatted, symptoms, results, evaluationDate, reportHtml });
      setEmailStatus("ok");
    } catch { setEmailStatus("err"); }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScreen("form");
    setPatientFirstName(""); setPatientLastName(""); setPatientDob(""); setDobTextInput("");
    setPatientIdentidad(""); setPatientDepto(""); setPatientMunicipio("");
    setSelectedCancers([]); setSelectedSymptoms([]); setSelectedCareSymptoms([]);
    setResults(null); setEmail(""); setEmailStatus(null); setShowEmailInput(false);
  };

  return {
    // navigation
    screen, setScreen, userMode, setUserMode, fhncScreen, setFhncScreen,
    historialScreen, setHistorialScreen,
    // spinner
    spinnerVisible, spinnerMode, withSpinner,
    // auth
    doctorToken, doctorUsername, loginUser, setLoginUser, loginPass, setLoginPass,
    loginError, loginLoading, handleLogin, handleLogout,
    // admin
    adminMode, setAdminMode, adminModalOpen, setAdminModalOpen,
    adminPass, setAdminPass, adminError, adminLoading, handleVerifyAdmin,
    selectedToDelete, setSelectedToDelete, toggleSelectEval, handleDeleteSelected,
    // historial
    historialQuery, setHistorialQuery, historialResults, setHistorialResults,
    historialLoading, historialError, recentEvals,
    handleHistorialSearch, loadRecentEvals,
    // patient
    patientFirstName, setPatientFirstName, patientLastName, setPatientLastName,
    patientDob, dobTextInput, patientIdentidad, setPatientIdentidad,
    patientDepto, setPatientDepto, patientMunicipio, setPatientMunicipio,
    patientData, patientFullName, ageCalc, ageFormatted, dobFormatted,
    dobIsInvalid, dobMin, dobMax,
    handleDobTextChange, handleDobPickerChange,
    // symptoms
    selectedCancers, selectedSymptoms, selectedCareSymptoms, uniqueCareCodes,
    toggleCancer, toggleSymptom, toggleCareSymptom,
    // validation
    canProceedAge, canProceedCancer, canEvaluate,
    // evaluate
    loading, results, handleEvaluate,
    // email
    email, setEmail, emailStatus, showEmailInput, setShowEmailInput, handleSendEmail,
    // reset
    handleReset,
  };
}
