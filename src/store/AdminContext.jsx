import { createContext, useContext, useState, useCallback } from 'react';
import { adminSession, adminApi } from '../api.js';
import axios from 'axios';

const AdminContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => !!adminSession.get());
  const [loading, setLoading] = useState(false);

  const adminLogin = useCallback(async (apiKey) => {
    // Validate by calling listTenants — only super-admin key works
    await axios.get(`${BASE_URL}/admin/tenants`, {
      headers: { 'x-api-key': apiKey },
      timeout: 10000,
    });
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
