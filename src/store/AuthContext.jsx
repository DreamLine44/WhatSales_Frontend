import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi, getApiKey, getTenantId, clearCredentials } from '../services/api';

// Removed unused `getUser` import.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [tenant,  setTenant]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getApiKey();
    const tid = getTenantId();
    if (!key || !tid) { setLoading(false); return; }
    authApi.verify()
      .then(({ business, user }) => {
        setUser(user);
        // business response includes whatsapp.connected so tenant context reflects real connection state
        setTenant({ tenantId: tid, status: 'ACTIVE', ...business });
      })
      .catch(() => {
        // On verify failure, explicitly clear React state too.
        // clearCredentials() wipes localStorage but React state (user/tenant)
        // still had the stale values, so ProtectedRoute rendered children for
        // one tick before the redirect kicked in. Now both are cleared together.
        clearCredentials();
        setUser(null);
        setTenant(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (apiKey, tenantId) => {
    const result = await authApi.login(apiKey, tenantId);
    setUser(result.user);
    // business response now includes whatsapp.connected + whatsapp.phoneNumberId from backend fix
    setTenant({ tenantId, status: 'ACTIVE', ...result.business });
    return result;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
    setTenant(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, logout, setTenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
