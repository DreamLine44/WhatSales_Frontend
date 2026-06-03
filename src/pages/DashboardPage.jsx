import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Calendar, Users, MessageSquare, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { dashApi, getModeConfig, needsBookings } from '../api.js';
import { StatCard, Card, Btn, StatusBadge, EmptyState, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function QuickAction({ icon: Icon, label, to, color = 'green' }) {
  const navigate = useNavigate();
  const colors = { green: 'var(--primary-dim)', amber: 'var(--amber-dim)', blue: 'var(--blue-dim)' };
  const textColors = { green: 'var(--primary)', amber: 'var(--amber)', blue: 'var(--blue)' };
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: colors[color],
        border: `1.5px solid ${colors[color]}`, borderRadius: 'var(--radius-lg)',
        cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={textColors[color]} />
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: textColors[color], flex: 1 }}>{label}</span>
      <ArrowRight size={14} color={textColors[color]} />
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
      .then(r => setOverview(r.data || r))
      .catch(err => toast.error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const d = overview?.last30Days || {};
  const whatsappActive = !!(user?.whatsapp?.connected || user?.whatsapp?.phoneNumberId);

  return (
    <div className="fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 4 }}>
          Good day, {user?.name} {modeConfig.emoji}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Here's what's happening in the last 30 days
        </p>
      </div>

      {/* WhatsApp warning banner */}
      {!whatsappActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', marginBottom: 24,
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.2)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <Zap size={18} color="var(--amber)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--amber)', marginBottom: 2 }}>WhatsApp not connected</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your AI bot won't respond to customers until WhatsApp is connected.</div>
          </div>
          <Btn size="sm" variant="amber" onClick={() => navigate('/setup/whatsapp')}>
            Connect Now
          </Btn>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            {!hasBookings && (
              <StatCard
                label="Orders (30d)"
                value={d.orders ?? 0}
                icon={ShoppingCart}
                color="green"
                sub={d.orders === 0 ? 'No orders yet — bot is waiting' : `${d.orders} received`}
              />
            )}
            {hasBookings && (
              <StatCard
                label="Bookings (30d)"
                value={d.bookings ?? 0}
                icon={Calendar}
                color="green"
                sub={d.bookings === 0 ? 'No bookings yet' : `${d.bookings} scheduled`}
              />
            )}
            <StatCard
              label="Customers"
              value={d.customers ?? 0}
              icon={Users}
              color="blue"
              sub="Total unique customers"
            />
            <StatCard
              label="Revenue (30d)"
              value={d.revenue != null ? `D ${Number(d.revenue).toFixed(0)}` : '—'}
              icon={TrendingUp}
              color="amber"
              sub="Confirmed orders"
            />
            <StatCard
              label="Live Sessions"
              value={overview?.activeHumanSessions ?? 0}
              icon={MessageSquare}
              color="purple"
              sub="Human-mode active"
            />
          </div>

          {/* Quick actions + recent */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, color: 'var(--text-primary)' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!hasBookings && <QuickAction icon={ShoppingCart} label="View Orders" to="/orders" />}
                {hasBookings && <QuickAction icon={Calendar} label="View Bookings" to="/bookings" />}
                <QuickAction icon={MessageSquare} label="Live Sessions" to="/sessions" color="amber" />
                <QuickAction icon={Users} label="Customers" to="/customers" color="blue" />
              </div>
            </Card>

            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, color: 'var(--text-primary)' }}>Setup Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Business Info', done: !!user?.name, to: '/setup/business' },
                  { label: 'WhatsApp Connected', done: whatsappActive, to: '/setup/whatsapp' },
                  { label: 'Opening Hours', done: false, to: '/setup/hours' },
                  { label: 'Bot Messages', done: false, to: '/setup/bot' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.to)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: item.done ? 'var(--primary)' : 'var(--bg-overlay)',
                      border: `2px solid ${item.done ? 'var(--primary)' : 'var(--border-mid)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.done && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: item.done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
