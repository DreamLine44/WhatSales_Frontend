import { useEffect, useState } from 'react';
import { Users, Activity, AlertCircle, CheckCircle2, RefreshCw, Wifi, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api.js';
import { PageHeader, StatCard, Card, Btn, Spinner } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const colors = {
    green:  'var(--primary)',
    amber:  'var(--amber)',
    blue:   'var(--blue)',
    red:    'var(--red)',
    gray:   'var(--text-ghost)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.845rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: colors[color], fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{count}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: colors[color], width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.listTenants()
      .then(r => {
        const tenants   = r.data.tenants || [];
        const active    = tenants.filter(t => t.status === 'ACTIVE').length;
        const pending   = tenants.filter(t => t.status === 'PENDING').length;
        const inactive  = tenants.filter(t => t.status === 'INACTIVE').length;
        const suspended = tenants.filter(t => t.status === 'SUSPENDED').length;
        const configured = tenants.filter(t => t.whatsapp?.phoneNumberId).length;
        setStats({ total: tenants.length, active, pending, inactive, suspended, configured });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Admin Dashboard" subtitle="Platform overview"
        actions={<Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Btn>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="stagger">
          <div className="grid-auto">
            <StatCard label="Total Tenants"         value={stats.total}      icon={Users}        color="blue" />
            <StatCard label="Active"                value={stats.active}     icon={CheckCircle2} color="green"  sub="Fully operational" />
            <StatCard label="Pending Setup"         value={stats.pending}    icon={AlertCircle}  color="amber"  sub="Awaiting activation" />
            <StatCard label="WhatsApp Configured"   value={stats.configured} icon={Wifi}         color="teal"   sub="Number configured" />
          </div>

          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em', marginBottom: 20 }}>Status Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StatusBar label="Active"    count={stats.active}    total={stats.total} color="green" />
              <StatusBar label="Pending"   count={stats.pending}   total={stats.total} color="amber" />
              <StatusBar label="Inactive"  count={stats.inactive}  total={stats.total} color="gray" />
              {stats.suspended > 0 && <StatusBar label="Suspended" count={stats.suspended} total={stats.total} color="red" />}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
