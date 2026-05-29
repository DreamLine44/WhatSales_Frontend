import { useEffect, useState } from 'react';
import { ShoppingCart, CalendarCheck, MessageSquare, TrendingUp, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { analytics, orders, sessions } from '../services/api';
import { PageHeader, StatCard, Card, Spinner, Badge, Button, InfoBanner } from '../components/ui/index.jsx';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currency';

const TIP_STYLE = {
  contentStyle: {
    background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: 12,
    fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-md)',
  },
  cursor: { stroke: 'var(--border-accent)', strokeWidth: 1 },
};

// Complete status colour map — covers all real backend statuses
const STATUS_COLORS = {
  confirmed:      'var(--green)',
  completed:      'var(--green)',
  pending:        'var(--amber)',
  payment_failed: 'var(--red)',
  rejected:       'var(--red)',
  cancelled:      'var(--red)',
};

export default function DashboardPage() {
  const { user, tenant } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [humanModeCount, setHumanModeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analytics.overview(),
      analytics.revenue(),
      orders.list({ status: 'pending', limit: 5 }),
      sessions.humanModeCount(),
    ]).then(([ov, rev, ord, hm]) => {
      setStats(ov.data);
      setRevenue(rev.data?.data || []);
      setPendingOrders(ord.data?.orders || []);
      setHumanModeCount(hm.data?.count || 0);
    }).catch(() => toast.error('Failed to load dashboard data')).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', borderRadius: 99, padding: '4px 12px', marginBottom: 10 }}>
            <Zap size={13} color="var(--primary)" />
            <span style={{ fontSize: '0.77rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Dashboard</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ marginTop: 5, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Here's what's happening with your WhatsApp bot today</p>
        </div>
        <Button variant="mint" onClick={() => navigate('/analytics')} style={{ gap: 6 }}>
          View Analytics <ArrowRight size={14} />
        </Button>
      </div>

      {/* Human mode alert */}
      {humanModeCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.25)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 24,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={17} color="var(--amber)" />
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <strong>{humanModeCount}</strong> customer{humanModeCount > 1 ? 's are' : ' is'} waiting — bot is silent
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* FIX: was misleadingly labelled "Resume Bot" — navigates to Sessions; renamed to "Manage Sessions" */}
            <Button size="sm" onClick={() => navigate('/sessions')}>Manage Sessions</Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        <StatCard label="Total Orders"    value={stats?.totalOrders ?? '—'}  sub="Last 30 days"       icon={ShoppingCart} color="var(--primary)" />
        <StatCard label="Revenue"         value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue, tenant?.payment?.currency) : '—'} sub="Confirmed payments" icon={TrendingUp} color="var(--green)" trend="up" />
        <StatCard label="Bookings"        value={stats?.totalBookings ?? '—'} sub="Last 30 days"       icon={CalendarCheck} color="var(--blue)" />
        <StatCard label="Active Sessions" value={stats?.activeSessions ?? '—'} sub="In human mode"    icon={MessageSquare} color="var(--purple)" />
      </div>

      {/* Charts row */}
      <div className="dashboard-charts-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Revenue chart */}
        <Card style={{ padding: '22px 22px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Revenue Trend</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Daily series — available when backend adds analytics endpoint</div>
            </div>
            <Badge label="This week" color="mint" />
          </div>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenue} margin={{ top: 5, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP_STYLE} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', flexDirection: 'column', gap: 6 }}>
              <TrendingUp size={28} color="var(--border-strong)" />
              Revenue chart data is not yet available
            </div>
          )}
        </Card>

        {/* Order status breakdown */}
        <Card>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 18 }}>Order Status</div>
          {stats?.ordersByStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                const total = Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0);
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] || 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: STATUS_COLORS[status] || 'var(--text-muted)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '32px 0', lineHeight: 1.6 }}>
              <ShoppingCart size={24} color="var(--border-strong)" style={{ marginBottom: 8 }} />
              <div>No breakdown data yet</div>
              <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Order stats appear here once orders are placed</div>
            </div>
          )}
        </Card>
      </div>

      {/* Pending orders */}
      {pendingOrders.length > 0 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 6px var(--blue)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Orders Awaiting Review</div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pending orders need approval or rejection</div>
            </div>
            {/* FIX: was /orders?filter=proof_received — 'proof_received' is a paymentStatus, not an order status.
                 Backend status filter only supports: pending | confirmed | completed | cancelled | payment_failed | rejected.
                 Link to /orders?filter=pending which correctly surfaces pending orders. */}
            <Button size="sm" variant="secondary" onClick={() => navigate('/orders?filter=pending')}>View All</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingOrders.map(order => (
              <div key={order._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '13px 16px',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--blue-dim)', border: '1.5px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingCart size={15} color="var(--blue)" />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>#{order.shortId}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 10 }}>
                      {order.item}{order.quantity ? ` × ${order.quantity}` : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{order.customerPhone}</span>
                  <Button size="sm" variant="success" onClick={() => navigate('/orders?filter=pending')}>Review</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
