/**
 * whatsappOnboardingApi.js
 * Isolated API service for the WhatsApp Onboarding System.
 *
 * FIXES:
 *  [FIX-API-1]  BUSINESS_CATEGORIES now matches backend enum exactly (uppercase values)
 *               with human-readable display labels kept separate — category is sent as
 *               the enum value, not the display label.
 *  [FIX-API-2]  tenantOnboarding.submitRequest now maps contactPersonName → contactPerson
 *               and notes → notes (additionalNotes → notes) to match backend field names.
 *  [FIX-API-3]  Removed tenantId from request body — backend reads it from the API key
 *               via requireApiKey middleware. Sending it in body caused confusion.
 *  [FIX-API-4]  adminOnboarding.updateStatus now sends status lowercased — backend
 *               validates with toLowerCase() internally but sending lowercase is canonical.
 *  [FIX-API-5]  Resolved tenantId extraction helper for ConnectionPanel — when a request
 *               is populated by backend (tenantId becomes an object), extract ._id.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers ─────────────────────────────────────────────────────
function getApiKey()   { return localStorage.getItem('ws_api_key')   || ''; }
function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }

function getAdminApiKey() {
  const stored = sessionStorage.getItem('ws_admin_session');
  if (stored) {
    try { return JSON.parse(stored).apiKey; } catch {}
  }
  return import.meta.env.VITE_ADMIN_API_KEY || '';
}

// ── Tenant-authenticated instance ──────────────────────────────────────────
const tenantHttp = axios.create({ baseURL: BASE_URL });
tenantHttp.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers['x-api-key'] = key;
  return config;
});

// ── Admin-authenticated helpers ────────────────────────────────────────────
function adminHeaders() {
  return { 'x-api-key': getAdminApiKey() };
}

/**
 * [FIX-API-5] Safely extract the tenantId string from a request object.
 * When the admin GET /admin/whatsapp/requests/:id populates tenantId,
 * it becomes an object { _id, name, ... }. This helper handles both cases.
 */
export function extractTenantId(request) {
  if (!request?.tenantId) return null;
  // Populated object
  if (typeof request.tenantId === 'object' && request.tenantId._id) {
    return String(request.tenantId._id);
  }
  // Raw string / ObjectId
  return String(request.tenantId);
}

// ── Tenant Onboarding API ──────────────────────────────────────────────────
export const tenantOnboarding = {
  /**
   * Submit a WhatsApp connection request.
   * [FIX-API-2] Maps frontend field names to backend expected names:
   *   contactPersonName → contactPerson
   *   additionalNotes   → notes
   *   businessCategory  → sent as-is (now matches backend enum via BUSINESS_CATEGORIES)
   * [FIX-API-3] tenantId NOT sent in body — backend reads from API key.
   */
  submitRequest: ({ businessName, businessCategory, whatsappNumber, contactPersonName, contactEmail, additionalNotes }) =>
    tenantHttp.post('/api/whatsapp/request', {
      businessName,
      businessCategory,      // [FIX-API-1] now an uppercase enum value e.g. 'RESTAURANT'
      whatsappNumber,
      contactPerson: contactPersonName,   // [FIX-API-2] renamed to match backend
      contactEmail,
      notes: additionalNotes || '',       // [FIX-API-2] renamed to match backend
    }),

  /**
   * Get the current onboarding request status for this tenant.
   */
  getStatus: () =>
    tenantHttp.get('/api/whatsapp/request/status'),
};

// ── Admin Onboarding API ───────────────────────────────────────────────────
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

  /**
   * [FIX-API-4] Status is sent lowercase to be canonical — backend also lowercases
   * internally, but sending it correctly prevents confusion.
   */
  updateStatus: (id, { status, adminNotes }) =>
    axios.patch(
      `${BASE_URL}/admin/whatsapp/requests/${id}/status`,
      {
        status: status ? status.toLowerCase() : status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
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

// ── Status helpers ─────────────────────────────────────────────────────────
// Keys are UPPERCASE to match backend DB values (status stored as lowercase,
// but we normalise to uppercase in the UI for consistent key lookups).
export const ONBOARDING_STATUSES = {
  PENDING:    { label: 'Pending Review',  color: 'var(--amber)',   bg: 'var(--amber-dim)'   },
  CONTACTED:  { label: 'Contacted',       color: 'var(--blue)',    bg: 'var(--blue-dim)'    },
  CONNECTING: { label: 'Connecting',      color: 'var(--purple)',  bg: 'var(--purple-dim)'  },
  CONNECTED:  { label: 'Connected',       color: 'var(--green)',   bg: 'var(--green-dim)'   },
  REJECTED:   { label: 'Rejected',        color: 'var(--red)',     bg: 'var(--red-dim)'     },
};

/**
 * getStatusMeta — looks up status metadata.
 * [FIX-API-6] Accepts both 'pending' (DB lowercase) and 'PENDING' (UI uppercase).
 */
export function getStatusMeta(status) {
  if (!status) return ONBOARDING_STATUSES.PENDING;
  return ONBOARDING_STATUSES[status.toUpperCase()] || ONBOARDING_STATUSES.PENDING;
}

/**
 * normalizeStatus — converts DB lowercase status to UI uppercase key.
 * Use this wherever a status value comes from the backend.
 */
export function normalizeStatus(status) {
  return status ? status.toUpperCase() : 'PENDING';
}

/**
 * [FIX-API-1] BUSINESS_CATEGORIES — aligned with backend enum.
 * Each entry has:
 *   value: the string sent to/from the backend (matches backend BUSINESS_CATEGORIES enum)
 *   label: human-readable string shown in the UI
 */
export const BUSINESS_CATEGORIES = [
  { value: 'RESTAURANT',  label: 'Restaurant / Food & Beverage' },
  { value: 'RETAIL',      label: 'Retail / E-Commerce'          },
  { value: 'SALON',       label: 'Salon / Beauty'               },
  { value: 'BARBERSHOP',  label: 'Barbershop'                   },
  { value: 'BAKERY',      label: 'Bakery'                       },
  { value: 'SUPERMARKET', label: 'Supermarket / Grocery'        },
  { value: 'FASHION',     label: 'Fashion & Apparel'            },
  { value: 'COSMETICS',   label: 'Cosmetics & Health'           },
  { value: 'ELECTRONICS', label: 'Electronics & Technology'     },
  { value: 'PHARMACY',    label: 'Pharmacy / Healthcare'        },
  { value: 'DELIVERY',    label: 'Delivery & Logistics'         },
  { value: 'OTHER',       label: 'Other / Professional Services' },
];
