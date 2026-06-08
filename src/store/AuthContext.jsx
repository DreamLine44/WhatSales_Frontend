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
// [FIX-1] prevUser is passed on refresh so we never regress a previously-inferred
// onboardingStep (e.g. step 3 after verification would drop back to 2 on next restore
// because the /business endpoint doesn't carry onboardingStep at all).
// The rule: only advance the step, never retreat it.
function buildUserFromResponse(tenantId, businessData, prevUser = null) {
  const biz = businessData || {};

  // Infer minimum onboardingStep from fields visible in BusinessConfig.
  // phoneNumberId present → at least step 2 (credentials saved by admin).
  // We never lower an already-known step — if prevUser has step 3 (verified),
  // keep it even though /business still only shows phoneNumberId.
  const inferredStep = biz.phoneNumberId ? 2 : 1;
  const prevStep     = prevUser?.onboardingStep ?? 0;
  const onboardingStep = Math.max(inferredStep, prevStep);

  return {
    tenantId,
    name:           biz.name         || 'My Business',
    businessMode:   biz.businessMode || 'RESTAURANT',
    adminPhone:     biz.adminPhone   || '',
    // Synthesise whatsapp info from BusinessConfig.phoneNumberId
    // (backend keeps this in sync with Tenant.whatsapp.phoneNumberId via updateTenant).
    // [FIX-1] connected: treat ACTIVE + verified (step≥3) as effectively connected so
    // WhatsAppPage can reach the "Bot Activated" state without a super-admin endpoint.
    whatsapp: biz.phoneNumberId
      ? {
          phoneNumberId: biz.phoneNumberId,
          // Carry forward any connected=true that was set during this session, OR
          // infer it when onboardingStep is already ≥ 3 (verified by admin).
          connected: (prevUser?.whatsapp?.connected === true) || (onboardingStep >= 3),
        }
      : {},
    plan:           'FREE',           // not exposed to tenant key — safe default
    status:         'ACTIVE',         // tenant can authenticate ∴ key is active
    onboardingStep,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch business config with the stored (or supplied) credentials
  const fetchBusiness = useCallback(async (tenantId, apiKey) => {
    const res = await axios.get(`${BASE_URL}/business/${tenantId}`, {
      headers: { 'x-api-key': apiKey },
      timeout: 12000,
    });
    // Backend returns { business: biz }
    return res.data?.business || res.data || {};
  }, []);

  // [FIX-AUTH-RESTORE] Define restore with useCallback BEFORE useEffect.
  // [FIX-7] Pass the current user snapshot as prevUser so buildUserFromResponse
  // can carry forward onboardingStep and connected without regressing them.
  const restore = useCallback(async (tenantId, apiKey) => {
    try {
      const biz = await fetchBusiness(tenantId, apiKey);
      setUser(prev => buildUserFromResponse(tenantId, biz, prev));
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
    const biz = await fetchBusiness(tenantId.trim(), apiKey.trim());
    localStorage.setItem('ws_tenant_id', tenantId.trim());
    localStorage.setItem('ws_api_key', apiKey.trim());
    setUser(buildUserFromResponse(tenantId.trim(), biz));
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
