import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

/* ── Scan endpoints ── */
export const submitScan = (payload) =>
    api.post('/scan', payload).then(r => r.data);

export const getScanResult = (id) =>
    api.get(`/scans/${id}`).then(r => r.data);

export const getHistory = () =>
    api.get('/history').then(r => r.data);

/* ── Risk ── */
export const getRisk = (region, date) =>
    api.get('/risk', { params: { region, date } }).then(r => r.data);

/* ── Pipeline logs (backend returns {scan_id, scan_status, steps: [...]}) ── */
export const getLogs = (scanId) =>
    api.get(`/scans/${scanId}/logs`).then(r => r.data?.steps || []);

/* ── Orbital nodes (backend returns {scan_id, nodes: [...], total_nodes}) ── */
export const getNodes = (scanId) =>
    api.get(`/nodes/${scanId}`).then(r => r.data?.nodes || []);

export default api;
