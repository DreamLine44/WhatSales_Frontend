/**
 * services/api.js — WhatSalesAgent2 Frontend
 *
 * Audited against WhatSalesAgent2_merged_fixed backend.
 *
 * Auth:     x-api-key header (tenant key, SHA-256 hashed by backend)
 * Base URL: https://web-production-32cc.up.railway.app
 *
 * Route mounting (from app.js):
 *   /business   → businessRoutes
 *   /dashboard  → dashboardRoutes
 *   /admin      → adminRoutes (tenant key or super-admin)
 *   /admin/tenants → tenantRoutes (super-admin only)
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers ────────────────────────────────────────────────
export function getApiKey()   { return localStorage.getItem('ws_api_key')   || ''; }
export function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }
export function getUser()     { return JSON.parse(localStorage.getItem('ws_user') || 'null'); }

export function saveCredentials({ apiKey, tenantId, user }) {
  if (apiKey)   localStorage.setItem('ws_api_key',   apiKey);
  if (tenantId) localStorage.setItem('ws_tenant_id', tenantId);
  if (user)     localStorage.setItem('ws_user',      JSON.stringify(user));
}

export function clearCredentials() {
  localStorage.removeItem('ws_api_key');
  localStorage.removeItem('ws_tenant_id');
  localStorage.removeItem('ws_user');
}

// ── Axios instance ────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const key = getApiKey();
  if (key) config.headers['x-api-key'] = key;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearCredentials();
      // Also clear admin session if present — a 401 on an admin key means it's invalid
      sessionStorage.removeItem('ws_admin_session');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────
// No username/password endpoint exists. "Login" = verify API key + tenantId
// against GET /business/:tenantId. Tenant must have status: ACTIVE in DB.
export const auth = {
  login: async (apiKey, tenantId) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
    });
    const business = res.data?.business;
    const user = {
      name:         business?.name         || 'Business',
      adminPhone:   business?.adminPhone   || '',
      businessMode: business?.businessMode || '',
    };
    saveCredentials({ apiKey, tenantId, user });
    return { business, user, tenantId };
  },

  logout: () => { clearCredentials(); },

  verify: async () => {
    const key = getApiKey();
    const tid = getTenantId();
    if (!key || !tid) throw new Error('No credentials stored');
    const res = await axios.get(`${BASE_URL}/business/${tid}`, {
      headers: { 'x-api-key': key },
    });
    const business = res.data?.business;
    const user = {
      name:         business?.name         || 'Business',
      adminPhone:   business?.adminPhone   || '',
      businessMode: business?.businessMode || '',
    };
    saveCredentials({ user });
    return { business, user };
  },
};

// ── Business Config ───────────────────────────────────────────────────
// GET /business/:tenantId          → { business }
// PUT /business/:tenantId          → { business }  (full replace, strips _id/tenantId/__v)
//
// PATCH /dashboard/:tenantId/settings  → { ok, business }
//   Allowed fields ONLY: name, description, adminPhone, payment, leadCapture,
//   customMessages, hours, settings, businessMode, addOns
//   NOTE: `address` is NOT in the allowed list → silently dropped by backend.
//   NOTE: `timezone` must be nested inside `hours` object: { hours: { timezone } }
export const business = {
  get: () => api.get(`/business/${getTenantId()}`),

  // Full PUT replace — omit immutable fields
  update: (data) => {
    const { _id, tenantId, __v, ...safe } = data;
    return api.put(`/business/${getTenantId()}`, safe);
  },

  // Partial PATCH — only allowed fields reach the DB
  updateSettings: (data) => api.patch(`/dashboard/${getTenantId()}/settings`, data),

  // hours must be sent as a nested object: { hours: { enabled, timezone, open, close, days } }
  updateHours: (hours) => api.patch(`/dashboard/${getTenantId()}/settings`, { hours }),

  // payment is nested: { payment: { requireProof, wavePhone, enabled, currency } }
  updatePayment: (payment) => api.patch(`/dashboard/${getTenantId()}/settings`, { payment }),

  // businessMode is a top-level allowed field
  updateMode: (businessMode) => api.patch(`/dashboard/${getTenantId()}/settings`, { businessMode }),

  // customMessages is top-level allowed field
  updateMessages: (customMessages) => api.patch(`/dashboard/${getTenantId()}/settings`, { customMessages }),
};

// ── Tenant (read-only — WhatsApp credentials are super-admin only) ────
// No tenant-level WhatsApp credential update route exists on this backend.
// Credentials are managed via PATCH /admin/tenants/:id (super-admin only).
export const tenant = {
  connectWhatsApp: () => Promise.reject({
    response: {
      data: {
        message: 'WhatsApp credentials can only be updated by an administrator. Contact your WhatSales admin.',
      },
    },
  }),

  testWebhook: () => Promise.reject({
    response: { data: { message: 'Webhook testing is not available from the dashboard.' } },
  }),
};

// ── Menu ──────────────────────────────────────────────────────────────
// GET    /dashboard/:tenantId/menu                    → { menuItems, count }
// POST   /dashboard/:tenantId/menu                    → { menuItems }  201
// PATCH  /dashboard/:tenantId/menu/:itemId            → { menuItems }
// DELETE /dashboard/:tenantId/menu/:itemId            → { ok: true }
//
// Image upload (dedicated endpoints — multipart/form-data, field "image"):
// POST   /dashboard/:tenantId/menu/:itemId/image      → { ok, image, menuItem }
// DELETE /dashboard/:tenantId/menu/:itemId/image      → { ok: true }
//
// Image upload requires Cloudinary to be configured on the backend.
// If not configured, backend returns 503 with a clear error message.
// Accepted types: JPEG, PNG, WebP, GIF — max 5 MB.
//
// For text-only creates/updates, send plain JSON (not FormData).
// boolean `available` must be a real boolean — FormData coerces it to string.
export const menu = {
  list: () => api.get(`/dashboard/${getTenantId()}/menu`),

  // Create a new menu item (JSON only — no image; use uploadImage after creation)
  create: (data) => {
    const body = data instanceof FormData ? formDataToJson(data) : data;
    return api.post(`/dashboard/${getTenantId()}/menu`, body);
  },

  // Update text fields of a menu item (JSON only — use uploadImage for images)
  update: (id, data) => {
    const body = data instanceof FormData ? formDataToJson(data) : data;
    return api.patch(`/dashboard/${getTenantId()}/menu/${id}`, body);
  },

  delete: (id) => api.delete(`/dashboard/${getTenantId()}/menu/${id}`),

  // Upload or replace the image for an existing menu item.
  // file: File object (JPEG/PNG/WebP/GIF, max 5 MB)
  // showImageOnSelect: bool — whether the bot auto-sends this image (default true)
  // Returns: { ok, image: { url, public_id }, menuItem }
  // Throws 503 if Cloudinary is not configured on the backend.
  uploadImage: (itemId, file, showImageOnSelect = true) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('showImageOnSelect', String(showImageOnSelect));
    // Do NOT set Content-Type manually — axios sets multipart/form-data + boundary automatically
    return api.post(`/dashboard/${getTenantId()}/menu/${itemId}/image`, fd);
  },

  // Remove the image from a menu item and delete it from Cloudinary.
  removeImage: (itemId) =>
    api.delete(`/dashboard/${getTenantId()}/menu/${itemId}/image`),
};

// ── Services ──────────────────────────────────────────────────────────
// GET    /dashboard/:tenantId/services             → { services, count }
// POST   /dashboard/:tenantId/services             → { services }         201
// PATCH  /dashboard/:tenantId/services/:serviceId  → { services }
// DELETE /dashboard/:tenantId/services/:serviceId  → { ok: true }
export const services = {
  list:   ()           => api.get(`/dashboard/${getTenantId()}/services`),
  create: (data)       => api.post(`/dashboard/${getTenantId()}/services`, data),
  update: (id, data)   => api.patch(`/dashboard/${getTenantId()}/services/${id}`, data),
  delete: (id)         => api.delete(`/dashboard/${getTenantId()}/services/${id}`),
};

// ── FAQs ──────────────────────────────────────────────────────────────
// GET    /dashboard/:tenantId/faqs          → { faq, count }   ← key is "faq" not "faqs"
// POST   /dashboard/:tenantId/faqs          → { faq }          201  requires: trigger, reply
// PATCH  /dashboard/:tenantId/faqs/:faqId   → { faq }
// DELETE /dashboard/:tenantId/faqs/:faqId   → { ok: true }
export const faqs = {
  // Backend returns { faq: [...], count } — key is "faq" (singular).
  // Normalise to expose both .faq and .faqs so pages can use either.
  list: () =>
    api.get(`/dashboard/${getTenantId()}/faqs`).then(res => ({
      ...res,
      data: {
        ...res.data,
        faqs: res.data?.faq ?? res.data?.faqs ?? [],
        faq:  res.data?.faq ?? res.data?.faqs ?? [],
        count: res.data?.count ?? 0,
      },
    })),
  create: (data)       => api.post(`/dashboard/${getTenantId()}/faqs`, data),
  update: (id, data)   => api.patch(`/dashboard/${getTenantId()}/faqs/${id}`, data),
  delete: (id)         => api.delete(`/dashboard/${getTenantId()}/faqs/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────
// GET   /dashboard/:tenantId/orders?status=&limit=&page=
//         → { orders, total, page, pages }
//         Supported query params: status, limit, page   (NO search param)
//
// PATCH /dashboard/:tenantId/orders/:orderId/status
//         body: { status, notes? }
//         Valid statuses: pending | confirmed | completed | cancelled | payment_failed | rejected
//
// GET   /dashboard/:tenantId/orders/customer/:customerPhone?limit=
//         → { orders, count, customerPhone }
//
// NOTE: No GET /orders/:id single-record endpoint exists on the backend.
//       Orders have a `shortId` field (last 6 chars of _id, e.g. "A1B2C3").
//       Actions use MongoDB `_id` (full ObjectId string).
export const orders = {
  list: (params = {}) => {
    // Backend only supports: status, limit, page — strip everything else
    const { status, limit, page } = params;
    const clean = {};
    if (status) clean.status = status;
    if (limit)  clean.limit  = limit;
    if (page)   clean.page   = page;
    return api.get(`/dashboard/${getTenantId()}/orders`, { params: clean });
  },

  approve: (orderId) => api.patch(
    `/dashboard/${getTenantId()}/orders/${orderId}/status`,
    { status: 'confirmed' }
  ),

  reject: (orderId) => api.patch(
    `/dashboard/${getTenantId()}/orders/${orderId}/status`,
    { status: 'rejected' }
  ),

  cancel: (orderId) => api.patch(
    `/dashboard/${getTenantId()}/orders/${orderId}/status`,
    { status: 'cancelled' }
  ),

  updateStatus: (orderId, status, notes) => api.patch(
    `/dashboard/${getTenantId()}/orders/${orderId}/status`,
    { status, ...(notes ? { notes } : {}) }
  ),

  byCustomer: (phone, limit = 10) => api.get(
    `/dashboard/${getTenantId()}/orders/customer/${phone}`,
    { params: { limit } }
  ),
};

// ── Bookings ──────────────────────────────────────────────────────────
// GET   /dashboard/:tenantId/bookings?status=&limit=&page=
//         → { bookings, total, page, pages }
//         Supported query params: status, limit, page   (NO search param)
//
// PATCH /dashboard/:tenantId/bookings/:bookingId/status
//         body: { status, adminNote?, date?, time? }
//         Valid statuses: pending | confirmed | completed | cancelled
//
// NOTE: No GET /bookings/:id single-record endpoint.
//       Bookings also have a `shortId` field (display only, like orders).
export const bookings = {
  list: (params = {}) => {
    // Backend only supports: status, limit, page
    const { status, limit, page } = params;
    const clean = {};
    if (status) clean.status = status;
    if (limit)  clean.limit  = limit;
    if (page)   clean.page   = page;
    return api.get(`/dashboard/${getTenantId()}/bookings`, { params: clean });
  },

  confirm: (bookingId, adminNote) => api.patch(
    `/dashboard/${getTenantId()}/bookings/${bookingId}/status`,
    { status: 'confirmed', ...(adminNote ? { adminNote } : {}) }
  ),

  // "decline" maps to status "cancelled"
  decline: (bookingId, reason) => api.patch(
    `/dashboard/${getTenantId()}/bookings/${bookingId}/status`,
    { status: 'cancelled', ...(reason ? { adminNote: reason } : {}) }
  ),

  reschedule: (bookingId, date, time, adminNote) => api.patch(
    `/dashboard/${getTenantId()}/bookings/${bookingId}/status`,
    { status: 'confirmed', date, time, ...(adminNote ? { adminNote } : {}) }
  ),

  updateStatus: (bookingId, status, extra = {}) => api.patch(
    `/dashboard/${getTenantId()}/bookings/${bookingId}/status`,
    { status, ...extra }
  ),
};

// ── Sessions / Conversations ──────────────────────────────────────────
// GET   /dashboard/:tenantId/conversations?limit=
//         → { conversations: [...], count }
//         Session fields: customerPhone, customerName, lastSeen, messageCount,
//                         humanMode, currentFlow
//
// PATCH /dashboard/:tenantId/conversations/:phone/human
//         body: { humanMode: boolean }   ← must be boolean, not string
//         On humanMode: false, backend sends a WhatsApp notification to customer.
export const sessions = {
  list: (params = {}) =>
    api
      .get(`/dashboard/${getTenantId()}/conversations`, {
        params: { limit: params.limit || 50 },
      })
      .then((res) => {
        // humanMode filtering is done client-side in the component — no server-side param
        const conversations = res.data?.conversations || [];
        return {
          ...res,
          data: {
            ...res.data,
            sessions: conversations,
            conversations,
            total: conversations.length,
            count: conversations.length,
          },
        };
      }),

  // Resume bot for a specific customer phone — sets humanMode: false
  // Backend also sends the customer a WhatsApp message notifying them
  resumeBot: (customerPhone) =>
    api.patch(
      `/dashboard/${getTenantId()}/conversations/${customerPhone}/human`,
      { humanMode: false }
    ),

  takeOver: (customerPhone) =>
    api.patch(
      `/dashboard/${getTenantId()}/conversations/${customerPhone}/human`,
      { humanMode: true }
    ),

  // Derived from conversations list — no dedicated count endpoint
  humanModeCount: async () => {
    const res = await api.get(`/dashboard/${getTenantId()}/conversations`, {
      params: { limit: 200 },
    });
    const count = (res.data?.conversations || []).filter((c) => c.humanMode).length;
    return { data: { count } };
  },
};

// ── Analytics ─────────────────────────────────────────────────────────
//
// Backend GET /dashboard/:tenantId/overview
//   → { business, last30Days: { orders, bookings, customers, revenue }, activeHumanSessions }
//
// Backend GET /dashboard/:tenantId/analytics?days=
//   → { orders, bookings, revenue, days }
//   (aggregate counts only — no daily series, no topItems, no funnel)
//
// All time-series charts (revenue line, messages bar) will be empty until
// the backend adds daily-series data to getAnalyticsSummary().
export const analytics = {
  // Normalised overview shape — period is always last 30 days from backend
  overview: async () => {
    const res = await api.get(`/dashboard/${getTenantId()}/overview`);
    const d = res.data;
    return {
      ...res,
      data: {
        totalOrders:    d.last30Days?.orders    ?? 0,
        totalRevenue:   d.last30Days?.revenue   ?? 0,
        totalBookings:  d.last30Days?.bookings  ?? 0,
        activeSessions: d.activeHumanSessions   ?? 0,
        totalMessages:  null,   // not in backend response
        conversionRate: null,   // not in backend response
        ordersByStatus: null,   // not in backend response
        _raw: d,
      },
    };
  },

  // GET /dashboard/:tenantId/analytics?days=N
  // Returns: { orders, bookings, revenue, days }
  analytics: (days = 30) =>
    api.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),

  // STUB: No daily-series revenue endpoint exists on the backend yet.
  // Returns empty array so charts render gracefully (empty state shown in UI).
  // Once the backend adds a daily-series endpoint, replace this with a real call.
  // eslint-disable-next-line no-unused-vars
  revenue:   async (_period) => ({ data: { data: [] } }),

  // STUB: No daily-series messages endpoint exists on the backend yet.
  // Same pattern as revenue above.
  // eslint-disable-next-line no-unused-vars
  messages:  async (_period) => ({ data: { data: [] } }),

  // STUB: topItems is not returned in backend analytics response.
  // Returns empty array so UI renders "No order data yet" placeholder.
  topProducts: async () => ({ data: { products: [] } }),

  // STUB: No conversion funnel data from backend.
  // Returns empty array so UI renders "No funnel data yet" placeholder.
  conversionFunnel: async () => ({ data: { funnel: [] } }),
};

// ── Customers ─────────────────────────────────────────────────────────
// GET /dashboard/:tenantId/customers?limit=&page=
//   → { customers, count, total, page, pages }
export const customers = {
  list: (params) => api.get(`/dashboard/${getTenantId()}/customers`, { params }),
};

// ── Utility ───────────────────────────────────────────────────────────
/**
 * Convert FormData to a plain JSON object, coercing boolean strings.
 * FormData.append(key, false) sends the STRING "false" not boolean false.
 * Backend Mongoose schemas validate `available` as Boolean, so we must send real booleans.
 *
 * IMPORTANT: The `image` key is intentionally skipped here. Images must be
 * uploaded separately via menuApi.uploadImage() using multipart/form-data.
 * Any binary/File field added to FormData in the future must also be excluded
 * here or it will be coerced to "[object File]" and silently corrupted.
 */
