import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Calendar, UtensilsCrossed,
  Scissors, MessageSquare, BarChart3, Users, HelpCircle,
  Building2, Clock, Bot, Wifi, LogOut, ChevronRight,
  Menu, X, Zap,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { Logo } from './ui.jsx';
import { getModeConfig, needsBookings, needsMenu, needsServices, sessionsApi } from '../api.js';
import toast from 'react-hot-toast';

function NavItem({ to, icon: Icon, label, end = false, badge, onClick }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 11px 8px 9px', borderRadius: 9,
        fontSize: '0.845rem', fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.62)',
        background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
        textDecoration: 'none', transition: 'all 0.14s',
        marginBottom: 1, position: 'relative',
        /* [REDESIGN v4] Gold rail replaces the plain white border on the active
           item — a small, consistent brand signature instead of a generic
           highlight, echoed by the gold WA "Ready" pill and hero accents. */
        borderLeft: isActive ? '2.5px solid var(--gold)' : '2.5px solid transparent',
        borderTop: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        borderRight: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        borderBottom: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
          <span style={{ flex: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          {badge ? (
            <span style={{
              fontSize: '0.6rem', fontWeight: 800, minWidth: 17, height: 17,
              background: 'var(--amber)', color: '#fff',
              borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', flexShrink: 0,
            }}>{badge}</span>
          ) : isActive ? (
            <ChevronRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function NavSection({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: '0.67rem', fontWeight: 800, color: 'rgba(255,255,255,0.32)',
        textTransform: 'uppercase', letterSpacing: '0.13em',
        padding: '0 11px', marginBottom: 4,
      }}>{label}</div>
      {children}
    </div>
  );
}

function WaPill({ whatsapp, status }) {
  // [AUDIT] "Live" requires BOTH whatsapp.connected AND status === 'ACTIVE' —
  // verifying credentials with Meta and activating the tenant are two separate,
  // real admin actions (see AdminTenantsPage's activation guard). A tenant can
  // be genuinely connected/verified and still PENDING, in which case the bot
  // will not respond to messages yet — showing "Live" here would be wrong.
  // "Ready" now means connected (verified) but not yet activated, which is the
  // common in-between state; a connected tenant that's already ACTIVE is Live.
  const connected = !!whatsapp?.connected;
  const live = connected && status === 'ACTIVE';
  const ready = connected && !live;
  const color = live ? '#4ade80' : ready ? 'var(--gold)' : 'rgba(255,255,255,0.38)';
  const bg = live ? 'rgba(74,222,128,0.12)' : ready ? 'rgba(224,172,79,0.14)' : 'rgba(255,255,255,0.06)';
  const border = live ? 'rgba(74,222,128,0.28)' : ready ? 'rgba(224,172,79,0.3)' : 'rgba(255,255,255,0.09)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 99, padding: '4px 9px',
      fontSize: '0.68rem', fontWeight: 600,
      color,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: live ? '#4ade80' : ready ? 'var(--gold)' : 'rgba(255,255,255,0.22)',
        animation: live ? 'pulse 2s infinite' : 'none',
        flexShrink: 0,
      }} />
      {live ? 'Live' : ready ? 'Ready' : 'Offline'}
    </div>
  );
}

function PlanBadge({ plan }) {
  const isPro = plan && plan !== 'FREE';
  return (
    <span style={{
      fontSize: '0.57rem', fontWeight: 800, letterSpacing: '0.08em',
      padding: '2px 6px', borderRadius: 99,
      background: isPro ? 'rgba(224,172,79,0.22)' : 'rgba(255,255,255,0.09)',
      color: isPro ? '#e0ac4f' : 'rgba(255,255,255,0.35)',
      border: `1px solid ${isPro ? 'rgba(224,172,79,0.3)' : 'rgba(255,255,255,0.09)'}`,
    }}>
      {plan || 'FREE'}
    </span>
  );
}

