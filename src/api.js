import axios from 'axios';
import { useState, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Credential helpers ────────────────────────────────────────────────────────
function getApiKey()   { return localStorage.getItem('ws_api_key') || ''; }
export function getTenantId() { return localStorage.getItem('ws_tenant_id') || ''; }

// [FEATURE-STAFF-1] AdminUser Bearer session token — kept mutually exclusive
// with ws_api_key (see AuthContext: logging in one way clears the other).
// A stored staff token always wins over a stored api key in the interceptor
// below, matching the backend's own precedence in requireApiKey().
function getStaffToken() { return localStorage.getItem('ws_staff_token') || ''; }

// The session token is `<base64url payload>.<hmac sig>` (see
// services/adminAuthService.js createSessionToken) — the payload half is
// plain JSON, decodable client-side without the HMAC secret. This lets the
// frontend read { sub, tenantId, role, exp } locally (e.g. right after
// accept-invite, whose response doesn't include a tenant block) without an
// extra round trip to /dashboard/auth/me. The backend re-verifies the
// signature on every request regardless — this decode is display/routing
// convenience only, never a trust boundary.
export function decodeSessionToken(token) {
  try {
    const [payloadB64] = String(token).split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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
  // [FEATURE-STAFF-1] Bearer wins if a staff session exists — mirrors the
  // backend's own precedence (requireApiKey tries Bearer first). The two
  // credentials are kept mutually exclusive by AuthContext, but if both were
  // ever present for some reason, sending only one avoids the backend's
  // "should never carry both" ambiguity entirely.
  const staffToken = getStaffToken();
  if (staffToken) {
    cfg.headers['Authorization'] = `Bearer ${staffToken}`;
  } else {
    const key = getApiKey();
    if (key) cfg.headers['x-api-key'] = key;
  }
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

// [AUDIT-FIX-SESSION-EXPIRY] A 401 through `http`/`adminHttp` means the stored
// credential itself is no longer valid (revoked key, expired/rotated staff
// token, deleted admin) — every call through these two instances is already
// authenticated, so this can't fire on the login forms themselves (login,
// staffLogin, completeInvite, adminLogin all use a bare `axios` call, not
// these instances, precisely so a failed login attempt doesn't trigger this).
// Without this, the previous behavior was to leave the stale `user`/`isAdmin`
// state in place and just toast the raw 401 on every subsequent call — the
// person stays on a page that looks logged in while nothing works. Clearing
// the credential and hard-redirecting forces a clean re-login instead.
let sessionExpiryHandled = false;
function handleTenantSessionExpiry() {
  if (sessionExpiryHandled || window.location.pathname === '/login') return;
  sessionExpiryHandled = true;
  localStorage.removeItem('ws_tenant_id');
  localStorage.removeItem('ws_api_key');
  localStorage.removeItem('ws_staff_token');
  localStorage.removeItem('ws_staff_admin');
  window.location.href = '/login';
}
function handleAdminSessionExpiry() {
  if (sessionExpiryHandled || window.location.pathname === '/login') return;
  sessionExpiryHandled = true;
  sessionStorage.removeItem('ws_admin_session');
  window.location.href = '/login';
}

http.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) handleTenantSessionExpiry();
  return errorInterceptor(err);
});
adminHttp.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) handleAdminSessionExpiry();
  return errorInterceptor(err);
});

// ── Auth (tenant login) ───────────────────────────────────────────────────────
// [FIX-AUTH-API] GET /business/:tenantId — authenticated with tenant API key
// Returns { business: biz, tenantStatus }. [AUDIT-FIX-17] tenantStatus now carries
// the real Tenant fields (status, onboardingStep, whatsapp.connected) — AuthContext
// uses it directly when present, falling back to the old inference logic only for
// tenants on a pre-fix backend deployment. See AuthContext for details.
export const authApi = {
  getTenantInfo: async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
    return res.data;
  },
};

