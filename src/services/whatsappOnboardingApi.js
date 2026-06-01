/**
 * whatsappOnboardingApi.js
 * Isolated API service for the WhatsApp Onboarding System.
 * Does NOT modify or import from existing api.js exports — it reuses
 * the same axios instance and helper functions by importing them.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers (mirrored from api.js without re-export) ────────────
function getApiKey()   { return localStorage.getItem('ws_api_key')   || ''; }
function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }

function getAdminApiKey() {
  const stored = sessionStorage.getItem('ws_admin_session');
  if (stored) {
    try { return JSON.parse(stored).apiKey; } catch {}
  }
  return import.meta.env.VITE_ADMIN_API_KEY || '';
}

// ── Tenant-authenticated instance ─────────────────────────────────────
const tenantHttp = axios.create({ baseURL: BASE_URL });
tenantHttp.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers['x-api-key'] = key;
  return config;
});

// ── Admin-authenticated helpers ───────────────────────────────────────
function adminHeaders() {
  return { 'x-api-key': getAdminApiKey() };
}

// ── Tenant Onboarding API ─────────────────────────────────────────────
// POST /api/whatsapp/request       — submit a new onboarding request
// GET  /api/whatsapp/request/status — check current request status
export const tenantOnboarding = {
  /**
   * Submit a WhatsApp connection request.
   * @param {{ businessName, businessCategory, whatsappNumber, contactPersonName, contactEmail, additionalNotes }} data
   */
  submitRequest: (data) =>
    tenantHttp.post(`/api/whatsapp/request`, {
      ...data,
      tenantId: getTenantId(),
    }),

  /**
   * Get the current onboarding request status for this tenant.
   * Returns: { status, request: { ... }, timeline: [...] }
   * Note: tenant identity is established by the x-api-key header — no tenantId param needed.
   */
  getStatus: () =>
    tenantHttp.get(`/api/whatsapp/request/status`),
};

// ── Admin Onboarding API ──────────────────────────────────────────────
// GET    /admin/whatsapp/requests            — list all requests
// GET    /admin/whatsapp/requests/:id        — get single request
// PATCH  /admin/whatsapp/requests/:id/status — update status + admin notes
// POST   /admin/whatsapp/connect/:tenantId   — save WA credentials
// POST   /admin/whatsapp/test/:tenantId      — test connection
export const adminOnboarding = {
  listRequests: (params = {}) =>
    axios.get(`${BASE_URL}/admin/whatsapp/requests`, {
      headers: adminHeaders(),
      params,
    }),

  getRequest: (id) =>
    axios.get(`${BASE_URL}/admin/whatsapp/requests/${id}`, {
      headers: adminHeaders(),
    }),

  updateStatus: (id, { status, adminNotes }) =>
    axios.patch(
      `${BASE_URL}/admin/whatsapp/requests/${id}/status`,
      { status, adminNotes },
      { headers: adminHeaders() }
    ),

  saveCredentials: (tenantId, { phoneNumberId, wabaId, accessToken, verifyToken }) =>
    axios.post(
      `${BASE_URL}/admin/whatsapp/connect/${tenantId}`,
      { phoneNumberId, wabaId, accessToken, verifyToken },
      { headers: adminHeaders() }
    ),

  testConnection: (tenantId) =>
    axios.post(
      `${BASE_URL}/admin/whatsapp/test/${tenantId}`,
      {},
      { headers: adminHeaders() }
    ),
};

// ── Status helpers ────────────────────────────────────────────────────
export const ONBOARDING_STATUSES = {
  PENDING:    { label: 'Pending Review',  color: 'var(--amber)',   bg: 'var(--amber-dim)',   dot: '#b86d00' },
  CONTACTED:  { label: 'Contacted',       color: 'var(--blue)',    bg: 'var(--blue-dim)',    dot: '#1d58e0' },
  CONNECTING: { label: 'Connecting',      color: 'var(--purple)',  bg: 'var(--purple-dim)',  dot: '#7030e0' },
  CONNECTED:  { label: 'Connected',       color: 'var(--green)',   bg: 'var(--green-dim)',   dot: '#19a348' },
  REJECTED:   { label: 'Rejected',        color: 'var(--red)',     bg: 'var(--red-dim)',     dot: '#dc3535' },
};

export function getStatusMeta(status) {
  return ONBOARDING_STATUSES[status] || ONBOARDING_STATUSES.PENDING;
}

export const BUSINESS_CATEGORIES = [
  'Restaurant / Food & Beverage',
  'Retail / E-Commerce',
  'Health & Beauty',
  'Professional Services',
  'Education & Training',
  'Real Estate',
  'Automotive',
  'Technology',
  'Fashion & Apparel',
  'Travel & Hospitality',
  'Finance & Insurance',
  'Entertainment',
  'Other',
];
