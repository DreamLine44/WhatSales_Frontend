import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, LogOut, ShieldCheck,
  Menu, X, ChevronRight, Bell,
} from 'lucide-react';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo } from './ui.jsx';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/tenants',  icon: Users,           label: 'Tenants',   end: false },
  { to: '/admin/messages', icon: Bell,            label: 'Messages',  end: false },
];

function NavItem({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 13px 10px 11px', borderRadius: 10,
        fontSize: '0.875rem', fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
        background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
        textDecoration: 'none', transition: 'all 0.14s',
        marginBottom: 2, letterSpacing: '-0.01em',
        /* [REDESIGN v4] Same gold rail signature as the Business Admin sidebar,
           so the two portals read as one product family, not two apps. */
        borderLeft: isActive ? '2.5px solid var(--gold)' : '2.5px solid transparent',
        borderTop: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        borderRight: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        borderBottom: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
        boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.18)' : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{label}</span>
          {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5, flexShrink: 0 }} />}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ onClose, onLogout }) {
  return (
    <div style={{
      width: 240,
      background: 'linear-gradient(180deg, #062218 0%, var(--green-950) 60%, #010e08 100%)',
      display: 'flex', flexDirection: 'column', height: '100%',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      userSelect: 'none',
    }}>
      {/* Brand header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
          <Logo size={30} light />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              color: '#fff', fontSize: '0.93rem', letterSpacing: '-0.025em',
            }}>WhatSales</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex',
              padding: 6, borderRadius: 7, background: 'rgba(255,255,255,0.07)',
              border: 'none', transition: 'color 0.15s', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {/* Super admin badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          background: 'rgba(74,222,128,0.09)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: 99,
        }}>
          <ShieldCheck size={11} color="#4ade80" />
          <span style={{
            fontSize: '0.62rem', fontWeight: 800,
            color: '#4ade80', letterSpacing: '0.1em',
          }}>SUPER ADMIN</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.11em',
          color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
          padding: '0 13px', marginBottom: 8,
        }}>
          Navigation
        </div>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 13px', borderRadius: 10,
          color: 'rgba(255,255,255,0.38)', cursor: 'pointer',
          background: 'none', border: '1px solid transparent',
          width: '100%', fontSize: '0.875rem', fontWeight: 500,
          transition: 'all 0.15s', letterSpacing: '-0.01em',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'rgba(255,100,100,0.9)';
            e.currentTarget.style.background = 'rgba(220,38,38,0.1)';
            e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.38)';
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { adminLogout } = useAdmin();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = () => { adminLogout(); navigate('/login'); toast.success('Admin signed out'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* Desktop sidebar */}
      <div className="ws-admin-sidebar" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <Sidebar onLogout={handleLogout} />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <>
          <div style={{
            position: 'fixed', inset: 0, zIndex: 299,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 300,
            boxShadow: '6px 0 32px rgba(0,0,0,0.45)',
            animation: 'slideIn 0.22s ease',
          }}>
            <Sidebar onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile topbar */}
        <header className="ws-admin-topbar" style={{
          height: 54,
          background: 'var(--bg-surface)',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '0 14px',
          position: 'sticky', top: 0, zIndex: 100,
          flexShrink: 0,
          boxShadow: 'var(--sh-sm)',
        }}>
          <button onClick={() => setDrawerOpen(true)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36,
            color: 'var(--text-secondary)', cursor: 'pointer',
            borderRadius: 9, background: 'var(--bg-overlay)',
            border: '1.5px solid var(--border)', flexShrink: 0,
          }}>
            <Menu size={17} />
          </button>
          <Logo size={24} />
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '0.9rem', color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            WhatSales Admin
          </span>
          <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(10,122,60,0.08)', border: '1px solid var(--border-accent)', borderRadius: 99 }}>
            <ShieldCheck size={10} color="var(--primary)" />
            <span style={{ fontSize: '0.59rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em' }}>ADMIN</span>
          </div>
        </header>

        {/* Page content */}
        <main className="ws-admin-content page-content fade-in">
          <Outlet />
        </main>
      </div>

      <style>{`
        .ws-admin-sidebar  { display: flex; }
        .ws-admin-topbar   { display: none !important; }

        @media (max-width: 767px) {
          .ws-admin-sidebar { display: none !important; }
          .ws-admin-topbar  { display: flex !important; }
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