// ── Staff / multi-admin auth [FEATURE-STAFF-1] ────────────────────────────────
// POST /dashboard/auth/login          — unauthenticated, email+password → session
// POST /dashboard/auth/accept-invite  — unauthenticated, inviteToken+password → session
// GET  /dashboard/auth/me             — whoami for whichever credential is active
// POST /dashboard/:tenantId/admins/claim-owner — bootstrap first OWNER for a tenant
//      created before this feature shipped; authenticated with the EXISTING
//      tenant x-api-key (not a session token — there isn't one yet).
// Login/accept-invite are plain axios calls (no tenant context exists yet, so
// the `http` instance's interceptor — which needs getTenantId() — doesn't apply).
export const staffAuthApi = {
  login: (email, password) => axios.post(`${BASE_URL}/dashboard/auth/login`, { email, password }, { timeout: 12000 })
    .catch(err => { throw new Error(err.response?.data?.error || err.message); }),
  acceptInvite: (inviteToken, password) => axios.post(`${BASE_URL}/dashboard/auth/accept-invite`, { inviteToken, password }, { timeout: 12000 })
    .catch(err => { throw new Error(err.response?.data?.error || err.message); }),
  me: () => http.get('/dashboard/auth/me'),
  // Must be called while the legacy tenant x-api-key is the active credential
  // (not a staff Bearer token) — possession of that key is the proof of
  // ownership this one-time bootstrap relies on.
  claimOwner: (tenantId, body) => http.post(`/dashboard/${tenantId}/admins/claim-owner`, body),
};

// ── Staff management — /dashboard/:tenantId/admins ────────────────────────────
// GET    → { admins }  (no role gate at the route level, but intended for OWNER/MANAGER)
// POST   /invite → 201 { admin, inviteToken, inviteExpiresAt }  — OWNER only.
//        inviteToken is returned ONCE and never stored — this frontend is
//        responsible for handing it to the invitee (there's no email integration).
// PATCH  /:id → { admin }  body: { role?, status? }  — OWNER only
// DELETE /:id → { ok: true }  — OWNER only
export const staffApi = {
  list:   (tenantId) => http.get(`/dashboard/${tenantId}/admins`),
  invite: (tenantId, body) => http.post(`/dashboard/${tenantId}/admins/invite`, body),
  update: (tenantId, id, body) => http.patch(`/dashboard/${tenantId}/admins/${id}`, body),
  remove: (tenantId, id) => http.delete(`/dashboard/${tenantId}/admins/${id}`),
};

