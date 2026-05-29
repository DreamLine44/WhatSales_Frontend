import { createContext, useContext, useState, useCallback } from 'react';

// AdminContext manages admin session state (login/logout).
// API calls are made directly from page components using the imported adminApi.
// Removed unused `adminApi` import — it was dead code here.

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  // sessionStorage.getItem is synchronous, so loading starts as false.
  // We expose it anyway so ProtectedAdminRoute can guard against any future
  // async session check without needing to touch App.jsx.
  const [loading] = useState(false);

  const [adminSession, setAdminSession] = useState(() => {
    const stored = sessionStorage.getItem('ws_admin_session');
    return stored ? JSON.parse(stored) : null;
  });

  const adminLogin = useCallback((apiKey) => {
    const session = { apiKey, loginTime: Date.now() };
    sessionStorage.setItem('ws_admin_session', JSON.stringify(session));
    setAdminSession(session);
  }, []);

  const adminLogout = useCallback(() => {
    sessionStorage.removeItem('ws_admin_session');
    setAdminSession(null);
  }, []);

  const isAdmin = !!adminSession;

  return (
    <AdminContext.Provider value={{ isAdmin, loading, adminSession, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
