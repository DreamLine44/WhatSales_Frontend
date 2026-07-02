import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

// ── Build a rich user object from the two API responses ───────────────────────
//
// [FIX-AUTH-BUSINESS] GET /business/:tenantId only returns { business: biz }.
// The Tenant document (with whatsapp.connected, plan, onboardingStep, status) is
// NOT returned by any tenant-accessible endpoint — it only lives at
// GET /admin/tenants/:id which requires a super-admin key.
//
// Work-around: synthesise a tenant-like object from fields that ARE visible:
//   • business.phoneNumberId → whatsapp.phoneNumberId (synced by backend on credential save)
//   • status defaults to 'ACTIVE' (tenant can log in, so key is active)
//   • plan and onboardingStep are inferred / set to safe defaults
//
// [FIX-AUTH-CONNECTED] whatsapp.connected cannot be determined from the tenant API key alone.
// We signal "configured but unknown" via phoneNumberId presence. DashboardPage's
// whatsappActive = tenantActive && whatsappConfigured covers this correctly.
//
// [AUDIT-FIX-17] Backend now returns a `tenantStatus` block alongside `business`
// (GET /business/:tenantId — see businessController.getBusinessConfig /
// safeTenantStatus). It's sourced from the real Tenant document via req.tenant,
// so status/onboardingStep/whatsapp.connected are now authoritative instead of
// guessed. This replaces the old inference heuristics below, which could never
// organically reach "connected: true" for an admin-onboarded tenant since that
// field simply wasn't visible to any tenant-facing endpoint before this fix.
//
// prevUser is kept as a fallback only, for the (unlikely) case this is pointed at
// an older backend deployment that hasn't picked up AUDIT-FIX-17 yet — in that
// case tenantStatus will be null/undefined and we fall back to the old guesswork
// so the app doesn't hard-break.
function buildUserFromResponse(tenantId, businessData, tenantStatus, prevUser = null) {
  const biz = businessData || {};

  if (tenantStatus) {
    return {
      tenantId,
      name:           biz.name         || 'My Business',
      businessMode:   biz.businessMode || 'RESTAURANT',
      adminPhone:     biz.adminPhone   || '',
      whatsapp: {
        phoneNumberId: tenantStatus.whatsapp?.phoneNumberId || biz.phoneNumberId || undefined,
        phone:         tenantStatus.whatsapp?.phone || undefined,
        connected:     tenantStatus.whatsapp?.connected === true,
      },
      plan:           tenantStatus.plan   || 'FREE',
      // [AUDIT] Default to PENDING, not ACTIVE, when status is missing — PENDING
      // is the tenant's real starting status ("Bot will not respond" — see
      // AdminTenantsPage STATUS_META), so this fails toward "not live" rather
      // than optimistically claiming a status we don't actually know.
      status:         tenantStatus.status || 'PENDING',
      onboardingStep: tenantStatus.onboardingStep ?? 0,
    };
  }

  // ── Legacy fallback (pre-AUDIT-FIX-17 backend) ──────────────────────────────
  const inferredStep = biz.phoneNumberId ? 2 : 1;
  const prevStep      = prevUser?.onboardingStep ?? 0;
  const onboardingStep = Math.max(inferredStep, prevStep);

  return {
    tenantId,
    name:           biz.name         || 'My Business',
    businessMode:   biz.businessMode || 'RESTAURANT',
    adminPhone:     biz.adminPhone   || '',
    whatsapp: biz.phoneNumberId
      ? {
          phoneNumberId: biz.phoneNumberId,
          connected: (prevUser?.whatsapp?.connected === true) || (onboardingStep >= 3),
        }
      : {},
    // [AUDIT] Previously hardcoded 'ACTIVE' on the reasoning that "the tenant
    // can authenticate, so the key is active" — but tenant.status and API key
    // validity are different things; a tenant can authenticate while status is
    // still PENDING (the real starting default — see AdminTenantsPage). Default
    // to PENDING here too, for the same fail-toward-not-live reason as above.
    plan:           'FREE',
    status:         'PENDING',
    onboardingStep,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch business config with the stored (or supplied) credentials
  // [AUDIT-FIX-17] Backend now also returns `tenantStatus` — return both instead
  // of discarding everything except `business`.
  const fetchBusiness = useCallback(async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 12000,
    });
    return {
      biz:           res.data?.business || {},
      tenantStatus:  res.data?.tenantStatus || null,
    };
  }, []);

  // [FIX-AUTH-RESTORE] Define restore with useCallback BEFORE useEffect.
  // [FIX-7] Pass the current user snapshot as prevUser so buildUserFromResponse
  // can carry forward onboardingStep and connected without regressing them
  // (only relevant on the legacy-fallback path — see buildUserFromResponse).
  const restore = useCallback(async (tenantId, apiKey) => {
    try {
      const { biz, tenantStatus } = await fetchBusiness(tenantId, apiKey);
      setUser(prev => buildUserFromResponse(tenantId, biz, tenantStatus, prev));
    } catch {
      // Session expired or invalid — clear and force re-login
      localStorage.removeItem('ws_tenant_id');
      localStorage.removeItem('ws_api_key');
    } finally {
      setLoading(false);
    }
  }, [fetchBusiness]);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const tenantId = localStorage.getItem('ws_tenant_id');
    const apiKey   = localStorage.getItem('ws_api_key');
    if (tenantId && apiKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      restore(tenantId, apiKey);
    } else {
      setLoading(false);
    }
  }, [restore]);

  const login = useCallback(async (tenantId, apiKey) => {
    setError(null);
    const { biz, tenantStatus } = await fetchBusiness(tenantId.trim(), apiKey.trim());
    localStorage.setItem('ws_tenant_id', tenantId.trim());
    localStorage.setItem('ws_api_key', apiKey.trim());
    setUser(buildUserFromResponse(tenantId.trim(), biz, tenantStatus));
  }, [fetchBusiness]);

  const logout = useCallback(() => {
    localStorage.removeItem('ws_tenant_id');
    localStorage.removeItem('ws_api_key');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const tenantId = localStorage.getItem('ws_tenant_id');
    const apiKey   = localStorage.getItem('ws_api_key');
    if (tenantId && apiKey) await restore(tenantId, apiKey);
  }, [restore]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