// ── Dashboard overview & lists ────────────────────────────────────────────────
// GET /dashboard/:tenantId/overview → { business, last30Days: { orders, bookings, customers, revenue }, activeHumanSessions }
export const dashApi = {
  overview:  () => http.get(`/dashboard/${getTenantId()}/overview`),
  orders:    (p = {}) => http.get(`/dashboard/${getTenantId()}/orders`, { params: p }),
  bookings:  (p = {}) => http.get(`/dashboard/${getTenantId()}/bookings`, { params: p }),
  analytics: (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics`, { params: { days } }),
  // GET /dashboard/:tenantId/analytics/timeseries → day-by-day breakdown + top items
  analyticsTimeseries: (days = 30) => http.get(`/dashboard/${getTenantId()}/analytics/timeseries`, { params: { days } }),
  customers: (p = {}) => http.get(`/dashboard/${getTenantId()}/customers`, { params: p }),
  // ⚠ /customer/ prefix required — avoids Express matching "customer" as :orderId param
  ordersByCustomer: (phone) => http.get(`/dashboard/${getTenantId()}/orders/customer/${encodeURIComponent(phone)}`),
};

// ── Business config ───────────────────────────────────────────────────────────
// GET  /business/:tenantId   → { business: biz, tenantStatus }  (tenantStatus added in AUDIT-FIX-17)
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
  // GET /business/cloudinary-status → { cloudinaryEnabled: bool } — check before
  // showing image-upload UI so a 503 "not configured" doesn't surprise the user.
  cloudinaryStatus: () => http.get(`/business/cloudinary-status`),
  // [FIX-WA-SELFSERVICE] GET /api/whatsapp/request/status — the tenant's own
  // WhatsAppConnectionRequest status (pending/contacted/connecting/connected/rejected).
  // This is a SEPARATE, loosely-linked system from Tenant.onboardingStep — it only
  // exists for tenants who went through the self-service "request a connection" flow.
  // Tenants onboarded directly by an admin (credentials entered at tenant creation,
  // which is the normal path per current operating practice) will typically get a
  // 404 here — that's expected, not an error, and callers should treat it as "no
  // request on file" rather than surfacing it to the user.
  connectionRequestStatus: () => http.get('/api/whatsapp/request/status'),
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
  // [FIX-UPLOAD-1] Do NOT set Content-Type manually for FormData — axios/the
  // browser must generate it (it includes a random multipart boundary the
  // server's multer parser needs). Setting it by hand strips that boundary
  // and the upload silently fails to parse server-side.
  uploadImage:(itemId, formData) => http.post(`/dashboard/${getTenantId()}/menu/${itemId}/image`, formData),
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

// ── WhatsApp Commerce Catalog — /business/:tenantId/wacatalog/* ──────────────
// GET  /wacatalog/health → { connected, status, products, lastSyncedAt, pendingSync,
//                             lastSyncError, missingImages, outOfStock, mode }
//      status ladder: not_connected | never_synced | sync_pending | sync_failed
//                      | needs_sync | healthy
// POST /wacatalog/sync   → { ok:true, synced, deleted } or 400/502 { ok:false, reason, status }
// ⚠ Enabling the catalog (via bizApi.updateSettings) requires a catalogId AND a
//   real (non-SIM_) connected WhatsApp number — the backend returns a clear
//   400 message in either case, surface it directly to the tenant.
export const catalogApi = {
  health: () => http.get(`/business/${getTenantId()}/wacatalog/health`),
  sync:   () => http.post(`/business/${getTenantId()}/wacatalog/sync`),
};

// ── Admin ↔ Tenant messaging — /admin/notifications ───────────────────────────
// Two-way inbox between a tenant's admin and the platform super admin.
// direction: TO_TENANT (platform → tenant) | TO_ADMIN (tenant → platform)
// severity: info | warning | urgent
// ⚠ Uses TENANT API KEY via http — /admin/notifications accepts tenant keys
//   too (requireApiKey, not requireSuperAdminKey). Tenant calls are ALWAYS
//   auto-scoped server-side to their own tenantId regardless of query params.
export const notificationsApi = {
  // No ?direction filter → returns BOTH directions for this tenant (received
  // from the platform AND their own sent messages) so a single call can drive
  // an Inbox/Sent tab split client-side.
  list:     (p = {}) => http.get('/admin/notifications', { params: p }),
  // Tenant → super admin. Always addressed to the platform; body: { subject, body, severity? }
  send:     (body) => http.post('/admin/notifications', body),
  markRead: (id) => http.patch(`/admin/notifications/${id}/read`),
};

// Super admin side — uses adminHttp (SUPER_ADMIN_API_KEY)
export const adminNotificationsApi = {
  // ?tenantId, ?direction, ?unreadOnly=true, ?broadcastId all supported
  list: (p = {}) => adminHttp.get('/admin/notifications', { params: p }),
  // Direct: { subject, body, severity?, tenantId }.  Broadcast: { subject, body, severity?, broadcast: true }
  send: (body) => adminHttp.post('/admin/notifications', body),
  markRead: (id) => adminHttp.patch(`/admin/notifications/${id}/read`),
};

// ── Order status — PATCH /admin/orders/:id/status ─────────────────────────────
// ⚠ Uses TENANT API KEY via http (not adminHttp) — /admin routes accept tenant keys too
// ⚠ status values: pending | payment_pending_verification | confirmed | completed | cancelled | payment_failed | rejected
// ⚠ Auto-sends WhatsApp notification to customer on confirmed / completed / cancelled / rejected
// ── Promotions / discount codes — /dashboard/:tenantId/promotions ────────────
// type: PERCENT (0-100) | FIXED (currency amount). Codes are case-insensitive
// (stored uppercase) and unique per tenant — POST 409s on a duplicate code.
// usedCount is server-managed (incremented by orderService when a promo is
// applied to an order) — never sent from the client.
export const promotionsApi = {
  list:   () => http.get(`/dashboard/${getTenantId()}/promotions`),
  add:    (body) => http.post(`/dashboard/${getTenantId()}/promotions`, body),
  update: (promoId, body) => http.patch(`/dashboard/${getTenantId()}/promotions/${promoId}`, body),
  remove: (promoId) => http.delete(`/dashboard/${getTenantId()}/promotions/${promoId}`),
};

export const orderApi = {
  updateStatus: (orderId, body) => http.patch(`/admin/orders/${orderId}/status`, body),
  // GET /dashboard/:tenantId/orders/export → raw CSV (text/csv, Content-Disposition attachment)
  // ⚠ responseType 'blob' is required — the default 'json' parse would choke on CSV text.
  export: (params = {}) => http.get(`/dashboard/${getTenantId()}/orders/export`, { params, responseType: 'blob' }),
  // POST /dashboard/:tenantId/orders/:orderId/notify-ready — re-sends the
  // "ready for collection" WhatsApp message without going through the full
  // status-change form. Only valid while status isn't already a terminal one.
  notifyReady: (orderId) => http.post(`/dashboard/${getTenantId()}/orders/${orderId}/notify-ready`),
};

// ── Booking status — PATCH /admin/bookings/:id/status ─────────────────────────
// ⚠ Uses TENANT API KEY via http
// ⚠ status values: pending | confirmed | completed | cancelled
// ⚠ Field is adminNote (not notes) for booking updates
export const bookingApi = {
  updateStatus: (bookingId, body) => http.patch(`/admin/bookings/${bookingId}/status`, body),
  export: (params = {}) => http.get(`/dashboard/${getTenantId()}/bookings/export`, { params, responseType: 'blob' }),
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

  // GET /admin/tenants/stats → { tenants:{total,byStatus}, whatsapp:{...}, connectionRequests:{...} }
  // Single-aggregation platform stats — cheaper than recomputing from the full tenant list.
  getPlatformStats: () => adminHttp.get('/admin/tenants/stats'),

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

  // ⚠ businessMode lives on BusinessConfig, NOT Tenant — PATCH /admin/tenants/:id
  // silently ignores it. Must go through PUT /business/:tenantId instead.
  // See Appendix B bug #1 — this is a separate call from updateTenant().
  updateBusinessMode: (id, businessMode) => adminHttp.put(`/business/${id}`, { businessMode }),

  // GET /business/modes → list of supported business modes (no :tenantId needed)
  // Used so the Business Mode dropdown never goes stale vs. a hardcoded array.
  getBusinessModes: () => adminHttp.get('/business/modes'),
};

// ── Super admin session storage ────────────────────────────────────────────────
// [AUDIT-FIX-NAMING-COLLISION] Named superAdminSession (not adminSession) — the
// platform super-admin session stored here (sessionStorage, an API key) is a
// completely different concept from AuthContext's `adminSession` (a logged-in
// tenant-side AdminUser from the Staff/Team feature). Same name, different
// files, never actually imported together today — but a real footgun if a
// future page ever needed both, since one would silently shadow the other.
export const superAdminSession = {
  save:  (apiKey) => sessionStorage.setItem('ws_admin_session', JSON.stringify({ apiKey })),
  clear: () => sessionStorage.removeItem('ws_admin_session'),
  get:   () => {
    try { return JSON.parse(sessionStorage.getItem('ws_admin_session') || 'null'); }
    catch { return null; }
  },
};

// ── Business mode definitions ─────────────────────────────────────────────────
// Fallback list only — used if GET /business/modes (see useBusinessModes below)
// is unreachable. Kept in sync with the 11-value businessMode enum documented
// in the API contract (POST /admin/tenants). Previously included stale
// SUPERMARKET/PHARMACY entries that aren't part of the documented backend enum.
// ── Money formatting ──────────────────────────────────────────────────────────
// [AUDIT-FIX-CURRENCY] Centralised so every page reads the tenant's configured
// currency (business.payment.currency, exposed on the auth user as `currency`)
// instead of hardcoding the Gambian Dalasi symbol 'D'. Falls back to 'D' when
// no currency is available (e.g. admin pages with no logged-in tenant).
export function formatMoney(amount, currency = 'D', decimals = 0) {
  const n = Number(amount) || 0;
  return `${currency} ${n.toFixed(decimals)}`;
}

// Triggers a browser download for a Blob response (e.g. from orderApi.export /
// bookingApi.export). Needed because the CSV is fetched via axios with an
// auth header — a plain <a href="..."> link can't attach x-api-key, so the
// file has to be fetched first and turned into an object URL client-side.
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const BUSINESS_MODES = [
  { value: 'RESTAURANT',  label: 'Restaurant',    emoji: '🍽', tier: 'full',  desc: 'Full ordering & payment flow' },
  { value: 'BAKERY',      label: 'Bakery',        emoji: '🥐', tier: 'full',  desc: 'Orders with cake customization' },
  { value: 'SALON',       label: 'Salon',         emoji: '💇', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'BARBERSHOP',  label: 'Barbershop',    emoji: '✂️', tier: 'full',  desc: 'Bookings & appointment flow' },
  { value: 'COSMETICS',   label: 'Cosmetics',     emoji: '💄', tier: 'full',  desc: 'AI-powered skincare advice' },
  { value: 'ELECTRONICS', label: 'Electronics',   emoji: '📱', tier: 'full',  desc: 'Spec requests & orders' },
  { value: 'FASHION',     label: 'Fashion',       emoji: '👗', tier: 'full',  desc: 'Style-based product matching' },
  { value: 'RETAIL',      label: 'Retail / Shop', emoji: '🛍', tier: 'basic', desc: 'Standard product ordering' },
  { value: 'DELIVERY',    label: 'Delivery',      emoji: '🚚', tier: 'basic', desc: 'Delivery ordering flow' },
  { value: 'SERVICES',    label: 'Services',      emoji: '🔧', tier: 'basic', desc: 'General service business' },
  { value: 'GENERAL',     label: 'General',       emoji: '🏪', tier: 'basic', desc: 'General purpose AI assistant' },
];

// [FIX-MODES-DYNAMIC] Fetch the live list of supported business modes from
// GET /business/modes so a future backend-added mode shows up here without a
// frontend redeploy. Falls back to the hardcoded BUSINESS_MODES list above if
// the endpoint is unreachable or returns something unexpected — never blocks
// the Create/Edit Tenant forms on a network hiccup.
let _modesCache = null;
export function useBusinessModes() {
  const [modes, setModes] = useState(_modesCache || BUSINESS_MODES);
  useEffect(() => {
    if (_modesCache) return;
    adminApi.getBusinessModes()
      .then(r => {
        const list = r.data?.modes || r.data?.businessModes || r.data;
        if (Array.isArray(list) && list.length) {
          // Backend may return plain strings (e.g. "RESTAURANT") or full objects.
          const normalised = list.map(m => {
            if (typeof m === 'string') return getModeConfig(m) || { value: m, label: m, emoji: '🏪', tier: 'basic' };
            return m;
          });
          _modesCache = normalised;
          setModes(normalised);
        }
      })
      .catch(() => { /* silent fallback — hardcoded list already rendering */ });
  }, []);
  return modes;
}

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
