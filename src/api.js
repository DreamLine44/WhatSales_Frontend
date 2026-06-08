import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers ────────────────────────────────────────────────────────
function getApiKey()   { return localStorage.getItem('ws_api_key') || ''; }
function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }

function getAdminApiKey() {
  try {
    const s = sessionStorage.getItem('ws_admin_session');
    if (s) return JSON.parse(s).apiKey || '';
  } catch { /* sessionStorage unavailable or JSON parse failed — return empty string */ }
  return '';
}

// ── Axios instances ───────────────────────────────────────────────────────────
// Tenant API key — used for /business, /dashboard, /admin (non-superadmin) routes
const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
http.interceptors.request.use(cfg => {
  const key = getApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

// Super admin API key — used for /admin/tenants/* routes
const adminHttp = axios.create({ baseURL: BASE_URL, timeout: 15000 });
adminHttp.interceptors.request.use(cfg => {
  const key = getAdminApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

// Surface backend error messages cleanly
const errorInterceptor = err => {
  const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error';
  return Promise.reject(new Error(msg));
};
http.interceptors.response.use(r => r, errorInterceptor);
adminHttp.interceptors.response.use(r => r, errorInterceptor);

// ── Auth (tenant login) ───────────────────────────────────────────────────────
// [FIX-AUTH-API] GET /business/:tenantId — authenticated with tenant API key
// Returns { business: biz } — AuthContext extracts biz and synthesises user object.
// NOTE: The Tenant document (whatsapp.connected, plan, onboardingStep) is NOT
//       accessible with a tenant API key. See AuthContext for the synthesis logic.
export const authApi = {
  getTenantInfo: async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
    return res.data;
  },
};

// ── Dashboard overview & lists ────────────────────────────────────────────────
// GET /dashboard/:tenantId/overview → { business, last30Days: { orders, bookings, customers, revenue }, activeHumanSessions }
export const dashApi = {
  overview:  () => http.get(`/dashboard/${getTenantId()}/overview`),
  orders:    (p = {}) => http.get(`/dashboard/${getTenantId()}/orders`, { params: p }),
  bookings:  (p = {}) => http.get(`/dashboard/${getTenantId()}/bookings`, { params: p }),
  analytics: (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),
  customers: (p = {}) => http.get(`/dashboard/${getTenantId()}/customers`, { params: p }),
  // ⚠ /customer/ prefix required — avoids Express matching "customer" as :orderId param
  ordersByCustomer: (phone) => http.get(`/dashboard/${getTenantId()}/orders/customer/${encodeURIComponent(phone)}`),
};

// ── Business config ───────────────────────────────────────────────────────────
// GET  /business/:tenantId   → { business: biz }
// PUT  /business/:tenantId   → { business: biz }   (full replace — avoid for partial edits)
// GET  /dashboard/:tenantId/settings → { business }
// PATCH /dashboard/:tenantId/settings → { ok, business }  ✅ use this for all partial saves
export const bizApi = {
  // Direct business config — used by WhatsAppPage and BusinessInfoPage for initial load
  get:    () => http.get(`/business/${getTenantId()}`),
  update: (body) => http.put(`/business/${getTenantId()}`, body),
  // Preferred for partial saves (name, description, hours, customMessages, etc.)
  getSettings:    () => http.get(`/dashboard/${getTenantId()}/settings`),
  updateSettings: (body) => http.patch(`/dashboard/${getTenantId()}/settings`, body),
};

// ── Menu CRUD — /dashboard/:tenantId/menu ─────────────────────────────────────
// GET    → { menuItems, count }
// POST   → 201 { menuItems }
// PATCH  /:itemId → { menuItems }   ⚠ use _id, never item name
// DELETE /:itemId → { ok: true }
// ⚠ price must be a Number, not a string
export const menuApi = {
  list:       () => http.get(`/dashboard/${getTenantId()}/menu`),
  add:        (body) => http.post(`/dashboard/${getTenantId()}/menu`, body),
  update:     (itemId, body) => http.patch(`/dashboard/${getTenantId()}/menu/${itemId}`, body),
  remove:     (itemId) => http.delete(`/dashboard/${getTenantId()}/menu/${itemId}`),
  uploadImage:(itemId, formData) => http.post(`/dashboard/${getTenantId()}/menu/${itemId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  removeImage:(itemId) => http.delete(`/dashboard/${getTenantId()}/menu/${itemId}/image`),
  // Full replace — use menuApi.add/update/remove for atomic edits
  replaceAll: (menuItems) => http.put(`/business/${getTenantId()}/menu`, { menuItems }),
};

// ── Services CRUD — /dashboard/:tenantId/services ────────────────────────────
// GET    → { services, count }
// POST   → 201 { services }
// PATCH  /:serviceId → { services }
// DELETE /:serviceId → { ok: true }
// ⚠ price and duration must be Numbers, not strings
export const servicesApi = {
  list:   () => http.get(`/dashboard/${getTenantId()}/services`),
  add:    (body) => http.post(`/dashboard/${getTenantId()}/services`, body),
  update: (serviceId, body) => http.patch(`/dashboard/${getTenantId()}/services/${serviceId}`, body),
  remove: (serviceId) => http.delete(`/dashboard/${getTenantId()}/services/${serviceId}`),
};

// ── FAQ CRUD — /dashboard/:tenantId/faqs ─────────────────────────────────────
// GET    → { faq, count }
// POST   → 201 { faq }    body: { trigger, reply }
// PATCH  /:faqId → { faq }
// DELETE /:faqId → { ok: true }
export const faqsApi = {
  list:   () => http.get(`/dashboard/${getTenantId()}/faqs`),
  add:    (body) => http.post(`/dashboard/${getTenantId()}/faqs`, body),
  update: (faqId, body) => http.patch(`/dashboard/${getTenantId()}/faqs/${faqId}`, body),
  remove: (faqId) => http.delete(`/dashboard/${getTenantId()}/faqs/${faqId}`),
};

// ── Order status — PATCH /admin/orders/:id/status ─────────────────────────────
// ⚠ Uses TENANT API KEY via http (not adminHttp) — /admin routes accept tenant keys too
// ⚠ status values: pending | payment_pending_verification | confirmed | completed | cancelled | payment_failed | rejected
// ⚠ Auto-sends WhatsApp notification to customer on confirmed / completed / cancelled / rejected
export const orderApi = {
  updateStatus: (orderId, body) => http.patch(`/admin/orders/${orderId}/status`, body),
};

// ── Booking status — PATCH /admin/bookings/:id/status ─────────────────────────
// ⚠ Uses TENANT API KEY via http
// ⚠ status values: pending | confirmed | completed | cancelled
// ⚠ Field is adminNote (not notes) for booking updates
export const bookingApi = {
  updateStatus: (bookingId, body) => http.patch(`/admin/bookings/${bookingId}/status`, body),
};

// ── Sessions — /admin/sessions/:tenantId ──────────────────────────────────────
// GET  /admin/sessions/:tenantId → { sessions, total, page, pages, limit }
//      Supports ?limit, ?page, ?humanOnly=true
// PATCH /dashboard/:tenantId/conversations/:phone/human → { ok, humanMode }
// ⚠ humanMode must be a boolean (not string)
export const sessionsApi = {
  list: (p = {}) => http.get(`/admin/sessions/${getTenantId()}`, { params: p }),
  setHumanMode: (phone, humanMode) =>
    http.patch(
      `/dashboard/${getTenantId()}/conversations/${encodeURIComponent(phone)}/human`,
      { humanMode: Boolean(humanMode) },
    ),
};

// ── Super Admin — /admin/tenants/* ────────────────────────────────────────────
// All routes use adminHttp (SUPER_ADMIN_API_KEY in x-api-key)
export const adminApi = {
  // POST /admin/tenants → { tenant: { _id, name, status, apiKey }, business, next }
  // ⚠ apiKey is returned ONCE ONLY — never stored in DB
  createTenant: (body) => adminHttp.post('/admin/tenants', body),

  // GET /admin/tenants → { tenants, count }
  listTenants: (p = {}) => adminHttp.get('/admin/tenants', { params: p }),

  // GET /admin/tenants/:id → { tenant, business }
  // ⚠ accessToken and verifyToken are ALWAYS stripped server-side
  getTenant: (id) => adminHttp.get(`/admin/tenants/${id}`),

  // PATCH /admin/tenants/:id
  // ⚠ status and onboardingStep NOT accepted here — use /status endpoint
  // ✅ Accepted: name, adminPhone, email, plan, notes, whatsapp.* fields
  updateTenant: (id, body) => adminHttp.patch(`/admin/tenants/${id}`, body),

  // PATCH /admin/tenants/:id/status
  // ⚠ Tenant status is UPPERCASE: ACTIVE | PENDING | SUSPENDED | INACTIVE
  // ⚠ Setting ACTIVE with SIM_ phoneNumberId → backend returns 400
  // ⚠ Setting ACTIVE with onboardingStep < 3 requires { force: true }
  updateStatus: (id, status, opts = {}) =>
    adminHttp.patch(`/admin/tenants/${id}/status`, { status, ...opts }),

  // DELETE /admin/tenants/:id — cascades all tenant data
  deleteTenant: (id) => adminHttp.delete(`/admin/tenants/${id}`),

  // POST /admin/tenants/:id/verify-whatsapp
  // Calls Meta API. Sets whatsapp.connected=true + onboardingStep=3 on success.
  // Must save credentials via updateTenant BEFORE calling this.
  verifyWhatsApp: (id) => adminHttp.post(`/admin/tenants/${id}/verify-whatsapp`),

  // POST /admin/tenants/:id/rotate-key → { ok, apiKey, note }
  // ⚠ New key shown ONCE — previous key immediately invalid
  rotateApiKey: (id) => adminHttp.post(`/admin/tenants/${id}/rotate-key`),
};

// ── Admin session storage ─────────────────────────────────────────────────────
export const adminSession = {
  save:  (apiKey) => sessionStorage.setItem('ws_admin_session', JSON.stringify({ apiKey })),
  clear: () => sessionStorage.removeItem('ws_admin_session'),
  get:   () => {
    try { return JSON.parse(sessionStorage.getItem('ws_admin_session') || 'null'); }
    catch { return null; }
  },
};

// ── Business mode definitions ─────────────────────────────────────────────────
// All 13 modes supported by the backend config/modes.js
export const BUSINESS_MODES = [
  { value: 'RESTAURANT',  label: 'Restaurant',    emoji: '🍽', tier: 'full',  desc: 'Full ordering & payment flow' },
  { value: 'BAKERY',      label: 'Bakery',        emoji: '🥐', tier: 'full',  desc: 'Orders with cake customization' },
  { value: 'SALON',       label: 'Salon',         emoji: '💇', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'BARBERSHOP',  label: 'Barbershop',    emoji: '✂️', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'COSMETICS',   label: 'Cosmetics',     emoji: '💄', tier: 'full',  desc: 'AI-powered skincare advice' },
  { value: 'ELECTRONICS', label: 'Electronics',   emoji: '📱', tier: 'full',  desc: 'Spec requests & orders' },
  { value: 'FASHION',     label: 'Fashion',       emoji: '👗', tier: 'full',  desc: 'Style-based product matching' },
  { value: 'RETAIL',      label: 'Retail / Shop', emoji: '🛍', tier: 'basic', desc: 'Standard product ordering' },
  { value: 'SUPERMARKET', label: 'Supermarket',   emoji: '🛒', tier: 'basic', desc: 'Grocery ordering flow' },
  { value: 'PHARMACY',    label: 'Pharmacy',      emoji: '💊', tier: 'basic', desc: 'Medication orders' },
  { value: 'DELIVERY',    label: 'Delivery',      emoji: '🚚', tier: 'basic', desc: 'Delivery ordering flow' },
  { value: 'SERVICES',    label: 'Services',      emoji: '🔧', tier: 'basic', desc: 'General service business' },
  { value: 'GENERAL',     label: 'General',       emoji: '🏪', tier: 'basic', desc: 'General purpose AI assistant' },
];

export function getModeConfig(mode) {
  return BUSINESS_MODES.find(m => m.value === mode) || BUSINESS_MODES[0];
}

export function needsBookings(mode) {
  return ['SALON', 'BARBERSHOP'].includes(mode);
}

export function needsMenu(mode) {
  return !['SALON', 'BARBERSHOP', 'SERVICES'].includes(mode);
}

export function needsServices(mode) {
  return ['SALON', 'BARBERSHOP', 'SERVICES'].includes(mode);
}
