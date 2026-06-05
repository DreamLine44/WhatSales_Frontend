import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api.js';

const AuthContext = createContext(null);

// [FIX-AUTH-1] /business/:tenantId returns { business, tenant }.
// Previously code tried data.tenant?.whatsapp which was always undefined because
// the old /dashboard/:id/overview endpoint doesn't return tenant.whatsapp at all.
// Now both login and restore use /business/:id which always returns the full tenant doc.

function buildUserFromResponse(tenantId, data) {
  const biz    = data.business || {};
  const tenant = data.tenant   || {};
  return {
    tenantId,
    name:         biz.name         || 'My Business',
    businessMode: biz.businessMode || 'RESTAURANT',
    adminPhone:   biz.adminPhone   || '',
    // [FIX-AUTH-2] whatsapp comes from the tenant doc, not the business config.
    whatsapp:     tenant.whatsapp  || {},
    plan:         tenant.plan      || 'FREE',
    status:       tenant.status    || 'ACTIVE',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // [FIX-AUTH-3] Define restore with useCallback BEFORE useEffect to avoid
  // the stale-closure / undefined-reference bug from calling it in useEffect deps.
  const restore = useCallback(async (tenantId, apiKey) => {
    try {
      const data = await authApi.getTenantInfo(tenantId, apiKey);
      setUser(buildUserFromResponse(tenantId, data));
    } catch {
      // Session expired or invalid — clear and force re-login
      localStorage.removeItem('ws_tenant_id');
      localStorage.removeItem('ws_api_key');
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const tenantId = localStorage.getItem('ws_tenant_id');
    const apiKey   = localStorage.getItem('ws_api_key');
    if (tenantId && apiKey) {
      restore(tenantId, apiKey);
    } else {
      setLoading(false);
    }
  }, [restore]);

  const login = useCallback(async (tenantId, apiKey) => {
    setError(null);
    const data = await authApi.getTenantInfo(tenantId.trim(), apiKey.trim());

    // Store credentials
    localStorage.setItem('ws_tenant_id', tenantId.trim());
    localStorage.setItem('ws_api_key', apiKey.trim());

    setUser(buildUserFromResponse(tenantId.trim(), data));
  }, []);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