function SidebarContent({ user, modeConfig, hasBookings, hasMenu, hasServices, onClose, onLogout, humanSessionCount }) {
  return (
    <div style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'linear-gradient(180deg, #053d1e 0%, var(--green-900) 55%, #021810 100%)',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      userSelect: 'none',
    }}>
      {/* ── Brand header ─────────────────────────────────────── */}
      <div style={{ padding: '16px 13px 13px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <Logo size={30} light />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '0.92rem', letterSpacing: '-0.025em' }}>WhatSales</div>
            <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'My Business'}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex',
              padding: 6, borderRadius: 7, background: 'rgba(255,255,255,0.07)',
              border: 'none', transition: 'color 0.15s',
              flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {/* Business mode chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 9px', background: 'rgba(255,255,255,0.07)',
          borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)',
        }}>
          <span style={{ fontSize: '0.78rem' }}>{modeConfig.emoji}</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{modeConfig.label}</span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <NavSection label="Overview">
          <NavItem to="/dashboard"   icon={LayoutDashboard} label="Dashboard"     end onClick={onClose} />
          {!hasBookings && <NavItem to="/orders"      icon={ShoppingCart}  label="Orders"        onClick={onClose} />}
          {hasBookings  && <NavItem to="/bookings"    icon={Calendar}      label="Bookings"      onClick={onClose} />}
          <NavItem to="/sessions"    icon={MessageSquare}  label="Live Sessions" badge={humanSessionCount || undefined} onClick={onClose} />
          <NavItem to="/analytics"   icon={BarChart3}      label="Analytics"     onClick={onClose} />
          <NavItem to="/customers"   icon={Users}          label="Customers"     onClick={onClose} />
          <NavItem to="/auto-replies" icon={HelpCircle}    label="Auto Replies"  onClick={onClose} />
        </NavSection>

        <NavSection label="Setup">
          <NavItem to="/setup/business" icon={Building2}     label="Business Info"  onClick={onClose} />
          {hasMenu     && <NavItem to="/setup/menu"     icon={UtensilsCrossed} label="Menu / Products" onClick={onClose} />}
          {hasServices && <NavItem to="/setup/services" icon={Scissors}        label="Services"        onClick={onClose} />}
          <NavItem to="/setup/hours"    icon={Clock}    label="Opening Hours" onClick={onClose} />
          <NavItem to="/setup/bot"      icon={Bot}      label="Bot Messages"  onClick={onClose} />
          <NavItem to="/setup/whatsapp" icon={Wifi}     label="WhatsApp Status" onClick={onClose} />
        </NavSection>
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ marginBottom: 8, paddingLeft: 3 }}>
          <WaPill whatsapp={user?.whatsapp} status={user?.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: '0.82rem', flexShrink: 0,
          }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
              {user?.name || 'Owner'}
            </div>
            <PlanBadge plan={user?.plan} />
          </div>
          <button onClick={onLogout} title="Sign out" style={{
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: 6,
            transition: 'all 0.15s', borderRadius: 7, border: 'none', background: 'none',
            flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,100,100,0.9)'; e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mobile bottom navigation bar ─────────────────────────────────────────────
function BottomNav({ hasBookings, humanSessionCount }) {
  const location = useLocation();

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home', end: true },
    hasBookings
      ? { to: '/bookings', icon: Calendar, label: 'Bookings' }
      : { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/sessions', icon: MessageSquare, label: 'Sessions', badge: humanSessionCount || undefined },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/customers', icon: Users, label: 'Customers' },
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--bottomnav-h)',
      background: 'var(--bg-surface)',
      borderTop: '1.5px solid var(--border)',
      display: 'flex', alignItems: 'stretch',
      zIndex: 150,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {items.map(({ to, icon: Icon, label, end, badge }) => {
        const isActive = end
          ? location.pathname === to
          : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to} to={to} end={end}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              textDecoration: 'none', position: 'relative',
              color: isActive ? 'var(--primary)' : 'var(--text-ghost)',
              transition: 'color 0.15s',
              fontSize: '0.6rem', fontWeight: isActive ? 700 : 500,
              paddingTop: 6,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              {badge && (
                <span style={{
                  position: 'absolute', top: -3, right: -5,
                  minWidth: 14, height: 14, borderRadius: 99,
                  background: 'var(--amber)', color: '#fff',
                  fontSize: '0.55rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                }}>{badge}</span>
              )}
            </div>
            <span>{label}</span>
            {isActive && (
              <span style={{
                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 3, borderRadius: 99,
                background: 'var(--primary)',
              }} />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [humanSessionCount, setHumanSessionCount] = useState(0);
  const mode = user?.businessMode || 'RESTAURANT';
  const modeConfig = getModeConfig(mode);
  const hasBookings = needsBookings(mode);
  const hasMenu = needsMenu(mode);
  const hasServices = needsServices(mode);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const h = e => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [drawerOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    const poll = () => {
      // [FIX-DYNAMIC-IMPORT] api.js is already statically imported — use directly
      sessionsApi.list({ limit: 100 })
        .then(r => {
          const sessions = r.data.sessions || [];
          const humanCount = sessions.filter(s => s.humanMode).length;
          setHumanSessionCount(humanCount);
        })
        .catch(() => {});
    };
    poll();
    // 90s — sidebar badge is a low-priority ambient indicator; halved from 45s to reduce
    // concurrent load on /admin/sessions alongside SessionsPage's own 60s poller.
    const t = setInterval(poll, 90000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); toast.success('Signed out'); };
  const sidebarProps = { user, modeConfig, hasBookings, hasMenu, hasServices, onLogout: handleLogout, humanSessionCount };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── Desktop sidebar ───────────────────────────────────── */}
      <div className="ws-sidebar" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <SidebarContent {...sidebarProps} />
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 299, background: 'rgba(2,18,10,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setDrawerOpen(false)}
          />
          <div style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: 'min(var(--sidebar-w), 86vw)',
            zIndex: 300, boxShadow: '6px 0 40px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.22s ease',
          }}>
            <SidebarContent {...sidebarProps} onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main area ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile topbar */}
        <header className="ws-topbar" style={{
          height: 'var(--topbar-h)', background: 'var(--bg-surface)',
          borderBottom: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 10,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: 'var(--sh-sm)',
          flexShrink: 0,
        }}>
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 9,
              color: 'var(--text-secondary)', cursor: 'pointer',
              background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
              flexShrink: 0, position: 'relative',
            }}
          >
            <Menu size={18} />
            {humanSessionCount > 0 && (
              <span style={{
                position: 'absolute', top: 1, right: 1,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--amber)', border: '2px solid var(--bg-surface)',
              }} />
            )}
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Logo size={24} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>WhatSales</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Status pill */}
          <WaPill whatsapp={user?.whatsapp} status={user?.status} />

          {/* More menu button — opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            title="All pages"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: 9,
              color: 'var(--text-secondary)', cursor: 'pointer',
              background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <Zap size={15} />
          </button>
        </header>

        {/* Page content */}
        <main className="page-content ws-main fade-in">
          <Outlet />
        </main>

        {/* Bottom nav spacer on mobile */}
        <div className="ws-bottomnav-spacer" />
      </div>

      {/* Bottom navigation on mobile */}
      <div className="ws-bottomnav">
        <BottomNav hasBookings={hasBookings} humanSessionCount={humanSessionCount} />
      </div>

      <style>{`
        .ws-sidebar       { display: flex; }
        .ws-topbar        { display: none !important; }
        .ws-bottomnav     { display: none; }
        .ws-bottomnav-spacer { display: none; }

        @media (max-width: 767px) {
          .ws-sidebar          { display: none !important; }
          .ws-topbar           { display: flex !important; }
          .ws-bottomnav        { display: block; }
          .ws-bottomnav-spacer { display: block; height: calc(var(--bottomnav-h) + env(safe-area-inset-bottom, 0px)); }
          .ws-main             { padding-bottom: 16px; }
        }

        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0.3; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
