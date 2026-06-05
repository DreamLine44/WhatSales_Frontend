import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Calendar, UtensilsCrossed,
  Scissors, MessageSquare, BarChart3, Users, HelpCircle,
  Building2, Clock, Bot, Wifi, LogOut, ChevronRight,
  Menu, X, Zap,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { Logo } from '../components/ui.jsx';
import { getModeConfig, needsBookings, needsMenu, needsServices } from '../api.js';
import toast from 'react-hot-toast';

function NavItem({ to, icon: Icon, label, end = false, badge }) {
  return (
    <NavLink
      to={to} end={end}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 'var(--r-md)',
        fontSize: '0.845rem', fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.62)',
        background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
        textDecoration: 'none', transition: 'all 0.14s',
        marginBottom: 1, position: 'relative',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
          <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{label}</span>
          {badge ? (
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, minWidth: 18, height: 18,
              background: 'var(--amber)', color: '#fff',
              borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}>{badge}</span>
          ) : isActive ? (
            <ChevronRight size={12} style={{ opacity: 0.5 }} />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        padding: '0 12px', marginBottom: 5,
      }}>{label}</div>
      {children}
    </div>
  );
}

function WaPill({ whatsapp, status }) {
  const active = !!(whatsapp?.connected || (status === 'ACTIVE' && whatsapp?.phoneNumberId));
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: active ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.07)',
      border: `1px solid ${active ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 99, padding: '5px 10px',
      fontSize: '0.7rem', fontWeight: 600,
      color: active ? '#4ade80' : 'rgba(255,255,255,0.45)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? '#4ade80' : 'rgba(255,255,255,0.25)',
        animation: active ? 'pulse 2s infinite' : 'none',
        flexShrink: 0,
      }} />
      {active ? (whatsapp?.connected ? 'Bot Live' : 'Bot Ready') : 'Not Connected'}
    </div>
  );
}

function PlanBadge({ plan }) {
  const isPro = plan && plan !== 'FREE';
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
      padding: '2px 6px', borderRadius: 99,
      background: isPro ? 'rgba(217,119,6,0.25)' : 'rgba(255,255,255,0.1)',
      color: isPro ? '#fbbf24' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${isPro ? 'rgba(217,119,6,0.3)' : 'rgba(255,255,255,0.1)'}`,
    }}>
      {plan || 'FREE'}
    </span>
  );
}

function SidebarContent({ user, modeConfig, hasBookings, hasMenu, hasServices, onClose, onLogout, humanSessionCount }) {
  return (
    <div style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'linear-gradient(180deg, var(--green-800) 0%, var(--green-900) 100%)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Logo size={32} light />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '0.95rem', letterSpacing: '-0.02em' }}>WhatSales</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              {user?.name || 'My Business'}
            </div>
          </div>
          {/* Mobile close */}
          {onClose && (
            <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>
        {/* Mode badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 10px', background: 'rgba(255,255,255,0.08)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: '0.8rem' }}>{modeConfig.emoji}</span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{modeConfig.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <NavSection label="Overview">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />
          {!hasBookings && <NavItem to="/orders" icon={ShoppingCart} label="Orders" />}
          {hasBookings && <NavItem to="/bookings" icon={Calendar} label="Bookings" />}
          <NavItem to="/sessions" icon={MessageSquare} label="Live Sessions" badge={humanSessionCount || undefined} />
          <NavItem to="/analytics" icon={BarChart3} label="Analytics" />
          <NavItem to="/customers" icon={Users} label="Customers" />
          <NavItem to="/auto-replies" icon={HelpCircle} label="Auto Replies" />
        </NavSection>

        <NavSection label="Configuration">
          <NavItem to="/setup/business" icon={Building2} label="Business Info" />
          {hasMenu     && <NavItem to="/setup/menu"     icon={UtensilsCrossed} label="Menu / Products" />}
          {hasServices && <NavItem to="/setup/services" icon={Scissors}        label="Services" />}
          <NavItem to="/setup/hours"    icon={Clock}    label="Opening Hours" />
          <NavItem to="/setup/bot"      icon={Bot}      label="Bot Messages" />
          <NavItem to="/setup/whatsapp" icon={Wifi}     label="WhatsApp" />
        </NavSection>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ marginBottom: 10 }}>
          <WaPill whatsapp={user?.whatsapp} status={user?.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: '0.85rem', flexShrink: 0,
          }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {user?.name || 'Owner'}
            </div>
            <PlanBadge plan={user?.plan} />
          </div>
          <button onClick={onLogout} title="Sign out" style={{
            color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', padding: 4,
            transition: 'color 0.15s', borderRadius: 6,
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [humanSessionCount, setHumanSessionCount] = useState(0);
  const mode = user?.businessMode || 'RESTAURANT';
  const modeConfig = getModeConfig(mode);
  const hasBookings = needsBookings(mode);
  const hasMenu = needsMenu(mode);
  const hasServices = needsServices(mode);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close sidebar on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const h = e => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // [FIX-LAYOUT-POLL] Poll for human sessions in background so sidebar badge stays current
  useEffect(() => {
    const poll = () => {
      // Lazy import to avoid circular dep
      import('../api.js').then(({ dashApi }) => {
        dashApi.conversations(100)
          .then(r => {
            const humanCount = (r.data.conversations || []).filter(s => s.humanMode).length;
            setHumanSessionCount(humanCount);
          })
          .catch(() => {});
      });
    };
    poll();
    const t = setInterval(poll, 45000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); toast.success('Signed out'); };

  const sidebarProps = { user, modeConfig, hasBookings, hasMenu, hasServices, onLogout: handleLogout, humanSessionCount };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Desktop sidebar */}
      <div className="sidebar-desktop" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <SidebarContent {...sidebarProps} />
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(2,26,12,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: 'min(var(--sidebar-w), 88vw)',
            zIndex: 201, boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
            animation: 'slideIn 0.22s ease',
          }}>
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        <header className="mobile-topbar" style={{
          height: 'var(--topbar-h)', background: 'var(--bg-surface)',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
          boxShadow: 'var(--sh-sm)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              color: 'var(--text-secondary)', display: 'flex', cursor: 'pointer',
              padding: 8, borderRadius: 8, background: 'var(--bg-overlay)',
              position: 'relative',
            }}
          >
            <Menu size={20} />
            {humanSessionCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--amber)', border: '1.5px solid var(--bg-surface)',
              }} />
            )}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size={26} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>WhatSales</span>
          </div>
          <WaPill whatsapp={user?.whatsapp} status={user?.status} />
        </header>

        {/* Page content */}
        <main className="page-content fade-in">
          <Outlet />
        </main>
      </div>

      <style>{`
        .sidebar-desktop { display: flex; }
        .mobile-topbar   { display: none; }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
