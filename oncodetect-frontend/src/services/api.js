import axios from "axios";

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3001";
  return "https://oncodetect-api-xg8q.onrender.com";
};

export const API_BASE = getApiBase();

export const checkHealth       = (timeout = 8000) => axios.get(`${API_BASE}/health`, { timeout });
export const login             = (username, password) => axios.post(`${API_BASE}/auth/login`, { username, password });
export const verifyToken       = (token) => axios.get(`${API_BASE}/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
export const verifyAdmin       = (password, token) => axios.post(`${API_BASE}/auth/verify-admin`, { password }, { headers: { Authorization: `Bearer ${token}` } });
export const evaluate          = (symptoms, patientAge) => axios.post(`${API_BASE}/evaluate`, { symptoms, patient_age: patientAge });
export const sendReport        = (payload) => axios.post(`${API_BASE}/send-report`, payload);
export const saveEvaluation    = (data, token) => axios.post(`${API_BASE}/evaluations/save`, data, { headers: { Authorization: `Bearer ${token}` } });
export const searchEvaluations = (query, token) => axios.get(`${API_BASE}/evaluations/search?q=${encodeURIComponent(query.trim())}`, { headers: { Authorization: `Bearer ${token}` } });
export const getRecentEvals    = (token) => axios.get(`${API_BASE}/evaluations/recent`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteEvaluation  = (id, token) => axios.delete(`${API_BASE}/evaluations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
export const getEvaluationFHIR = (id, token) => axios.get(`${API_BASE}/evaluations/${id}/fhir`, { headers: { Authorization: `Bearer ${token}` } });
export const getEvaluationsFHIRBulk = (token, query) => axios.get(`${API_BASE}/evaluations/fhir/bulk`, {
  params: query && query.trim() ? { q: query.trim() } : undefined,
  headers: { Authorization: `Bearer ${token}` },
});
export const bulkDelete        = (ids, token) => axios.delete(`${API_BASE}/evaluations/bulk/delete`, { data: { ids }, headers: { Authorization: `Bearer ${token}` } });
