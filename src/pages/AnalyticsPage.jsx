import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Calendar, RefreshCw } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, StatCard, Card, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function MetricRow({ label, value, color, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    dashApi.analytics(days)
      .then(r => setData(r.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const maxVal = data ? Math.max(data.orders ?? 0, data.bookings ?? 0, 1) : 1;

  return (
    <div className="fade-in">
      <PageHeader
        icon={BarChart3} title="Analytics" subtitle="Business performance overview"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              style={{
                padding: '8px 30px 8px 12px', border: '1.5px solid var(--border-mid)',
                borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.815rem',
                background: 'var(--bg-surface)', cursor: 'pointer', outline: 'none', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23627065' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : !data ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No analytics data available yet.</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="stagger">
          <div className="grid-3">
            <StatCard label="Total Orders"   value={data.orders   ?? '—'} icon={ShoppingCart} color="green" sub={`Last ${days} days`} />
            <StatCard label="Total Bookings" value={data.bookings ?? '—'} icon={Calendar}     color="blue"  sub={`Last ${days} days`} />
            <StatCard
              label="Revenue"
              value={data.revenue != null ? `D ${Number(data.revenue).toFixed(0)}` : '—'}
              icon={TrendingUp} color="amber" sub="Confirmed orders"
            />
          </div>

          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, letterSpacing: '-0.02em' }}>
              Activity — Last {data.days || days} days
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MetricRow label="Orders placed"  value={data.orders   ?? 0} color="var(--primary)" max={maxVal} />
              <MetricRow label="Bookings made"  value={data.bookings ?? 0} color="var(--blue)"    max={maxVal} />
              <MetricRow
                label="Revenue earned"
                value={`D ${Number(data.revenue || 0).toFixed(0)}`}
                color="var(--amber)" max={100}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
