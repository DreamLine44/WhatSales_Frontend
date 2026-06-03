import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Calendar, UtensilsCrossed,
  Scissors, MessageSquare, BarChart3, Users, HelpCircle,
  Building2, Clock, Bot, Wifi, Settings, Menu, X, LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { Logo } from '../components/ui.jsx';
import { getModeConfig, needsBookings, needsMenu, needsServices } from '../api.js';
import toast from 'react-hot-toast';

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
        marginBottom: 1,
      })}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span>{label}</span>
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 14px', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function WhatsAppStatusPill({ whatsapp }) {
  const active = !!(whatsapp?.connected || whatsapp?.phoneNumberId);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: active ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.08)',
      border: `1px solid ${active ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 99, padding: '5px 11px',
      fontSize: '0.72rem', fontWeight: 600,
      color: active ? '#4ade80' : 'rgba(255,255,255,0.5)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#4ade80' : 'rgba(255,255,255,0.3)', animation: active ? 'pulse 2s infinite' : 'none' }} />
      {active ? 'Bot Active' : 'Not Connected'}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mode = user?.businessMode || 'RESTAURANT';
  const modeConfig = getModeConfig(mode);
  const hasBookings = needsBookings(mode);
  const hasMenu = needsMenu(mode);
  const hasServices = needsServices(mode);

  const handleLogout = async () => {
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, []);

  const Sidebar = () => (
    <aside style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'var(--green-800)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Logo size={32} light />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>WhatSales</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{user?.name || 'My Business'}</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', display: 'none' }} className="close-sidebar">
            <X size={16} />
          </button>
        </div>

        {/* Mode badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: 8 }}>
          <span style={{ fontSize: '0.75rem' }}>{modeConfig.emoji}</span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{modeConfig.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px' }}>
        <NavSection label="Main">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
          {!hasBookings && <NavItem to="/orders" icon={ShoppingCart} label="Orders" />}
          {hasBookings && <NavItem to="/bookings" icon={Calendar} label="Bookings" />}
          <NavItem to="/sessions" icon={MessageSquare} label="Live Sessions" />
          <NavItem to="/analytics" icon={BarChart3} label="Analytics" />
          <NavItem to="/customers" icon={Users} label="Customers" />
          <NavItem to="/auto-replies" icon={HelpCircle} label="Auto Replies" />
        </NavSection>

        <NavSection label="Setup">
          <NavItem to="/setup/business" icon={Building2} label="Business Info" />
          {hasMenu && <NavItem to="/setup/menu" icon={UtensilsCrossed} label={hasServices ? 'Menu' : 'Products'} />}
          {hasServices && <NavItem to="/setup/services" icon={Scissors} label="Services" />}
          <NavItem to="/setup/hours" icon={Clock} label="Opening Hours" />
          <NavItem to="/setup/bot" icon={Bot} label="Bot Messages" />
          <NavItem to="/setup/whatsapp" icon={Wifi} label="WhatsApp" />
        </NavSection>
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <WhatsAppStatusPill whatsapp={user?.whatsapp} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px 2px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.8rem', flexShrink: 0 }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Owner'}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)' }}>{user?.plan || 'FREE'}</div>
          </div>
          <button onClick={handleLogout} title="Sign out" style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 'var(--sidebar-w)', zIndex: 201 }}>
            <Sidebar />
          </div>
        </>
      )}

      {/* Desktop sidebar always visible */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar (mobile) */}
        <header style={{
          height: 'var(--topbar-h)', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-secondary)', display: 'flex', cursor: 'pointer' }} className="menu-btn">
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="topbar-center">
            <Logo size={26} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>WhatSales</span>
          </div>
          <WhatsAppStatusPill whatsapp={user?.whatsapp} />
        </header>

        <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .menu-btn { display: none !important; }
          .topbar-center { display: none !important; }
          .sidebar-desktop { display: flex !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
