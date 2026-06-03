import { useEffect, useState } from 'react';
import { Users, Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api.js';
import { PageHeader, StatCard, Btn, Spinner } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    adminApi.listTenants()
      .then(r => {
        const tenants = r.data.tenants || [];
        const active   = tenants.filter(t => t.status === 'ACTIVE').length;
        const pending  = tenants.filter(t => t.status === 'PENDING').length;
        const inactive = tenants.filter(t => t.status === 'INACTIVE').length;
        const suspended = tenants.filter(t => t.status === 'SUSPENDED').length;
        const connected = tenants.filter(t => t.whatsapp?.phoneNumberId).length;
        setStats({ total: tenants.length, active, pending, inactive, suspended, connected });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview"
        actions={<Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /> Refresh</Btn>}
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>
      ) : stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <StatCard label="Total Tenants" value={stats.total} icon={Users} color="blue" />
          <StatCard label="Active" value={stats.active} icon={CheckCircle2} color="green" sub="Fully operational" />
          <StatCard label="Pending Setup" value={stats.pending} icon={AlertCircle} color="amber" sub="Awaiting activation" />
          <StatCard label="WhatsApp Connected" value={stats.connected} icon={Activity} color="green" sub="Number configured" />
          <StatCard label="Inactive" value={stats.inactive} icon={Users} color="gray" />
          {stats.suspended > 0 && <StatCard label="Suspended" value={stats.suspended} icon={AlertCircle} color="red" />}
        </div>
      )}
    </div>
  );
}
