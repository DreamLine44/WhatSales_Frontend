import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './store/AdminContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './store/AuthContext';
import { getNavVisibility } from './utils/businessConfig';
import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage        from './pages/LoginPage';
import NotFoundPage     from './pages/NotFoundPage';
import DashboardPage    from './pages/DashboardPage';
import OrdersPage       from './pages/OrdersPage';
import BookingsPage     from './pages/BookingsPage';
import MenuPage         from './pages/MenuPage';
import ServicesPage     from './pages/ServicesPage';
import SessionsPage     from './pages/SessionsPage';
import BusinessSetupPage from './pages/BusinessSetupPage';
import BotConfigPage    from './pages/BotConfigPage';
import HoursPage        from './pages/HoursPage';
import WhatsAppPage     from './pages/WhatsAppPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import CustomersPage    from './pages/CustomersPage';
import FAQPage          from './pages/FAQPage';
import SetupWizardPage  from './pages/SetupWizardPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Redirects /menu → /services for service-based modes, and vice versa. Wraps the real page. */
function CatalogRoute({ page, children }) {
  const { tenant } = useAuth();
  const vis = getNavVisibility(tenant?.businessMode || 'GENERIC');
  if (page === 'menu'     && !vis.showMenu)    return <Navigate to="/services" replace />;
  if (page === 'services' && !vis.showServices) return <Navigate to="/menu"     replace />;
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { isAdmin, loading } = useAdmin();
  if (loading) return <SplashScreen />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <WhatsalesLogo size={44} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>WhatSales</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          <div style={{ width: 14, height: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
            </svg>
          </div>
          Loading your dashboard…
        </div>
      </div>
    </div>
  );
}

export function WhatsalesLogo({ size = 32, light = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11"
        fill={light ? 'rgba(159,224,180,0.12)' : 'var(--primary)'}
        stroke={light ? 'rgba(159,224,180,0.24)' : 'none'}
        strokeWidth="1.5"
      />
      <path
        d="M20 8C13.373 8 8 13.373 8 20c0 2.144.566 4.155 1.556 5.894L8 32l6.293-1.513A11.94 11.94 0 0020 32c6.627 0 12-5.373 12-12S26.627 8 20 8z"
        fill={light ? 'var(--mint)' : '#ffffff'}
        fillOpacity={light ? 0.9 : 0.96}
      />
      <path d="M15 18h10M15 22h7"
        stroke={light ? 'var(--deep-green)' : 'var(--primary)'}
        strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--border-strong)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-md)',
                borderRadius: 'var(--radius-md)',
              },
              success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
              error:   { iconTheme: { primary: 'var(--red)',   secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index           element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<DashboardPage />} />
              <Route path="orders"     element={<OrdersPage />} />
              <Route path="bookings"   element={<BookingsPage />} />
              <Route path="menu"       element={<CatalogRoute page="menu"><MenuPage /></CatalogRoute>} />
              <Route path="services"   element={<CatalogRoute page="services"><ServicesPage /></CatalogRoute>} />
              <Route path="sessions"   element={<SessionsPage />} />
              <Route path="analytics"  element={<AnalyticsPage />} />
              <Route path="customers"  element={<CustomersPage />} />
              <Route path="faqs"       element={<FAQPage />} />
              <Route path="setup/business"  element={<BusinessSetupPage />} />
              <Route path="setup/bot"       element={<BotConfigPage />} />
              <Route path="setup/hours"     element={<HoursPage />} />
              <Route path="setup/whatsapp"  element={<WhatsAppPage />} />
              <Route path="setup/wizard"    element={<SetupWizardPage />} />
            </Route>
            <Route path="admin" element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AdminProvider>
  );
}
