import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function AdminNavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink to={to} end={end} style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px', borderRadius: 'var(--radius-md)',
      fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
      color: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
      textDecoration: 'none', transition: 'all 0.15s', marginBottom: 1,
    })}>
      <Icon size={16} /><span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const handleLogout = () => { adminLogout(); navigate('/login'); toast.success('Admin signed out'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: 'var(--green-900)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 14px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Logo size={30} light />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>WhatSales</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(220,252,231,0.12)', border: '1px solid rgba(220,252,231,0.2)', borderRadius: 99 }}>
            <ShieldCheck size={11} color="#4ade80" />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em' }}>SUPER ADMIN</span>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '14px 10px' }}>
          <AdminNavItem to="/admin" icon={LayoutDashboard} label="Dashboard" end />
          <AdminNavItem to="/admin/tenants" icon={Users} label="Tenants" />
        </nav>
        <div style={{ padding: '12px 10px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 'var(--radius-md)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', background: 'none', border: 'none', width: '100%', fontSize: '0.875rem', fontWeight: 500 }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '28px 28px', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  );
}
