import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adminSession } from '../api.js';
import axios from 'axios';

const AdminContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  // [FIX-ADMIN-VALIDATING] True while the mount-time session re-validation is in-flight.
  // RequireAdmin checks this before redirecting to /login so valid sessions don't
  // flash-redirect during the async key check on page refresh.
  const [validating, setValidating] = useState(() => !!adminSession.get());

  // [FIX-ADMIN-RESTORE] On mount, re-validate any stored session against the live API.
  // Without this, a rotated super-admin key stays "valid" in the frontend until the
  // first actual API call fails, causing confusing 403 errors mid-session.
  useEffect(() => {
    const session = adminSession.get();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!session?.apiKey) { setValidating(false); return; }
    axios.get(`${BASE_URL}/admin/tenants`, {
      headers: { 'x-api-key': session.apiKey },
      timeout: 10000,
    }).then(() => {
      setIsAdmin(true);
    }).catch(() => {
      // Key is no longer valid — clear stale session
      adminSession.clear();
      setIsAdmin(false);
    }).finally(() => {
      setValidating(false);
    });
  }, []);

  const adminLogin = useCallback(async (apiKey) => {
    // Validate by calling listTenants — only super-admin key works.
    setLoading(true);
    try {
      await axios.get(`${BASE_URL}/admin/tenants`, {
        headers: { 'x-api-key': apiKey },
        timeout: 10000,
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid admin credentials';
      throw new Error(msg, { cause: err });
    } finally {
      setLoading(false);
    }
    adminSession.save(apiKey);
    setIsAdmin(true);
  }, []);

  const adminLogout = useCallback(() => {
    adminSession.clear();
    setIsAdmin(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, validating, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
