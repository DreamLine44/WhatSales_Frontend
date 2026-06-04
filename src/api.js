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

// Response interceptor — surface backend error messages
const errorInterceptor = err => {
  const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Network error';
  return Promise.reject(new Error(msg));
};
http.interceptors.response.use(r => r, errorInterceptor);
adminHttp.interceptors.response.use(r => r, errorInterceptor);

// ── Auth (tenant login) ───────────────────────────────────────────────────────
// [FIX-AUTH-1] login now calls /business/:tenantId (returns { business, tenant })
// instead of /dashboard/:tenantId/overview so the full tenant + whatsapp object
// is available immediately after login — whatsapp fields were always empty before.
export const authApi = {
  login: async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
    return res.data;
  },
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
  overview:       () => http.get(`/dashboard/${getTenantId()}/overview`),
  orders:         (p = {}) => http.get(`/dashboard/${getTenantId()}/orders`, { params: p }),
  // [FIX-API-1] Backend expects { status, notes } — was named correctly but
  // the status enum must match: pending|confirmed|completed|cancelled|payment_failed|rejected
  updateOrder:    (orderId, body) => http.patch(`/dashboard/${getTenantId()}/orders/${orderId}/status`, body),
  bookings:       (p = {}) => http.get(`/dashboard/${getTenantId()}/bookings`, { params: p }),
  // [FIX-API-2] Backend expects { status, adminNote } not { status, notes }
  updateBooking:  (bookingId, body) => http.patch(`/dashboard/${getTenantId()}/bookings/${bookingId}/status`, body),
  analytics:      (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),
  conversations:  (limit = 50) => http.get(`/dashboard/${getTenantId()}/conversations`, { params: { limit } }),
  setHumanMode:   (phone, humanMode) => http.patch(`/dashboard/${getTenantId()}/conversations/${encodeURIComponent(phone)}/human`, { humanMode }),
  customers:      (p = {}) => http.get(`/dashboard/${getTenantId()}/customers`, { params: p }),
  settings:       () => http.get(`/dashboard/${getTenantId()}/settings`),
  updateSettings: (body) => http.patch(`/dashboard/${getTenantId()}/settings`, body),
};

// ── Business (menu / services / FAQs) ────────────────────────────────────────
export const bizApi = {
  get:    () => http.get(`/business/${getTenantId()}`),
  update: (body) => http.put(`/business/${getTenantId()}`, body),

  // Menu — all on dashboard routes (they have image upload support via uploadSingle)
  getMenu:        () => http.get(`/dashboard/${getTenantId()}/menu`),
  addMenuItem:    (fd) => http.post(`/dashboard/${getTenantId()}/menu`, fd),
  updateMenuItem: (id, fd) => http.patch(`/dashboard/${getTenantId()}/menu/${id}`, fd),
  deleteMenuItem: (id) => http.delete(`/dashboard/${getTenantId()}/menu/${id}`),

  // Services
  getServices:   () => http.get(`/dashboard/${getTenantId()}/services`),
  addService:    (body) => http.post(`/dashboard/${getTenantId()}/services`, body),
  updateService: (id, body) => http.patch(`/dashboard/${getTenantId()}/services/${id}`, body),
  deleteService: (id) => http.delete(`/dashboard/${getTenantId()}/services/${id}`),

  // FAQs
  getFaqs:    () => http.get(`/dashboard/${getTenantId()}/faqs`),
  addFaq:     (body) => http.post(`/dashboard/${getTenantId()}/faqs`, body),
  updateFaq:  (id, body) => http.patch(`/dashboard/${getTenantId()}/faqs/${id}`, body),
  deleteFaq:  (id) => http.delete(`/dashboard/${getTenantId()}/faqs/${id}`),
};

// ── Super Admin ───────────────────────────────────────────────────────────────
export const adminApi = {
  // Tenant management (requires SUPER_ADMIN_API_KEY)
  listTenants:    (p = {}) => adminHttp.get('/admin/tenants', { params: p }),
  getTenant:      (id) => adminHttp.get(`/admin/tenants/${id}`),
  createTenant:   (body) => adminHttp.post('/admin/tenants', body),
  updateTenant:   (id, body) => adminHttp.patch(`/admin/tenants/${id}`, body),
  updateStatus:   (id, status) => adminHttp.patch(`/admin/tenants/${id}/status`, { status }),
  deleteTenant:   (id) => adminHttp.delete(`/admin/tenants/${id}`),

  // Admin session management
  getSessions:  (tenantId, p = {}) => adminHttp.get(`/admin/sessions/${tenantId}`, { params: p }),
  // [FIX-ADMIN-1] These go through /admin/* routes, not /dashboard/*
  updateOrderStatus:   (id, body) => adminHttp.patch(`/admin/orders/${id}/status`, body),
  updateBookingStatus: (id, body) => adminHttp.patch(`/admin/bookings/${id}/status`, body),
};

// ── Session storage for admin ─────────────────────────────────────────────────
export const adminSession = {
  save: (apiKey) => sessionStorage.setItem('ws_admin_session', JSON.stringify({ apiKey })),
  clear: () => sessionStorage.removeItem('ws_admin_session'),
  get: () => { try { return JSON.parse(sessionStorage.getItem('ws_admin_session') || 'null'); } catch { return null; } },
};

// ── Business modes ─────────────────────────────────────────────────────────────
// [FIX-MODES] Enum values match backend BusinessConfig.businessMode exactly
export const BUSINESS_MODES = [
  { value: 'RESTAURANT',   label: 'Restaurant',    emoji: '🍽', tier: 'full', desc: 'Full ordering & payment flow' },
  { value: 'BAKERY',       label: 'Bakery',        emoji: '🥐', tier: 'full', desc: 'Orders with cake customization' },
  { value: 'SALON',        label: 'Salon',         emoji: '💇', tier: 'full', desc: 'Bookings & appointment flow' },
  { value: 'BARBERSHOP',   label: 'Barbershop',    emoji: '✂️', tier: 'full', desc: 'Bookings & appointment flow' },
  { value: 'COSMETICS',    label: 'Cosmetics',     emoji: '💄', tier: 'full', desc: 'AI-powered skincare advice' },
  { value: 'ELECTRONICS',  label: 'Electronics',   emoji: '📱', tier: 'full', desc: 'Spec requests & orders' },
  { value: 'FASHION',      label: 'Fashion',       emoji: '👗', tier: 'full', desc: 'Style-based product matching' },
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
