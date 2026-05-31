import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, MessageSquare, ShoppingCart, BarChart3, Info } from 'lucide-react';
import { analytics as analyticsApi } from '../services/api';
import {
  PageHeader, Card, StatCard, Grid, Spinner, SectionTitle
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { getBizConfig } from '../utils/businessConfig';
import { useAuth } from '../store/AuthContext';
import { formatCurrency } from '../utils/currency';

const PERIODS = [
  { label: '7 days',  value: '7d',  days: 7  },
  { label: '30 days', value: '30d', days: 30 },
  { label: '90 days', value: '90d', days: 90 },
];

const TIP = {
  contentStyle: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text-primary)', fontSize: 12,
    fontFamily: 'var(--font-body)',
  },
  cursor: { stroke: 'var(--border-strong)', strokeWidth: 1 },
};

export default function AnalyticsPage() {
  const { tenant } = useAuth();
  const cfg = getBizConfig(tenant?.businessMode || 'GENERIC');
  const [period, setPeriod]     = useState('7d');
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [topProducts, setTop]   = useState([]);
  const [funnel, setFunnel]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    const days = PERIODS.find(p => p.value === period)?.days || 30;

    Promise.all([
      analyticsApi.overview(),
      analyticsApi.analytics(days),
      analyticsApi.revenue(period),
      analyticsApi.messages(period),
      analyticsApi.topProducts(),
      analyticsApi.conversionFunnel(),
    ]).then(([ov, agg, rev, msg, top, fn]) => {
      const aggData = agg?.data || {};
      setOverview({
        ...ov.data,
        // Override with period-scoped values from /analytics?days=N
        totalOrders:   aggData.orders   ?? ov.data?.totalOrders   ?? 0,
        totalRevenue:  aggData.revenue  ?? ov.data?.totalRevenue  ?? 0,
        totalBookings: aggData.bookings ?? ov.data?.totalBookings ?? 0,
      });
      setRevenue(rev.data?.data || []);
      setMessages(msg.data?.data || []);
      setTop(top.data?.products || []);
      setFunnel(fn.data?.funnel || []);
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <Spinner />;

  // note whether the backend has returned series data for charts
  const hasRevenueData  = revenue.length > 0;
  const hasMessageData  = messages.length > 0;
  const hasChartData    = hasRevenueData || hasMessageData;

  return (
    <div className="fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Performance insights for your WhatsApp bot"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 600,
                background: period === p.value ? 'var(--primary)' : 'var(--bg-overlay)',
                color: period === p.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: '1px solid ' + (period === p.value ? 'var(--primary)' : 'var(--border)'),
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{p.label}</button>
            ))}
          </div>
        }
      />

      {/* KPI stats — sourced from /analytics?days=N (period-scoped) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total Revenue"
          value={overview?.totalRevenue != null ? formatCurrency(overview.totalRevenue, tenant?.payment?.currency) : '—'}
          sub="Confirmed orders"
          icon={TrendingUp}
          color="var(--green)"
        />
        <StatCard
          label={cfg.dashboard.ordersStatLabel}
          value={overview?.totalOrders ?? '—'}
          sub={`Last ${PERIODS.find(p => p.value === period)?.label}`}
          icon={ShoppingCart}
          color="var(--primary)"
        />
        {(cfg.transactions.type === 'bookings' || cfg.transactions.type === 'both') && (
          <StatCard
            label={cfg.dashboard.bookingsStatLabel}
            value={overview?.totalBookings ?? '—'}
            sub={`Last ${PERIODS.find(p => p.value === period)?.label}`}
            icon={BarChart3}
            color="var(--blue)"
          />
        )}
        {/* FIX: totalMessages and conversionRate are not in the backend response.
            Show informative '—' with accurate sub-label instead of misleading metric name. */}
        <StatCard
          label="Active Sessions"
          value={overview?.activeSessions ?? '—'}
          sub="Human-mode count"
          icon={MessageSquare}
          color="var(--purple)"
        />
      </div>

      {/* FIX: Chart data notice — period selector only affects KPI numbers above.
          The backend /analytics endpoint returns aggregate counts, not daily series.
          Charts only populate if the backend adds a daily series endpoint in future. */}
      {!hasChartData && (
        <Card style={{ marginBottom: 20, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '13px 18px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Info size={15} color="var(--blue)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--blue)', lineHeight: 1.5 }}>
              <strong>Charts pending:</strong> The period selector above updates the KPI numbers.
              Daily-series chart data (revenue line, message bar) requires a backend endpoint that hasn't been added yet.
              Charts will populate automatically once that data is available.
            </div>
          </div>
        </Card>
      )}

      {/* Revenue + Messages charts */}
      <Grid cols={2} minColWidth={280} gap={16} style={{ marginBottom: 20 }}>
        <Card style={{ padding: '20px 20px 10px' }}>
          <SectionTitle>Revenue</SectionTitle>
          {hasRevenueData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3ecf8e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                <Area type="monotone" dataKey="revenue" stroke="var(--green)" strokeWidth={2} fill="url(#revGrad2)" name="Revenue (D)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <TrendingUp size={28} color="var(--border-strong)" />
              No daily series data yet
            </div>
          )}
        </Card>

        <Card style={{ padding: '20px 20px 10px' }}>
          <SectionTitle>Daily Messages</SectionTitle>
          {hasMessageData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={messages} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MessageSquare size={28} color="var(--border-strong)" />
              No daily series data yet
            </div>
          )}
        </Card>
      </Grid>

      {/* Top products + Funnel */}
      <Grid cols={2} minColWidth={280} gap={16}>
        <Card>
          <SectionTitle sub={`Most ordered ${cfg.catalog.itemLabelPlural}`}>Top {cfg.catalog.itemLabelPlural.charAt(0).toUpperCase() + cfg.catalog.itemLabelPlural.slice(1)}</SectionTitle>
          {topProducts.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 40 }}>No order data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.slice(0, 7).map((p, i) => {
                const max = topProducts[0]?.count || 1;
                const pct = Math.round((p.count / max) * 100);
                return (
                  <div key={p.name || i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.87rem', fontWeight: 500 }}>{p.name}</span>
                      <span style={{ fontSize: '0.87rem', color: 'var(--text-muted)' }}>{p.count} orders</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-overlay)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle sub="Message → Order conversion funnel">Conversion Funnel</SectionTitle>
          {funnel.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 40 }}>No funnel data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...TIP} />
                <Bar dataKey="count" fill="var(--blue)" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </Grid>
    </div>
  );
}
