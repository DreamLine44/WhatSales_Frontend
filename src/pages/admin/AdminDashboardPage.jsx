import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, AlertCircle, CheckCircle2, RefreshCw,
  Wifi, ArrowRight, Power, ShieldAlert,
} from 'lucide-react';
import { adminApi, getModeConfig } from '../../api.js';
import { PageHeader, StatCard, Card, Btn, Spinner, Badge, StatusBadge } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

// ── Status progress bar ───────────────────────────────────────────────────────
function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.min((count / total) * 100, 100) : 0;
  const colorMap = {
    green:  'var(--primary)', amber:  'var(--amber)',
    blue:   'var(--blue)',    red:    'var(--red)',
    gray:   'var(--text-ghost)',
  };
  const c = colorMap[color] || color;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.845rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.92rem', fontWeight: 800, color: c,
            fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
          }}>{count}</span>
          <span style={{ fontSize: '0.71rem', color: 'var(--text-ghost)', minWidth: 28, textAlign: 'right' }}>
            {total > 0 ? `${Math.round(pct)}%` : '—'}
          </span>
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, background: c,
          width: `${pct}%`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ── Recent tenant row ─────────────────────────────────────────────────────────
function RecentRow({ tenant, onClick }) {
  const cfg   = getModeConfig(tenant.businessMode);
  const hasWA = !!(tenant.whatsapp?.phoneNumberId);
  const initial = (tenant.name || 'T')[0].toUpperCase();

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 0', width: '100%', background: 'none', border: 'none',
        borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
        transition: 'opacity 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem',
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tenant.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {cfg?.emoji} {cfg?.label || tenant.businessMode || '—'}
          {tenant.createdAt && ` · ${new Date(tenant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Wifi size={13} color={hasWA ? (tenant.whatsapp?.connected ? 'var(--primary)' : 'var(--amber)') : 'var(--border-mid)'} />
        <StatusBadge status={tenant.status || 'PENDING'} />
      </div>
    </button>
  );
}

// ── Attention item ────────────────────────────────────────────────────────────
function AttentionItem({ tenant, onClick }) {
  const isPending = tenant.status === 'PENDING';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 12px',
        background: isPending ? 'rgba(217,119,6,0.05)' : 'var(--bg-overlay)',
        border: `1.5px solid ${isPending ? 'rgba(217,119,6,0.2)' : 'var(--border)'}`,
        borderRadius: 10, cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.14s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-xs)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isPending ? 'var(--amber-dim)' : 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.8rem',
        color: isPending ? 'var(--amber)' : 'var(--primary)',
      }}>
        {(tenant.name || 'T')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.845rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
          {tenant.name}
        </div>
        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
          {isPending ? 'Awaiting activation' : 'Active — WhatsApp not configured'}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {isPending
          ? <Power size={13} color="var(--amber)" />
          : <Wifi  size={13} color="var(--text-muted)" />
        }
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listTenants()
      .then(r => setTenants(r.data?.tenants || r.data || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = tenants ? {
    total:     tenants.length,
    active:    tenants.filter(t => t.status === 'ACTIVE').length,
    pending:   tenants.filter(t => t.status === 'PENDING').length,
    inactive:  tenants.filter(t => t.status === 'INACTIVE').length,
    suspended: tenants.filter(t => t.status === 'SUSPENDED').length,
    withWA:    tenants.filter(t => t.whatsapp?.phoneNumberId).length,
    connected: tenants.filter(t => t.whatsapp?.phoneNumberId && t.whatsapp?.connected).length,
  } : null;

  const recent = tenants
    ? [...tenants].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6)
    : [];

  const needsAttention = tenants
    ? tenants.filter(t => t.status === 'PENDING' || (t.status === 'ACTIVE' && !t.whatsapp?.phoneNumberId))
    : [];

  const goTenants = () => navigate('/admin/tenants');

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview & tenant health"
        actions={
          <Btn variant="ghost" size="sm" onClick={load} loading={loading}>
            <RefreshCw size={14} /> Refresh
          </Btn>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <Spinner size={36} />
        </div>
      ) : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }} className="stagger">

          {/* ── Stat cards ─────────────────────────────────────── */}
          <div className="grid-auto">
            <StatCard label="Total Tenants"  value={stats.total}   icon={Users}         color="blue"  sub={`${stats.active} active`} />
            <StatCard label="Active"         value={stats.active}  icon={CheckCircle2}  color="green" sub="Bot live & running" />
            <StatCard label="Pending Setup"  value={stats.pending} icon={AlertCircle}   color="amber" sub="Awaiting activation" />
            <StatCard label="WA Configured"  value={stats.withWA}  icon={Wifi}          color="teal"  sub={`${stats.connected} connected`} />
          </div>

          {/* ── Two-column section ──────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>

            {/* Status breakdown */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Status Breakdown
                </h3>
                <button onClick={goTenants} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                  borderRadius: 6, transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dim)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <StatusBar label="Active"    count={stats.active}    total={stats.total} color="green" />
                <StatusBar label="Pending"   count={stats.pending}   total={stats.total} color="amber" />
                <StatusBar label="Inactive"  count={stats.inactive}  total={stats.total} color="gray" />
                {stats.suspended > 0 && (
                  <StatusBar label="Suspended" count={stats.suspended} total={stats.total} color="red" />
                )}
              </div>

              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WhatsApp
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <StatusBar label="Credentials saved" count={stats.withWA}    total={stats.total} color="green" />
                  <StatusBar label="Fully connected"   count={stats.connected} total={stats.total} color="blue" />
                </div>
              </div>
            </Card>

            {/* Needs attention */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Needs Attention
                </h3>
                {needsAttention.length > 0 ? (
                  <Badge color="amber">{needsAttention.length}</Badge>
                ) : (
                  <Badge color="green">All good</Badge>
                )}
              </div>

              {needsAttention.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}>
                    <CheckCircle2 size={24} color="var(--primary)" />
                  </div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Everything looks good
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    All active tenants are properly configured.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {needsAttention.slice(0, 5).map(t => (
                    <AttentionItem key={t._id} tenant={t} onClick={goTenants} />
                  ))}
                  {needsAttention.length > 5 && (
                    <button
                      onClick={goTenants}
                      style={{
                        padding: '9px', fontSize: '0.8rem', fontWeight: 700,
                        color: 'var(--primary)', background: 'var(--primary-dim)',
                        border: '1.5px solid var(--border-accent)',
                        borderRadius: 9, cursor: 'pointer',
                      }}
                    >
                      +{needsAttention.length - 5} more — View all tenants →
                    </button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* ── Recently created ───────────────────────────────── */}
          {recent.length > 0 && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                  Recently Created
                </h3>
                <button onClick={goTenants} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700,
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6, transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-dim)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Manage all <ArrowRight size={12} />
                </button>
              </div>
              <div>
                {recent.map((t, i) => (
                  <div key={t._id} style={i === recent.length - 1 ? { borderBottom: 'none' } : {}}>
                    <RecentRow tenant={t} onClick={goTenants} />
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
