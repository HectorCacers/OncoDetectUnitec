import { useState, useCallback, useEffect, useRef } from "react";
import {
  checkHealth, login, verifyAdmin as apiVerifyAdmin,
  evaluate as apiEvaluate, sendReport as apiSendReport,
  saveEvaluation as apiSave, searchEvaluations, getRecentEvals,
  bulkDelete, getEvaluationFHIR, getEvaluationsFHIRBulk
} from "../services/api";
import { calcAge, formatAge, getNow, getDateLimits } from "../utils/dateUtils";
import { buildReportHtml } from "../utils/pdfUtils";
import { SYMPTOMS_CAREGIVER } from "../data/clinicalData";
import {
  enqueueItem, getPendingItems, removeItem, setItemStatus,
  completeItem, getCompletedItems,
} from "../utils/offlineQueue";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Timeout de 60s para envío de correo: el free tier de Render "duerme" la instancia
// y el cold start puede tardar ~30-60s. Si se reduce este valor (p. ej. 30000ms),
// el envío se cancela por timeout, el botón queda en "Enviando..." y el correo se
// encola como si no hubiera red. NO REDUCIR este valor ni volver a 30000ms.
const EMAIL_SEND_TIMEOUT_MS = 60000;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("request-timeout")), ms)),
  ]);

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

  // ── Conexión ─────────────────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [offlineMessage, setOfflineMessage] = useState("");
  const [pendingCount, setPendingCount]     = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const dismissOfflineMessage = useCallback(() => setOfflineMessage(""), []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingItems();
      setPendingCount(items.length);
    } catch { setPendingCount(0); }
  }, []);

  const refreshCompletedCount = useCallback(async () => {
    try {
      const items = await getCompletedItems();
      setCompletedCount(items.length);
    } catch { setCompletedCount(0); }
  }, []);

  // ── Boot ping (no bloqueante) ────────────────────────────────────────────────
  useEffect(() => {
    setSpinnerMode("boot"); setSpinnerVisible(true);
    let cancelled = false;
    const startTime = Date.now();
    const BOOT_MAX_MS = 12000;

    const finish = () => {
      if (cancelled) return;
      bootDoneRef.current = true;
      setSpinnerVisible(false);
    };

    const ping = async () => {
      try {
        await checkHealth();
        if (!cancelled) {
          setOfflineMessage("");
          const remaining = Math.max(0, 2000 - (Date.now() - startTime));
          setTimeout(finish, remaining);
        }
      } catch {
        if (!cancelled && Date.now() - startTime < BOOT_MAX_MS) {
          setOfflineMessage("Conectando con el servidor...");
          setTimeout(ping, 3000);
        } else if (!cancelled) {
          setOfflineMessage("No se pudo conectar con el servidor. Puedes continuar: las evaluaciones y correos se guardarán en cola.");
          finish();
        }
      }
    };

    // Sin conexión detectada: no intentar el ping, desbloquear de inmediato
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      finish();
    } else {
      ping();
    }

    return () => { cancelled = true; };
  }, []);

  // ── Escuchar cambios de conexión en tiempo real ──────────────────────────────
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true); syncPendingQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cola offline ─────────────────────────────────────────────────────────────
  const syncingRef = useRef(false);

  const syncPendingQueue = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const items = await getPendingItems();
      for (const item of items) {
        try {
          if (item.type === "evaluate") {
            // Ítem encolado offline en handleEvaluate: al recuperar conexión se
            // recalcula y, si era modo médico con guardado, también se persiste en
            // el historial. No borrar: es el flujo offline-first de la app.
            const { symptoms, patient_age: patientAge, meta } = item.payload;
            const res = await withTimeout(apiEvaluate(symptoms, patientAge), 20000);
            if (meta?.save && meta.token) {
              await withTimeout(apiSave({ ...meta.save, results: res.data.results }, meta.token), 20000);
            }
            if (meta?.save) {
              await removeItem(item.id);
            } else {
              await completeItem(item.id, res.data.results);
            }
          } else if (item.type === "email") {
            // Mismo timeout de 60s que en handleSendEmail (ver EMAIL_SEND_TIMEOUT_MS):
            // el cold start de Render puede tardar; no lo reduzcas o el reenvío fallará
            // por timeout. El requestId del payload evita duplicados en el backend.
            await withTimeout(apiSendReport(item.payload), EMAIL_SEND_TIMEOUT_MS);
            await removeItem(item.id);
          } else {
            await removeItem(item.id);
          }
        } catch (err) {
          console.error(`[syncPendingQueue] Falló el ítem ${item.type} (${item.id}), se reintentará:`, err.message);
          await setItemStatus(item.id, "error");
        }
      }
    } finally {
      syncingRef.current = false;
      refreshPendingCount();
      refreshCompletedCount();
    }
  }, [refreshPendingCount, refreshCompletedCount]);

  // Cargar pendientes guardados de sesiones anteriores y sincronizar si hay red
  useEffect(() => {
    refreshPendingCount();
    refreshCompletedCount();
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncPendingQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const isOffline =
        (typeof navigator !== "undefined" && navigator.onLine === false) ||
        !err.response;
      setLoginError(isOffline
        ? "No hay conexión a internet. Debes conectarte para iniciar sesión."
        : (err.response?.data?.error || "Error al iniciar sesión."));
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
    const ageInYears = parseFloat((ageCalc.totalMonths / 12).toFixed(2));
    setLoading(true); setSpinnerMode("eval"); setSpinnerVisible(true);

    const saveMeta = (userMode === "medico" && patientIdentidad.trim() && doctorToken)
      ? {
          patientId: patientIdentidad.trim(),
          patientName: patientFullName,
          patientDob,
          patientAge: ageInYears,
          patientDepto, patientMunicipio,
          userMode, symptoms,
        }
      : null;

    try {
      const res = await withTimeout(apiEvaluate(symptoms, ageInYears), 20000);
      setResults(res.data.results);
      setSpinnerVisible(false); setScreen("results");
      if (saveMeta) {
        try {
          await withTimeout(apiSave({ ...saveMeta, results: res.data.results }, doctorToken), 20000);
        } catch { /* silencioso */ }
      }
      return;
    } catch (err) {
      setSpinnerVisible(false);
      const isOfflineOrSlow =
        err?.message === "request-timeout" ||
        !err?.response ||
        (typeof navigator !== "undefined" && navigator.onLine === false);
      if (isOfflineOrSlow) {
        // Sin conexión / servidor lento: guardar en la cola offline (IndexedDB) para
        // no perder el trabajo. Se procesa en syncPendingQueue al volver el internet y
        // el banner muestra el contador de pendientes. No borrar esta rama: es el flujo
        // offline que permite evaluar sin conexión.
        console.error("[handleEvaluate] Sin conexión o timeout, evaluación encolada:", err.message);
        try {
          await enqueueItem("evaluate", {
            symptoms,
            patient_age: ageInYears,
            patient: {
              firstName: patientFirstName.trim(),
              lastName: patientLastName.trim(),
              identidad: patientIdentidad.trim(),
              dob: patientDob,
              depto: patientDepto,
              municipio: patientMunicipio.trim(),
            },
            selectedCareSymptoms: userMode === "cuidador" ? selectedCareSymptoms : undefined,
            userMode,
            meta: saveMeta ? { save: saveMeta, token: doctorToken } : null,
          });
          await refreshPendingCount();
          setOfflineMessage("Sin conexión. La evaluación se procesará automáticamente cuando vuelva el internet.");
        } catch {
          alert("No se pudo guardar sin conexión. Verifica tu conexión.");
        }
      } else {
        // El servidor respondió con un error real (p. ej. 500): no encolar,
        // mostrar el error real del servidor.
        console.error("[handleEvaluate] Error del servidor:", err.message);
        alert(err.response?.data?.error || "Error al evaluar los síntomas.");
      }
    } finally { setLoading(false); }
  }, [ageCalc, selectedSymptoms, selectedCareSymptoms, uniqueCareCodes, userMode,
      patientIdentidad, patientFirstName, patientLastName, patientDob, patientDepto,
      patientMunicipio, doctorToken, patientFullName, refreshPendingCount]);

  // ── Email ────────────────────────────────────────────────────────────────────
  const [email, setEmail]                 = useState("");
  const [emailStatus, setEmailStatus]     = useState(null);
  const [emailError, setEmailError]       = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !results) return;
    const emails = email.split(",").map((e) => e.trim()).filter(Boolean);
    if (emails.some((e) => !EMAIL_RE.test(e))) {
      setEmailStatus("err");
      return;
    }
    setEmailStatus("sending"); setEmailError("");
    const symptoms       = userMode === "medico" ? selectedSymptoms : uniqueCareCodes;
    const evaluationDate = getNow();
    const reportHtml     = buildReportHtml(patientData, symptoms, results, userMode, evaluationDate);
    const requestId      = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload = {
      recipientEmail: email,
      patientName: patientFullName,
      patientAge: ageFormatted,
      symptoms,
      results,
      evaluationDate,
      reportHtml,
      requestId,
    };
    try {
      await withTimeout(apiSendReport(payload), EMAIL_SEND_TIMEOUT_MS);
      setEmailStatus("ok");
    } catch (err) {
      const isOfflineOrSlow =
        err?.message === "request-timeout" ||
        !err?.response ||
        (typeof navigator !== "undefined" && navigator.onLine === false);
      if (isOfflineOrSlow) {
        // Timeout (cold start de Render) o sin red: encolar para reenviar automáticamente.
        // El backend deduplica por requestId, así el reenvío no genera correos duplicados.
        // No alterar esta rama (el timeout de 60s está fijado en EMAIL_SEND_TIMEOUT_MS).
        console.error("[handleSendEmail] Sin conexión o timeout, correo encolado:", err.message);
        try {
          await enqueueItem("email", payload);
          await refreshPendingCount();
          setEmailStatus("queued");
          setOfflineMessage("Sin conexión. El correo se enviará automáticamente cuando vuelva el internet.");
        } catch {
          setEmailStatus("err");
        }
      } else {
        // El servidor respondió con un error real (p. ej. 500): no encolar, mostrar el error real
        console.error("[handleSendEmail] Error del servidor:", err.message);
        setEmailError(
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Error al enviar el correo."
        );
        setEmailStatus("err");
      }
    }
  };

  // ── Resultados sincronizados de cuidador ─────────────────────────────────────
  const [isViewingCompleted, setIsViewingCompleted] = useState(false);
  const completedViewIdRef                          = useRef(null);

  const viewCompletedResult = useCallback(async (itemId) => {
    try {
      const items = await getCompletedItems();
      const item = items.find((it) => it.id === itemId);
      if (!item) return;
      const p = item.payload?.patient || {};
      if (p.firstName !== undefined) setPatientFirstName(p.firstName);
      if (p.lastName !== undefined)  setPatientLastName(p.lastName);
      if (p.identidad !== undefined) setPatientIdentidad(p.identidad);
      if (p.dob !== undefined)       setPatientDob(p.dob);
      if (p.depto !== undefined)     setPatientDepto(p.depto);
      if (p.municipio !== undefined) setPatientMunicipio(p.municipio);
      setSelectedSymptoms([]);
      setSelectedCareSymptoms(Array.isArray(item.payload?.selectedCareSymptoms)
        ? item.payload.selectedCareSymptoms
        : []);
      setResults(item.result);
      setUserMode(item.payload?.userMode || "cuidador");
      completedViewIdRef.current = item.id;
      setIsViewingCompleted(true);
      setScreen("results");
    } catch { /* silencioso */ }
  }, []);

  const viewMostRecentCompleted = useCallback(async () => {
    try {
      const items = await getCompletedItems();
      if (!items.length) return;
      await viewCompletedResult(items[items.length - 1].id);
    } catch { /* silencioso */ }
  }, [viewCompletedResult]);

  const markCompletedResultViewed = useCallback(async () => {
    const id = completedViewIdRef.current;
    completedViewIdRef.current = null;
    setIsViewingCompleted(false);
    if (id) {
      try { await removeItem(id); } catch { /* silencioso */ }
    }
    await refreshCompletedCount();
    setScreen("form");
  }, [refreshCompletedCount]);

  // Al salir de la pantalla de resultados (si se está viendo un resultado guardado), eliminarlo
  useEffect(() => {
    if (screen !== "results" && completedViewIdRef.current) {
      const id = completedViewIdRef.current;
      completedViewIdRef.current = null;
      setIsViewingCompleted(false);
      removeItem(id).finally(() => refreshCompletedCount());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, refreshCompletedCount]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setScreen("form");
    setPatientFirstName(""); setPatientLastName(""); setPatientDob(""); setDobTextInput("");
    setPatientIdentidad(""); setPatientDepto(""); setPatientMunicipio("");
    setSelectedCancers([]); setSelectedSymptoms([]); setSelectedCareSymptoms([]);
    setResults(null); setEmail(""); setEmailStatus(null); setEmailError(""); setShowEmailInput(false);
  };

  return {
    // navigation
    screen, setScreen, userMode, setUserMode, fhncScreen, setFhncScreen,
    historialScreen, setHistorialScreen,
    // spinner
    spinnerVisible, spinnerMode, withSpinner,
    // conexión / offline
    isOnline, offlineMessage, dismissOfflineMessage, pendingCount, completedCount,
    syncPendingQueue, viewCompletedResult, viewMostRecentCompleted,
    isViewingCompleted, markCompletedResultViewed,
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
    email, setEmail, emailStatus, setEmailStatus, emailError, setEmailError,
    showEmailInput, setShowEmailInput, handleSendEmail,
    // reset
    handleReset,
    // fhir export
    getEvaluationFHIR, getEvaluationsFHIRBulk,
  };
}
