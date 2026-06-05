import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, AlertCircle, CheckCircle2, RefreshCw,
  Wifi, TrendingUp, Clock, ArrowRight, PowerOff, ShieldOff,
} from 'lucide-react';
import { adminApi, getModeConfig } from '../../api.js';
import { PageHeader, StatCard, Card, Btn, Spinner, Badge, StatusBadge } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  const colorMap = {
    green:  'var(--primary)',
    amber:  'var(--amber)',
    blue:   'var(--blue)',
    red:    'var(--red)',
    gray:   'var(--text-ghost)',
    purple: 'var(--purple)',
  };
  const c = colorMap[color] || color;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.845rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: c, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            {count}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>
            {total > 0 ? `${Math.round(pct)}%` : '—'}
          </span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: c,
          width: `${pct}%`, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function RecentTenantRow({ tenant }) {
  const modeConfig = getModeConfig(tenant.businessMode);
  const hasWA = !!(tenant.whatsapp?.phoneNumberId);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', flexShrink: 0,
      }}>
        {(tenant.name || 'T')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tenant.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {modeConfig?.label || tenant.businessMode || '—'}
          {tenant.createdAt && ` · ${new Date(tenant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {hasWA
          ? <Wifi size={13} color="var(--primary)" title="WhatsApp configured" />
          : <Wifi size={13} color="var(--border-mid)" title="WhatsApp not configured" />
        }
        <StatusBadge status={tenant.status || 'PENDING'} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listTenants()
      // [FIX-DASH-1] Use optional chaining so data shape mismatches don't hard-crash
      .then(r => setTenants(r.data?.tenants || r.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = tenants ? {
    total:      tenants.length,
    active:     tenants.filter(t => t.status === 'ACTIVE').length,
    pending:    tenants.filter(t => t.status === 'PENDING').length,
    inactive:   tenants.filter(t => t.status === 'INACTIVE').length,
    suspended:  tenants.filter(t => t.status === 'SUSPENDED').length,
    withWA:     tenants.filter(t => t.whatsapp?.phoneNumberId).length,
    // [FIX-DASH-2] A tenant is "connected" when phoneNumberId exists AND connected flag is true
    connected:  tenants.filter(t => t.whatsapp?.phoneNumberId && t.whatsapp?.connected).length,
  } : null;

  const recentTenants = tenants
    ? [...tenants]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
    : [];

  // Tenants needing attention: PENDING status OR active with no WhatsApp credentials
  const needsAttention = tenants
    ? tenants.filter(t =>
        t.status === 'PENDING' ||
        (t.status === 'ACTIVE' && !t.whatsapp?.phoneNumberId)
      )
    : [];

  return (
    <div className="fade-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview"
        actions={
          <Btn variant="ghost" size="sm" onClick={load} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Btn>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size={32} />
        </div>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="stagger">

          <div className="grid-auto">
            <StatCard
              label="Total Tenants" value={stats.total} icon={Users} color="blue"
              sub={`${stats.active} active`}
            />
            <StatCard
              label="Active" value={stats.active} icon={CheckCircle2} color="green"
              sub="Bot live & running"
            />
            <StatCard
              label="Pending Setup" value={stats.pending} icon={AlertCircle} color="amber"
              sub="Awaiting activation"
            />
            <StatCard
              label="WA Configured" value={stats.withWA} icon={Wifi} color="teal"
              sub={`${stats.connected} connected`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Status Breakdown
                </h3>
                <button
                  onClick={() => navigate('/admin/tenants')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <StatusBar label="Active"    count={stats.active}    total={stats.total} color="green" />
                <StatusBar label="Pending"   count={stats.pending}   total={stats.total} color="amber" />
                <StatusBar label="Inactive"  count={stats.inactive}  total={stats.total} color="gray"  />
                {stats.suspended > 0 && (
                  <StatusBar label="Suspended" count={stats.suspended} total={stats.total} color="red" />
                )}
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  WhatsApp Integration
                </div>
                <StatusBar label="Credentials configured" count={stats.withWA}    total={stats.total} color="green"  />
                <div style={{ marginTop: 10 }}>
                  <StatusBar label="Fully connected"       count={stats.connected} total={stats.total} color="blue" />
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Needs Attention
                </h3>
                {needsAttention.length > 0 && (
                  <Badge color="amber">{needsAttention.length}</Badge>
                )}
              </div>

              {needsAttention.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={28} color="var(--primary)" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    All active tenants are properly configured.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {needsAttention.slice(0, 6).map(t => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', background: 'var(--bg-overlay)',
                        borderRadius: 'var(--r-md)', cursor: 'pointer',
                        border: '1.5px solid var(--border)',
                      }}
                      onClick={() => navigate('/admin/tenants')}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: t.status === 'PENDING' ? 'var(--amber-dim)' : 'var(--primary-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.78rem',
                        color: t.status === 'PENDING' ? 'var(--amber)' : 'var(--primary)',
                      }}>
                        {(t.name || 'T')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {t.status === 'PENDING'
                            ? 'Pending activation'
                            : 'Active but WhatsApp not configured'}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                  {needsAttention.length > 6 && (
                    <button
                      onClick={() => navigate('/admin/tenants')}
                      style={{
                        fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600,
                        background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'center', padding: '8px',
                      }}
                    >
                      +{needsAttention.length - 6} more → View all
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {recentTenants.length > 0 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Recently Created
                </h3>
                <button
                  onClick={() => navigate('/admin/tenants')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  Manage all <ArrowRight size={12} />
                </button>
              </div>
              <div>
                {recentTenants.map((t, i) => (
                  <div key={t._id} style={i === recentTenants.length - 1 ? { borderBottom: 'none' } : {}}>
                    <RecentTenantRow tenant={t} />
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
