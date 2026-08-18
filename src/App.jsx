import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './store/AuthContext.jsx';
import { AdminProvider, useAdmin } from './store/AdminContext.jsx';
import { Spinner } from './components/ui.jsx';

// Layouts
import DashboardLayout from './components/DashboardLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const AcceptInvitePage = lazy(() => import('./pages/AcceptInvitePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'));
const SessionsPage = lazy(() => import('./pages/SessionsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const CustomersPage = lazy(() => import('./pages/CustomersPage.jsx'));
const AutoRepliesPage = lazy(() => import('./pages/AutoRepliesPage.jsx'));
const BusinessInfoPage = lazy(() => import('./pages/BusinessInfoPage.jsx'));
const MenuPage = lazy(() => import('./pages/MenuPage.jsx'));
const CatalogPage = lazy(() => import('./pages/CatalogPage.jsx'));
const PreferencesPage = lazy(() => import('./pages/PreferencesPage.jsx'));
const PaymentPage = lazy(() => import('./pages/PaymentPage.jsx'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage.jsx'));
const ServicesPage = lazy(() => import('./pages/ServicesPage.jsx'));
const OpeningHoursPage = lazy(() => import('./pages/OpeningHoursPage.jsx'));
const BotMessagesPage = lazy(() => import('./pages/BotMessagesPage.jsx'));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const StaffPage = lazy(() => import('./pages/StaffPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const AdminTenantsPage = lazy(() => import('./pages/admin/AdminTenantsPage.jsx'));
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage.jsx'));

// ── Route guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={36} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdmin, validating } = useAdmin();
  // [FIX-ADMIN-GUARD] Wait for mount-time session re-validation before redirecting.
  // Without this check, a valid admin refreshing the page sees a flash-redirect to /login.
  if (validating) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={36} /></div>;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfLoggedIn({ children }) {
  const { user, loading } = useAuth();
  const { isAdmin, validating } = useAdmin();
  if (loading || validating) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={36} /></div>;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--sh-md)',
              },
              success: { iconTheme: { primary: 'var(--primary)', secondary: '#fff' } },
              error:   { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
            }}
          />

          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner size={36} /></div>}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Tenant dashboard */}
            <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route path="/dashboard"      element={<DashboardPage />} />
              <Route path="/orders"         element={<OrdersPage />} />
              <Route path="/bookings"       element={<BookingsPage />} />
              <Route path="/promotions"     element={<PromotionsPage />} />
              <Route path="/sessions"       element={<SessionsPage />} />
              <Route path="/analytics"      element={<AnalyticsPage />} />
              <Route path="/customers"      element={<CustomersPage />} />
              <Route path="/auto-replies"   element={<AutoRepliesPage />} />
              <Route path="/messages"       element={<NotificationsPage />} />
              <Route path="/setup/business" element={<BusinessInfoPage />} />
              <Route path="/setup/payment"  element={<PaymentPage />} />
              <Route path="/setup/menu"     element={<MenuPage />} />
              <Route path="/setup/catalog"  element={<CatalogPage />} />
              <Route path="/setup/preferences" element={<PreferencesPage />} />
              <Route path="/setup/services" element={<ServicesPage />} />
              <Route path="/setup/hours"    element={<OpeningHoursPage />} />
              <Route path="/setup/bot"      element={<BotMessagesPage />} />
              <Route path="/setup/whatsapp" element={<WhatsAppPage />} />
              <Route path="/team"           element={<StaffPage />} />
            </Route>

            {/* Super admin */}
            <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route path="/admin"         element={<AdminDashboardPage />} />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
              <Route path="/admin/messages" element={<AdminMessagesPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
