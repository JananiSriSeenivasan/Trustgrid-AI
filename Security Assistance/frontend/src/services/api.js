import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Dashboard ────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get('/dashboard/stats').then((r) => r.data);

// ── Assets ───────────────────────────────────────────────────
export const getAssets = () =>
  api.get('/assets').then((r) => r.data);

// ── Vulnerabilities ───────────────────────────────────────────
export const getVulnerabilities = () =>
  api.get('/vulnerability').then((r) => r.data);

// ── Risk Analysis (requires a target IP/hostname) ─────────────
export const getRiskAnalysis = (target, options = {}) =>
  api.get('/risk', {
    params: {
      target,
      mode: options.mode ?? 'auto',
      authorized: Boolean(options.authorized),
    },
  }).then((r) => r.data);

// ── Recommendations ───────────────────────────────────────────
export const getRecommendations = () =>
  api.get('/recommendation').then((r) => r.data);

// ── History ───────────────────────────────────────────────────
export const getScanHistory = () =>
  api.get('/history').then((r) => r.data);

export const getLatestScan = () =>
  api.get('/history/latest').then((r) => r.data);

export const deleteScanHistoryEntry = (scanId) =>
  api.delete(`/history/${encodeURIComponent(scanId)}`).then((r) => r.data);

// ── Scan (POST, requires target) ──────────────────────────────
export const startScan = (target, options = {}) =>
  api.post('/scan', null, {
    params: {
      target,
      mode: options.mode ?? 'auto',
      authorized: Boolean(options.authorized),
    },
  }).then((r) => r.data);

// ── AI Security Assistant Chat (legacy /chat endpoint) ────────
export const sendChatMessage = (prompt, targetHost = null) =>
  api.post('/chat', { prompt, target_host: targetHost }).then((r) => r.data);

// ── AI Security Assistant v2 — POST /assistant/chat ───────────
export const chatWithAssistant = (message, targetHost = null) =>
  api
    .post('/assistant/chat', { message, target_host: targetHost }, { timeout: 15000 })
    .then((r) => r.data)
    .catch((err) => {
      if (err.code === 'ECONNABORTED') throw new Error('Request timed out. Backend may be busy.');
      const detail = err?.response?.data?.detail;
      throw new Error(detail || 'AI Assistant unavailable. Check backend.');
    });

// ── Reports Exporter URLs ─────────────────────────────────────
export const getPDFReportURL = (target) => `/api/reports/export/pdf${target ? `?target=${encodeURIComponent(target)}` : ''}`;
export const getCSVExportURL = (target) => `/api/reports/export/csv${target ? `?target=${encodeURIComponent(target)}` : ''}`;

export default api;
