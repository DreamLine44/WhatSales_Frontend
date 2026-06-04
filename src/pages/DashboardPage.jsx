import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Calendar, Users, MessageSquare, TrendingUp, Zap, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { dashApi, getModeConfig, needsBookings } from '../api.js';
import { StatCard, Card, Btn, StatusBadge, EmptyState, Spinner, SectionHeading } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function QuickAction({ icon: Icon, label, desc, to, color = 'green' }) {
  const navigate = useNavigate();
  const palette = {
    green:  { bg: 'var(--primary-dim)', border: 'var(--border-accent)', icon: 'var(--primary)',  text: 'var(--primary)' },
    amber:  { bg: 'var(--amber-dim)',   border: 'rgba(217,119,6,0.2)', icon: 'var(--amber)',   text: 'var(--amber)' },
    blue:   { bg: 'var(--blue-dim)',    border: 'rgba(37,99,235,0.2)', icon: 'var(--blue)',    text: 'var(--blue)' },
    purple: { bg: 'var(--purple-dim)',  border: 'rgba(124,58,237,0.2)',icon: 'var(--purple)',  text: 'var(--purple)' },
  };
  const c = palette[color] || palette.green;
  return (
    <button onClick={() => navigate(to)} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 'var(--r-lg)', cursor: 'pointer', width: '100%', textAlign: 'left',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.95)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} color={c.icon} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: c.text, letterSpacing: '-0.01em' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>}
      </div>
      <ArrowRight size={14} color={c.icon} />
    </button>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const mode = user?.businessMode || 'RESTAURANT';
  const modeConfig = getModeConfig(mode);
  const hasBookings = needsBookings(mode);

  useEffect(() => {
    dashApi.overview()
      .then(r => setOverview(r.data))
      .catch(err => toast.error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const d = overview?.last30Days || {};
  const whatsappActive = !!(user?.whatsapp?.connected);
  const bizFromOverview = overview?.business || {};

  const setupItems = [
    { label: 'Business Info',      done: !!user?.name && user.name !== 'My Business', to: '/setup/business' },
    { label: 'WhatsApp Connected', done: whatsappActive,                               to: '/setup/whatsapp' },
    { label: 'Opening Hours',      done: !!(bizFromOverview.hours?.enabled),           to: '/setup/hours' },
    { label: 'Bot Messages',       done: !!(bizFromOverview.customMessages?.welcome),  to: '/setup/bot' },
  ];
  const setupDone = setupItems.filter(i => i.done).length;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
          fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 4,
        }}>
          {greeting}, {user?.name} {modeConfig.emoji}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Last 30 days snapshot</p>
      </div>

      {/* WhatsApp warning */}
      {!whatsappActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', marginBottom: 22,
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)',
          borderRadius: 'var(--r-lg)',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="var(--amber)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--amber)', marginBottom: 2 }}>WhatsApp not connected</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your AI bot won't respond until WhatsApp is connected.</div>
          </div>
          <Btn size="sm" variant="amber" onClick={() => navigate('/setup/whatsapp')} style={{ flexShrink: 0 }}>Connect</Btn>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <div className="stagger">
          {/* Stats */}
          <div className="grid-auto" style={{ marginBottom: 22 }}>
            {!hasBookings ? (
              <StatCard label="Orders (30d)" value={d.orders ?? 0} icon={ShoppingCart} color="green"
                sub={d.orders === 0 ? 'Waiting for first order' : `${d.orders} received`} />
            ) : (
              <StatCard label="Bookings (30d)" value={d.bookings ?? 0} icon={Calendar} color="green"
                sub={d.bookings === 0 ? 'No bookings yet' : `${d.bookings} scheduled`} />
            )}
            <StatCard label="Customers" value={d.customers ?? 0} icon={Users} color="blue" sub="Total unique" />
            <StatCard
              label="Revenue (30d)"
              value={d.revenue != null ? `D ${Number(d.revenue).toFixed(0)}` : '—'}
              icon={TrendingUp} color="amber" sub="Confirmed orders"
            />
            <StatCard label="Live Sessions" value={overview?.activeHumanSessions ?? 0} icon={MessageSquare} color="purple" sub="Human-mode active" />
          </div>

          {/* Quick actions + setup */}
          <div className="grid-2" style={{ gap: 18 }}>
            <Card>
              <SectionHeading>Quick Actions</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!hasBookings
                  ? <QuickAction icon={ShoppingCart} label="View Orders"    desc="Manage customer orders"      to="/orders" />
                  : <QuickAction icon={Calendar}     label="View Bookings"  desc="Manage appointments"         to="/bookings" />}
                <QuickAction icon={MessageSquare} label="Live Sessions" desc="Monitor conversations" to="/sessions" color="amber" />
                <QuickAction icon={Users}         label="Customers"     desc="Browse customer list"  to="/customers" color="blue" />
                <QuickAction icon={TrendingUp}    label="Analytics"     desc="Performance report"   to="/analytics" color="purple" />
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', letterSpacing: '-0.02em' }}>Setup Status</h3>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, color: setupDone === setupItems.length ? 'var(--primary)' : 'var(--text-muted)',
                  background: setupDone === setupItems.length ? 'var(--primary-dim)' : 'var(--bg-overlay)',
                  padding: '3px 9px', borderRadius: 99, letterSpacing: '0.04em',
                }}>{setupDone}/{setupItems.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {setupItems.map(item => (
                  <button key={item.label} onClick={() => navigate(item.to)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px',
                    textAlign: 'left', borderRadius: 'var(--r-md)', transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {item.done
                      ? <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                      : <Circle size={18} color="var(--border-strong)" style={{ flexShrink: 0 }} />
                    }
                    <span style={{
                      fontSize: '0.875rem',
                      color: item.done ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: item.done ? 600 : 400,
                      letterSpacing: '-0.01em',
                    }}>{item.label}</span>
                    {!item.done && <ArrowRight size={12} color="var(--text-ghost)" style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
