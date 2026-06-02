import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, CalendarCheck,
  MessageSquare, BarChart3, Wifi, Clock,
  Bot, Building2, Menu, X, LogOut, Users, HelpCircle, Zap, Link2,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { WhatsalesLogo } from '../../App';
import { getBizConfig, getNavVisibility } from '../../utils/businessConfig';
import toast from 'react-hot-toast';
import styles from './DashboardLayout.module.css';

// FIX: Deduplicated — WhatsApp (settings page) uses Wifi, WhatsApp Connection (onboarding) uses Link2
const NAV_SETUP = [
  { to: '/setup/wizard',            icon: Zap,       label: 'Get Started 🚀'      },
  { to: '/setup/business',          icon: Building2, label: 'Business Info'        },
  { to: '/setup/bot',               icon: Bot,       label: 'Bot Messages'         },
  { to: '/setup/hours',             icon: Clock,     label: 'Opening Hours'        },
  { to: '/setup/whatsapp',          icon: Wifi,      label: 'WhatsApp'             },
  { to: '/setup/whatsapp-connect',  icon: Link2,     label: 'WhatsApp Connection'  },
];

export default function DashboardLayout() {
  const { user, tenant, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
    toast.success('Logged out successfully');
  };

  const bizName = tenant?.name || user?.name || 'My Business';
  const mode    = tenant?.businessMode || 'GENERIC';
  const cfg     = getBizConfig(mode);
  const vis     = getNavVisibility(mode);

  // Build dynamic main nav from business mode config
  const NAV_MAIN = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',                             show: true              },
    { to: '/orders',    icon: ShoppingCart,    label: cfg.transactions?.ordersNavLabel   || 'Orders',   show: vis.showOrders   },
    { to: '/bookings',  icon: CalendarCheck,   label: cfg.transactions?.bookingsNavLabel || 'Bookings', show: vis.showBookings },
    { to: '/menu',      icon: cfg.catalog?.icon || Building2, label: cfg.catalog?.navLabel || 'Menu',   show: vis.showMenu     },
    { to: '/services',  icon: cfg.catalog?.icon || Building2, label: cfg.catalog?.navLabel || 'Services', show: vis.showServices },
    { to: '/sessions',  icon: MessageSquare,   label: 'Live Sessions',                         show: true              },
    { to: '/analytics', icon: BarChart3,       label: 'Analytics',                             show: true              },
    { to: '/customers', icon: Users,           label: 'Customers',                             show: true              },
    { to: '/faqs',      icon: HelpCircle,      label: 'Auto-Replies',                          show: true              },
  ].filter(n => n.show);

  return (
    <div className={styles.root}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}>
            <WhatsalesLogo size={32} light />
            <div>
              <div className={styles.logoName}>WhatSales</div>
              <div className={styles.logoBiz}>{bizName}</div>
            </div>
          </div>
          <button className={styles.closeMobile} onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Business mode badge */}
        <div style={{
          margin: '0 12px 8px',
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>{cfg.emoji}</span>
          <span style={{ flex: 1 }}>{cfg.label}</span>
          {cfg.tier === 'basic' && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
              BASIC
            </span>
          )}
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Main</span>
            {NAV_MAIN.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>Setup</span>
            {NAV_SETUP.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={styles.userFooter}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{(user?.name || 'U')[0].toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{user?.name || 'Owner'}</div>
              <div className={styles.userEmail}>{user?.adminPhone || 'Admin'}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuToggle} onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className={styles.topbarRight}>
            <StatusBadge whatsapp={tenant?.whatsapp} />
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ whatsapp }) {
  // "Bot Active" = WhatsApp is connected and the bot can reply to customers.
  // Backend returns whatsapp.connected on the business object.
  const active = !!(whatsapp?.connected || whatsapp?.phoneNumberId);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: active ? 'rgba(25,163,72,0.07)' : 'var(--bg-overlay)',
      border: `1.5px solid ${active ? 'rgba(25,163,72,0.2)' : 'var(--border-strong)'}`,
      borderRadius: 99, padding: '5px 13px',
      fontSize: '0.75rem', fontWeight: 600,
      color: active ? 'var(--green)' : 'var(--text-muted)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? 'var(--green)' : 'var(--text-muted)',
        // FIX: animation class defined in CSS module so it renders correctly
        animation: active ? `${styles.glow ?? 'glow'} 2s ease-in-out infinite` : 'none',
      }} />
      {active ? 'Bot Active' : 'Not Connected'}
    </div>
  );
}
