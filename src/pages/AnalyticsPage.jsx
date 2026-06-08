import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Calendar, RefreshCw, Users } from 'lucide-react';
import { dashApi } from '../api.js';
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
        <span style={{ fontSize: '0.975rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
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

function SimpleBarChart({ data, color = 'var(--primary)', label = '' }) {
  // [FIX-HOOK] useState must be called unconditionally — hooks cannot come after an early return
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {data.map((d, i) => (
          <div
            key={i}
            title={`${d.label}: ${d.value}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: 1, borderRadius: '3px 3px 0 0', cursor: 'default',
              background: hovered === i ? color : color + '70',
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 3 : 0,
              transition: 'background 0.15s, height 0.5s ease',
              position: 'relative',
            }}
          >
            {hovered === i && d.value > 0 && (
              <div style={{
                position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--text-primary)', color: '#fff',
                fontSize: '0.7rem', fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                whiteSpace: 'nowrap', marginBottom: 4, pointerEvents: 'none',
              }}>
                {d.value}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, fontSize: '0.58rem', color: 'var(--text-ghost)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    dashApi.analytics(days)
      .then(r => setData(r.data))
      .catch(err => { setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, [days]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const maxActivity = data ? Math.max(data.orders ?? 0, data.bookings ?? 0, 1) : 1;

  // Build daily bar chart data from whatever the API provides
  const orderBars = data?.dailyOrders?.map(d => ({ label: d.date?.slice(-2) || '', value: d.count || 0 }));
  const revenueBars = data?.dailyRevenue?.map(d => ({ label: d.date?.slice(-2) || '', value: d.amount || 0 }));

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
            <Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /></Btn>
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
              value={data.revenue != null ? `D ${Number(data.revenue).toFixed(0)}` : '—'}
              icon={TrendingUp} color="amber" sub="Confirmed orders"
            />
            {data.newCustomers != null && (
              <StatCard label="New Customers" value={data.newCustomers} icon={Users} color="purple" sub={`Last ${days} days`} />
            )}
          </div>

          {/* Bar charts if available */}
          {(orderBars || revenueBars) && (
            <div className="grid-2" style={{ gap: 16 }}>
              {orderBars && (
                <Card>
                  <SimpleBarChart data={orderBars} color="var(--primary)" label="Orders per day" />
                </Card>
              )}
              {revenueBars && (
                <Card>
                  <SimpleBarChart data={revenueBars} color="var(--amber)" label="Revenue per day (D)" />
                </Card>
              )}
            </div>
          )}

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
                displayValue={`D ${Number(data.revenue || 0).toFixed(0)}`}
                color="var(--amber)" max={100}
              />
              {data.conversations != null && (
                <MetricBar label="Conversations" value={data.conversations} color="var(--purple)" max={Math.max(maxActivity, data.conversations)} />
              )}
            </div>
          </Card>

          {/* Top items if available */}
          {data.topItems?.length > 0 && (
            <Card>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16, letterSpacing: '-0.02em' }}>
                Top Items
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.topItems.slice(0, 5).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, background: 'var(--bg-overlay)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{item.count} orders</span>
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
