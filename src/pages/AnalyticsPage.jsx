import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Users, RefreshCw } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, StatCard, Card, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetch = () => {
    setLoading(true);
    dashApi.analytics(days)
      .then(r => setData(r.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [days]);

  return (
    <div className="fade-in">
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        subtitle="Business performance overview"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', background: 'var(--bg-surface)', cursor: 'pointer' }}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : !data ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No analytics data available yet.</p></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatCard label="Total Orders" value={data.totalOrders ?? '—'} icon={ShoppingCart} color="green" sub={`Last ${days} days`} />
            <StatCard label="Revenue" value={data.revenue != null ? `D ${Number(data.revenue).toFixed(0)}` : '—'} icon={TrendingUp} color="amber" sub="Confirmed orders" />
            <StatCard label="Customers" value={data.uniqueCustomers ?? '—'} icon={Users} color="blue" sub="Unique contacts" />
            <StatCard label="Total Messages" value={data.totalMessages ?? '—'} icon={BarChart3} color="purple" sub="Bot conversations" />
          </div>

          {data.ordersByStatus && Object.keys(data.ordersByStatus).length > 0 && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>Orders by Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(data.ordersByStatus).map(([status, count]) => {
                  const max = Math.max(...Object.values(data.ordersByStatus));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 120, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0, textTransform: 'capitalize' }}>{status}</span>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-overlay)', borderRadius: 99 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: status === 'confirmed' || status === 'completed' ? 'var(--primary)' : status === 'cancelled' || status === 'rejected' ? 'var(--red)' : 'var(--amber)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ width: 32, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {data.revenueByDay && data.revenueByDay.length > 0 && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>Daily Revenue</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflow: 'hidden' }}>
                {data.revenueByDay.slice(-30).map((d, i) => {
                  const max = Math.max(...data.revenueByDay.map(x => x.revenue || 0), 1);
                  const h = ((d.revenue || 0) / max) * 100;
                  return (
                    <div key={i} title={`${d.date}: D${d.revenue?.toFixed(0) || 0}`}
                      style={{ flex: 1, minWidth: 4, height: `${Math.max(h, 2)}%`, background: 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: 0.8, transition: 'height 0.4s ease' }} />
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