function formDataToJson(fd) {
  const obj = {};
  fd.forEach((v, k) => {
    if (k === 'image') return; // skip file uploads — backend menu routes take JSON only
    if (v === 'true')  { obj[k] = true;  return; }
    if (v === 'false') { obj[k] = false; return; }
    obj[k] = v;
  });
  return obj;
}

export default api;

// ── Admin (Super-Admin only) ──────────────────────────────────────────
// POST   /admin/tenants          → create tenant → { tenant, apiKey }
// GET    /admin/tenants          → list all tenants
// GET    /admin/tenants/:id      → get single tenant
// PATCH  /admin/tenants/:id      → update tenant
// DELETE /admin/tenants/:id      → delete tenant

function getAdminApiKey() {
  const stored = sessionStorage.getItem('ws_admin_session');
  if (stored) {
    try { return JSON.parse(stored).apiKey; } catch {}
  }
  return import.meta.env.VITE_ADMIN_API_KEY || '';
}

function adminHeaders() {
  return { 'x-api-key': getAdminApiKey() };
}

export const adminApi = {
  // List all tenants
  listTenants: () =>
    axios.get(`${BASE_URL}/admin/tenants`, { headers: adminHeaders() }),

  // Get a single tenant by ID
  getTenant: (id) =>
    axios.get(`${BASE_URL}/admin/tenants/${id}`, { headers: adminHeaders() }),

  // Create a new tenant — returns { tenant, apiKey } (apiKey shown ONCE)
  createTenant: (data) =>
    axios.post(`${BASE_URL}/admin/tenants`, data, { headers: adminHeaders() }),

  // Update tenant (WhatsApp creds, status, etc.)
  updateTenant: (id, data) =>
    axios.patch(`${BASE_URL}/admin/tenants/${id}`, data, { headers: adminHeaders() }),

  // Delete tenant
  deleteTenant: (id) =>
    axios.delete(`${BASE_URL}/admin/tenants/${id}`, { headers: adminHeaders() }),

  // Regenerate API key — POST /admin/tenants/:id/regen-key
  regenerateKey: (id) =>
    axios.post(`${BASE_URL}/admin/tenants/${id}/regen-key`, {}, { headers: adminHeaders() }),
};
