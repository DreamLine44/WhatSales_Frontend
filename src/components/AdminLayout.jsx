import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function AdminNavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 'var(--r-md)',
      fontSize: '0.845rem', fontWeight: isActive ? 700 : 500,
      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
      background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
      textDecoration: 'none', transition: 'all 0.14s', marginBottom: 1,
    })}>
      <Icon size={15} /><span style={{ letterSpacing: '-0.01em' }}>{label}</span>
    </NavLink>
  );
}

function SidebarContent({ onClose, onLogout }) {
  return (
    <div style={{
      width: 220, background: 'linear-gradient(180deg, var(--green-950) 0%, #021810 100%)',
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Logo size={30} light />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '0.9rem', letterSpacing: '-0.02em' }}>WhatSales</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'rgba(74,222,128,0.12)',
          border: '1px solid rgba(74,222,128,0.25)', borderRadius: 99,
        }}>
          <ShieldCheck size={11} color="#4ade80" />
          <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.1em' }}>SUPER ADMIN</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        <AdminNavItem to="/admin"         icon={LayoutDashboard} label="Dashboard" end />
        <AdminNavItem to="/admin/tenants" icon={Users}           label="Tenants" />
      </nav>
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            borderRadius: 'var(--r-md)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            background: 'none', border: 'none', width: '100%', fontSize: '0.845rem', fontWeight: 500,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { adminLogout(); navigate('/login'); toast.success('Admin signed out'); };

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <SidebarContent onLogout={handleLogout} />
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 201, boxShadow: '4px 0 24px rgba(0,0,0,0.4)', animation: 'slideIn 0.22s ease' }}>
            <SidebarContent onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        <header className="admin-mobile-topbar" style={{
          height: 'var(--topbar-h)', background: 'var(--bg-surface)',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 8, borderRadius: 8, background: 'var(--bg-overlay)' }}>
            <Menu size={20} />
          </button>
          <Logo size={26} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>WhatSales Admin</span>
        </header>

        <main className="page-content fade-in">
          <Outlet />
        </main>
      </div>

      <style>{`
        .admin-sidebar-desktop { display: flex; }
        .admin-mobile-topbar   { display: none; }
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-topbar   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
