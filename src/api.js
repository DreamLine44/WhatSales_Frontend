import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers ────────────────────────────────────────────────────────
function getApiKey()   { return localStorage.getItem('ws_api_key') || ''; }
function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }

function getAdminApiKey() {
  try {
    const s = sessionStorage.getItem('ws_admin_session');
    if (s) return JSON.parse(s).apiKey || '';
  } catch {}
  return '';
}

// ── Axios instances ───────────────────────────────────────────────────────────
// Tenant API key (Steps 3–6, 8–12 in Bruno spec)
const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
http.interceptors.request.use(cfg => {
  const key = getApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

// Super admin API key (Steps 1, 2, 7 in Bruno spec)
const adminHttp = axios.create({ baseURL: BASE_URL, timeout: 15000 });
adminHttp.interceptors.request.use(cfg => {
  const key = getAdminApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

// Response interceptor — surface backend error messages cleanly
const errorInterceptor = err => {
  const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error';
  return Promise.reject(new Error(msg));
};
http.interceptors.response.use(r => r, errorInterceptor);
adminHttp.interceptors.response.use(r => r, errorInterceptor);

// ── Auth (tenant login) ───────────────────────────────────────────────────────
// Uses GET /business/:tenantId — authenticated with TENANT API KEY
// Returns { business, tenant } — used for both initial login and session restore.
export const authApi = {
  getTenantInfo: async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
    return res.data;
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashApi = {
  overview:      () => http.get(`/dashboard/${getTenantId()}/overview`),
  orders:        (p = {}) => http.get(`/dashboard/${getTenantId()}/orders`, { params: p }),
  bookings:      (p = {}) => http.get(`/dashboard/${getTenantId()}/bookings`, { params: p }),
  analytics:     (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),
  customers:     (p = {}) => http.get(`/dashboard/${getTenantId()}/customers`, { params: p }),
};

// ── Business config (Step 3 spec: PUT /business/:id) ─────────────────────────
// All business settings — name, description, hours, payment, addOns, leadCapture, faq —
// live in a single PUT /business/:id call per the spec.
// Individual field groups are patched by sending only the relevant top-level keys.
export const bizApi = {
  // Step 6: GET /business/:id — full business config
  get: () => http.get(`/business/${getTenantId()}`),

  // Step 3: PUT /business/:id — full or partial config update
  // Pass only the keys you want to update; backend merges them.
  update: (body) => http.put(`/business/${getTenantId()}`, body),

  // ── Menu (Step 4 / 5 / 8 / 12 in spec) ──────────────────────────────────
  // Step 5:  GET  /business/:id/menu          — verify menu
  // Step 4:  PUT  /business/:id/menu          — replace entire menu
  // Step 8:  POST /business/:id/menu          — add single item
  // Step 12: DELETE /business/:id/menu/:itemId — delete one item
  // NOTE: There is no PATCH /business/:id/menu/:id in the spec.
  //       To update a single item, POST to add it or replace the whole menu with PUT.
  getMenu:     () => http.get(`/business/${getTenantId()}/menu`),
  replaceMenu: (menuItems) => http.put(`/business/${getTenantId()}/menu`, { menuItems }),
  addMenuItem: (body) => http.post(`/business/${getTenantId()}/menu`, body),
  deleteMenuItem: (id) => http.delete(`/business/${getTenantId()}/menu/${id}`),
};

// ── Order & Booking status updates ───────────────────────────────────────────
// Step 9:  PATCH /admin/orders/:orderId/status   — uses TENANT API KEY (x-api-key)
// Step 10: PATCH /admin/bookings/:bookingId/status — uses TENANT API KEY (x-api-key)
// Valid order statuses:   pending | confirmed | completed | cancelled | payment_failed | rejected
// Valid booking statuses: pending | confirmed | completed | cancelled
// Customers receive WhatsApp notifications on: confirmed, completed, cancelled, rejected
export const orderApi = {
  updateStatus: (orderId, body) => http.patch(`/admin/orders/${orderId}/status`, body),
};

export const bookingApi = {
  updateStatus: (bookingId, body) => http.patch(`/admin/bookings/${bookingId}/status`, body),
};

// ── Sessions (Step 11 in spec) ────────────────────────────────────────────────
// Step 11: GET /admin/sessions/:tenantId — uses TENANT API KEY
// Supports: ?limit=50 (max 200, default 50), ?page=1, ?humanOnly=true
export const sessionsApi = {
  list: (p = {}) => http.get(`/admin/sessions/${getTenantId()}`, { params: p }),
  // Human mode toggle is a dashboard-level concern — route kept from existing impl
  setHumanMode: (phone, humanMode) =>
    http.patch(`/dashboard/${getTenantId()}/conversations/${encodeURIComponent(phone)}/human`, { humanMode }),
};

// ── Super Admin ───────────────────────────────────────────────────────────────
// All /admin/tenants routes use the SUPER ADMIN API KEY
export const adminApi = {
  // Step 1: POST /admin/tenants — create tenant (status starts PENDING)
  // Returns: { tenant: { _id, name, status, apiKey }, business: { ... } }
  // apiKey is returned ONCE ONLY — hash stored in DB, plaintext unrecoverable after this.
  createTenant: (body) => adminHttp.post('/admin/tenants', body),

  // Step 2: PATCH /admin/tenants/:id/status — activate/deactivate/suspend
  // Body: { status: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "PENDING" }
  // Bot only processes messages when status = ACTIVE and phoneNumberId is set.
  updateStatus: (id, status) => adminHttp.patch(`/admin/tenants/${id}/status`, { status }),

  // Step 7: PATCH /admin/tenants/:id — connect real WhatsApp credentials
  // Also used for general tenant field updates (name, email, businessMode, plan, etc.)
  // Backend merges only the fields provided.
  // After saving whatsapp creds, call configureWhatsApp() to re-initialise the bot.
  updateTenant: (id, body) => adminHttp.patch(`/admin/tenants/${id}`, body),

  listTenants:  (p = {}) => adminHttp.get('/admin/tenants', { params: p }),
  getTenant:    (id) => adminHttp.get(`/admin/tenants/${id}`),
  deleteTenant: (id) => adminHttp.delete(`/admin/tenants/${id}`),

  // POST /admin/tenants/:id/regen-key
  // Returns { apiKey: '<plain-text>' } — the plain key is shown once, then hashed.
  regenApiKey: (id) => adminHttp.post(`/admin/tenants/${id}/regen-key`),

  // POST /admin/tenants/:id/whatsapp/configure
  // Triggers backend to re-initialise the WhatsApp client after credentials are saved.
  // Call this after saveWA to ensure the bot goes live without a server restart.
  // Errors here are non-fatal (warn only).
  configureWhatsApp: (id) => adminHttp.post(`/admin/tenants/${id}/whatsapp/configure`),
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

// ── Business modes ─────────────────────────────────────────────────────────────
export const BUSINESS_MODES = [
  { value: 'RESTAURANT',   label: 'Restaurant',    emoji: '🍽', tier: 'full',  desc: 'Full ordering & payment flow' },
  { value: 'BAKERY',       label: 'Bakery',        emoji: '🥐', tier: 'full',  desc: 'Orders with cake customization' },
  { value: 'SALON',        label: 'Salon',         emoji: '💇', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'BARBERSHOP',   label: 'Barbershop',    emoji: '✂️', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'COSMETICS',    label: 'Cosmetics',     emoji: '💄', tier: 'full',  desc: 'AI-powered skincare advice' },
  { value: 'ELECTRONICS',  label: 'Electronics',   emoji: '📱', tier: 'full',  desc: 'Spec requests & orders' },
  { value: 'FASHION',      label: 'Fashion',       emoji: '👗', tier: 'full',  desc: 'Style-based product matching' },
  { value: 'RETAIL',       label: 'Retail / Shop', emoji: '🛍', tier: 'basic', desc: 'Standard product ordering' },
  { value: 'SUPERMARKET',  label: 'Supermarket',   emoji: '🛒', tier: 'basic', desc: 'Grocery ordering flow' },
  { value: 'PHARMACY',     label: 'Pharmacy',      emoji: '💊', tier: 'basic', desc: 'Medication orders' },
  { value: 'DELIVERY',     label: 'Delivery',      emoji: '🚚', tier: 'basic', desc: 'Delivery ordering flow' },
];

export function getModeConfig(mode) {
  return BUSINESS_MODES.find(m => m.value === mode) || BUSINESS_MODES[0];
}

export function needsBookings(mode) {
  return ['SALON', 'BARBERSHOP'].includes(mode);
}

export function needsMenu(mode) {
  return !['SALON', 'BARBERSHOP'].includes(mode);
}

export function needsServices(mode) {
  return ['SALON', 'BARBERSHOP'].includes(mode);
}
