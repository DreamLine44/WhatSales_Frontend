import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './store/AuthContext.jsx';
import { AdminProvider, useAdmin } from './store/AdminContext.jsx';
import { Spinner } from './components/ui.jsx';

// Layouts
import DashboardLayout from './components/DashboardLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Public
import LoginPage from './pages/LoginPage.jsx';

// Tenant pages
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import AutoRepliesPage from './pages/AutoRepliesPage.jsx';
import PromotionsPage from './pages/PromotionsPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import BusinessInfoPage from './pages/BusinessInfoPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import OpeningHoursPage from './pages/OpeningHoursPage.jsx';
import BotMessagesPage from './pages/BotMessagesPage.jsx';
import WhatsAppPage from './pages/WhatsAppPage.jsx';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminTenantsPage from './pages/admin/AdminTenantsPage.jsx';

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

          <Routes>
            {/* Public */}
            <Route path="/login" element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Tenant dashboard */}
            <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route path="/dashboard"      element={<DashboardPage />} />
              <Route path="/orders"         element={<OrdersPage />} />
              <Route path="/bookings"       element={<BookingsPage />} />
              <Route path="/sessions"       element={<SessionsPage />} />
              <Route path="/analytics"      element={<AnalyticsPage />} />
              <Route path="/customers"      element={<CustomersPage />} />
              <Route path="/auto-replies"   element={<AutoRepliesPage />} />
              <Route path="/promotions"     element={<PromotionsPage />} />
              <Route path="/setup/business" element={<BusinessInfoPage />} />
              <Route path="/setup/menu"     element={<MenuPage />} />
              <Route path="/setup/services" element={<ServicesPage />} />
              <Route path="/setup/catalog"  element={<CatalogPage />} />
              <Route path="/setup/hours"    element={<OpeningHoursPage />} />
              <Route path="/setup/bot"      element={<BotMessagesPage />} />
              <Route path="/setup/whatsapp" element={<WhatsAppPage />} />
            </Route>

            {/* Super admin */}
            <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route path="/admin"         element={<AdminDashboardPage />} />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
