import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, CalendarCheck, UtensilsCrossed,
  Scissors, MessageSquare, BarChart3, Wifi, Clock,
  Bot, Building2, Menu, X, LogOut, Users, HelpCircle, Zap
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { WhatsalesLogo } from '../../App';
import toast from 'react-hot-toast';
import styles from './DashboardLayout.module.css';

const NAV_MAIN = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/orders',     icon: ShoppingCart,    label: 'Orders'       },
  { to: '/bookings',   icon: CalendarCheck,   label: 'Bookings'     },
  { to: '/menu',       icon: UtensilsCrossed, label: 'Menu'         },
  { to: '/services',   icon: Scissors,        label: 'Services'     },
  { to: '/sessions',   icon: MessageSquare,   label: 'Live Sessions' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics'    },
  { to: '/customers',  icon: Users,           label: 'Customers'    },
  { to: '/faqs',       icon: HelpCircle,      label: 'FAQs'         },
];

const NAV_SETUP = [
  { to: '/setup/business', icon: Building2, label: 'Business Info' },
  { to: '/setup/bot',      icon: Bot,       label: 'Bot Messages'  },
  { to: '/setup/hours',    icon: Clock,     label: 'Opening Hours' },
  { to: '/setup/whatsapp', icon: Wifi,      label: 'WhatsApp'      },
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
  const mode = tenant?.businessMode || '';

  // Filter nav items based on business mode so tenants don't see dead sections
  const filteredNav = NAV_MAIN.filter(({ to }) => {
    if (to === '/menu'     && mode === 'SALON')       return false;
    if (to === '/services' && mode === 'RESTAURANT')  return false;
    if (to === '/orders'   && mode === 'SALON')       return false;
    if (to === '/bookings' && mode === 'RESTAURANT')  return false;
    return true;
  });

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

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Main</span>
            {filteredNav.map(({ to, icon: Icon, label }) => (
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
            <StatusBadge tenantStatus={tenant?.status} />
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ tenantStatus }) {
  const active = tenantStatus === 'ACTIVE';
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
        animation: active ? 'glow 2s ease-in-out infinite' : 'none',
      }} />
      {active ? 'Bot Active' : 'Not Connected'}
    </div>
  );
}
