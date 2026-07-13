import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Calendar, RefreshCw } from 'lucide-react';
import { dashApi, formatMoney } from '../api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, StatCard, Card, Btn, Spinner, InlineSelect } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function MetricBar({ label, value, displayValue, color, max, suffix = '' }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(t); }, []);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.975rem', fontWeight: 800, color, fontFamily: 'var(--font-body)', letterSpacing: '-0.005em', fontVariantNumeric: 'tabular-nums' }}>
          {displayValue ?? value}{suffix}
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: color,
          width: animated ? `${pct}%` : '0%',
          transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      dashApi.analytics(days),
      // GET /dashboard/:id/analytics/timeseries — day-by-day breakdown + top items.
      // Non-fatal if it fails: the summary stat cards above still work without it.
      dashApi.analyticsTimeseries(days).catch(() => ({ data: null })),
    ])
      .then(([summaryRes, tsRes]) => {
        setData(summaryRes.data);
        setTimeseries(tsRes.data);
      })
      .catch(err => { setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, [days]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const maxActivity = data ? Math.max(data.orders ?? 0, data.bookings ?? 0, 1) : 1;

  return (
    <div className="fade-in">
      <PageHeader
        icon={BarChart3} title="Analytics" subtitle="Business performance overview"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <InlineSelect value={days} onChange={v => setDays(Number(v))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </InlineSelect>
            <Btn variant="ghost" size="sm" onClick={load} title="Refresh"><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : error ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--red)', padding: '40px 0' }}>{error} <Btn size="sm" variant="ghost" onClick={load} style={{ marginLeft: 10 }}>Retry</Btn></p></Card>
      ) : !data ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No analytics data available yet.</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="stagger">
          {/* Stat cards */}
          <div className="grid-auto">
            <StatCard label="Total Orders"   value={data.orders   ?? '—'} icon={ShoppingCart} color="green" sub={`Last ${days} days`} />
            <StatCard label="Total Bookings" value={data.bookings ?? '—'} icon={Calendar}     color="blue"  sub={`Last ${days} days`} />
            <StatCard
              label="Revenue"
              value={data.revenue != null ? formatMoney(data.revenue, user?.currency) : '—'}
              icon={TrendingUp} color="amber" sub="Confirmed orders"
            />
          </div>

          {/* Activity metrics */}
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Activity — Last {data.days || days} days
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MetricBar label="Orders placed"  value={data.orders   ?? 0} color="var(--primary)" max={maxActivity} />
              <MetricBar label="Bookings made"  value={data.bookings ?? 0} color="var(--blue)"    max={maxActivity} />
              <MetricBar
                label="Revenue earned"
                value={data.revenue || 0}
                displayValue={formatMoney(data.revenue || 0, user?.currency)}
                color="var(--amber)" max={Math.max(data.revenue || 0, 1)}
              />
            </div>
          </Card>

          {/* Top items — from GET /analytics/timeseries, only shown when data exists */}
          {timeseries?.topItems?.length > 0 && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, letterSpacing: '-0.02em' }}>
                Top Items — Last {timeseries.days || days} days
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {timeseries.topItems.map((t, i) => (
                  <div key={t.item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-ghost)', width: 18, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.item}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.quantity} sold</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-ghost)' }}>· {t.orders} order{t.orders !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
