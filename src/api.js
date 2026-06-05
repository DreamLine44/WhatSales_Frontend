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
const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
http.interceptors.request.use(cfg => {
  const key = getApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

const adminHttp = axios.create({ baseURL: BASE_URL, timeout: 15000 });
adminHttp.interceptors.request.use(cfg => {
  const key = getAdminApiKey();
  if (key) cfg.headers['x-api-key'] = key;
  return cfg;
});

const errorInterceptor = err => {
  const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error';
  return Promise.reject(new Error(msg));
};
http.interceptors.response.use(r => r, errorInterceptor);
adminHttp.interceptors.response.use(r => r, errorInterceptor);

// ── Public Registration API (3-step flow matching Bruno) ──────────────────────
// This is the CANONICAL onboarding flow confirmed working via Bruno.
// Step 1: POST /register         — creates User + Tenant + API Key
// Step 2: POST /register/business — creates Business profile (requires x-api-key from Step 1)
// Step 3: PUT  /register/whatsapp — connects WhatsApp credentials (requires same x-api-key)
export const registerApi = {
  // STEP 1 — Create user/tenant. Returns { tenantId, apiKey, ... }
  // Body: { name, email, businessName, phone, plan }
  createAccount: (body) =>
    axios.post(`${BASE_URL}/register`, body, { timeout: 15000 }),

  // STEP 2 — Register business config. Requires x-api-key from step 1.
  // Body: full business config (name, description, businessMode, adminPhone, menu, hours, payment, faq, settings, customMessages)
  registerBusiness: (apiKey, body) =>
    axios.post(`${BASE_URL}/register/business`, body, {
      headers: { 'x-api-key': apiKey },
      timeout: 20000,
    }),

  // STEP 3 — Connect WhatsApp. Requires same x-api-key.
  // Body: { phoneNumberId, accessToken, phone }
  connectWhatsApp: (apiKey, body) =>
    axios.put(`${BASE_URL}/register/whatsapp`, body, {
      headers: { 'x-api-key': apiKey },
      timeout: 15000,
    }),
};

// ── Auth (tenant login) ───────────────────────────────────────────────────────
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
  overview:  () => http.get(`/dashboard/${getTenantId()}/overview`),
  orders:    (p = {}) => http.get(`/dashboard/${getTenantId()}/orders`, { params: p }),
  bookings:  (p = {}) => http.get(`/dashboard/${getTenantId()}/bookings`, { params: p }),
  analytics: (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),
  customers: (p = {}) => http.get(`/dashboard/${getTenantId()}/customers`, { params: p }),
};

// ── Business config ───────────────────────────────────────────────────────────
export const bizApi = {
  get:        () => http.get(`/business/${getTenantId()}`),
  update:     (body) => http.put(`/business/${getTenantId()}`, body),
  getMenu:    () => http.get(`/business/${getTenantId()}/menu`),
  replaceMenu: (menuItems) => http.put(`/business/${getTenantId()}/menu`, { menuItems }),
  addMenuItem: (body) => http.post(`/business/${getTenantId()}/menu`, body),
  deleteMenuItem: (id) => http.delete(`/business/${getTenantId()}/menu/${id}`),
};

// ── Order & Booking status updates ───────────────────────────────────────────
export const orderApi = {
  updateStatus: (orderId, body) => http.patch(`/admin/orders/${orderId}/status`, body),
};

export const bookingApi = {
  updateStatus: (bookingId, body) => http.patch(`/admin/bookings/${bookingId}/status`, body),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionsApi = {
  list: (p = {}) => http.get(`/admin/sessions/${getTenantId()}`, { params: p }),
  setHumanMode: (phone, humanMode) =>
    http.patch(`/dashboard/${getTenantId()}/conversations/${encodeURIComponent(phone)}/human`, { humanMode }),
};

// ── Super Admin ───────────────────────────────────────────────────────────────
export const adminApi = {
  // Admin-only tenant management (for admin panel, NOT for public onboarding)
  createTenant:     (body) => adminHttp.post('/admin/tenants', body),
  updateStatus:     (id, status) => adminHttp.patch(`/admin/tenants/${id}/status`, { status }),
  updateTenant:     (id, body) => adminHttp.patch(`/admin/tenants/${id}`, body),
  listTenants:      (p = {}) => adminHttp.get('/admin/tenants', { params: p }),
  getTenant:        (id) => adminHttp.get(`/admin/tenants/${id}`),
  deleteTenant:     (id) => adminHttp.delete(`/admin/tenants/${id}`),
  regenApiKey:      (id) => adminHttp.post(`/admin/tenants/${id}/regen-key`),
  configureWhatsApp:(id) => adminHttp.post(`/admin/tenants/${id}/whatsapp/configure`),
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
export function needsBookings(mode) { return ['SALON', 'BARBERSHOP'].includes(mode); }
export function needsMenu(mode)     { return !['SALON', 'BARBERSHOP'].includes(mode); }
export function needsServices(mode) { return ['SALON', 'BARBERSHOP'].includes(mode); }

// ── BASE_URL export (for webhook URL construction in pages) ───────────────────
export { BASE_URL };
