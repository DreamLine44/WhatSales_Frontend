import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // { tenantId, name, businessMode, whatsapp, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const tenantId = localStorage.getItem('ws_tenant_id');
    const apiKey   = localStorage.getItem('ws_api_key');
    if (tenantId && apiKey) {
      restore(tenantId, apiKey);
    } else {
      setLoading(false);
    }
  }, []);

  const restore = async (tenantId, apiKey) => {
    try {
      const data = await authApi.getTenantInfo(tenantId, apiKey);
      const biz = data.business || {};
      setUser({
        tenantId,
        name: biz.name || 'My Business',
        businessMode: biz.businessMode || 'RESTAURANT',
        adminPhone: biz.adminPhone || '',
        whatsapp: data.tenant?.whatsapp || {},
        plan: data.tenant?.plan || 'FREE',
        status: data.tenant?.status || 'ACTIVE',
      });
    } catch {
      // Session expired or invalid — clear and force re-login
      localStorage.removeItem('ws_tenant_id');
      localStorage.removeItem('ws_api_key');
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (tenantId, apiKey) => {
    setError(null);
    // Validate credentials and get business info
    const data = await authApi.getTenantInfo(tenantId.trim(), apiKey.trim());
    const biz = data.business || {};

    // Store credentials
    localStorage.setItem('ws_tenant_id', tenantId.trim());
    localStorage.setItem('ws_api_key', apiKey.trim());

    setUser({
      tenantId: tenantId.trim(),
      name: biz.name || 'My Business',
      businessMode: biz.businessMode || 'RESTAURANT',
      adminPhone: biz.adminPhone || '',
      whatsapp: data.tenant?.whatsapp || {},
      plan: data.tenant?.plan || 'FREE',
      status: data.tenant?.status || 'ACTIVE',
    });
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
  }, []);

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
