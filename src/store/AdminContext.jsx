import { createContext, useContext, useState, useCallback } from 'react';
import { adminSession } from '../api.js';
import axios from 'axios';

const AdminContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => !!adminSession.get());
  // [FIX-ADMIN-LOADING] loading must be set true/false around the async login call
  // so the login button shows a spinner and is disabled during the request.
  const [loading, setLoading] = useState(false);

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
      throw new Error(msg);
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
    <AdminContext.Provider value={{ isAdmin, loading, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
}
