import { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Search, Trash2, Pencil, RefreshCw, ChevronDown, ChevronUp,
  Wifi, WifiOff, Eye, EyeOff, Copy, CheckCircle2, X, Save, ShieldAlert,
} from 'lucide-react';
import { adminApi, BUSINESS_MODES } from '../../api.js';
import { PageHeader, Card, Btn, Badge, StatusBadge, EmptyState, Spinner, Modal, ConfirmDialog, CopyField, Input, Select } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'];
const PLAN_OPTIONS   = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

// ── Create Tenant Modal ───────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', adminPhone: '', businessMode: 'RESTAURANT',
    email: '',
    whatsapp: { phoneNumberId: '', accessToken: '', verifyToken: '', phone: '' },
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setWA = (key, val) => setForm(f => ({ ...f, whatsapp: { ...f.whatsapp, [key]: val } }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      const r = await adminApi.createTenant({
        name: form.name.trim(),
        adminPhone: form.adminPhone || undefined,
        businessMode: form.businessMode,
        whatsapp: form.whatsapp.phoneNumberId ? form.whatsapp : undefined,
      });
      const data = r.data;
      setCreated(data);
      onCreate(data.tenant);
      toast.success(`Tenant "${form.name}" created`);
      setStep(3);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} maxWidth={520}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Create Tenant</h2>
        {step < 3 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {[1,2].map(s => (
              <div key={s} style={{ height: 3, flex: 1, borderRadius: 99, background: s <= step ? 'var(--primary)' : 'var(--border-mid)' }} />
            ))}
          </div>
        )}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Business Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="My Business" />
          <Input label="Admin WhatsApp Phone" value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} placeholder="+220 xxx xxxx" hint="For order/booking notifications" />
          <Input label="Owner Email (optional)" value={form.email} onChange={e => set('email', e.target.value)} placeholder="owner@business.com" type="email" />
          <Select label="Business Mode" value={form.businessMode} onChange={e => set('businessMode', e.target.value)}>
            {BUSINESS_MODES.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>)}
          </Select>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="ghost" fullWidth onClick={onClose}>Cancel</Btn>
            <Btn fullWidth onClick={() => setStep(2)} disabled={!form.name.trim()}>Next: WhatsApp →</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Optional: Pre-configure WhatsApp credentials now, or leave blank to set later.
          </p>
          <Input label="Phone Number ID" value={form.whatsapp.phoneNumberId} onChange={e => setWA('phoneNumberId', e.target.value)} placeholder="From Meta Business Manager" />
          <Input label="Access Token" value={form.whatsapp.accessToken} onChange={e => setWA('accessToken', e.target.value)} placeholder="EAAxxxxxxxx..." type="password" />
          <Input label="Verify Token" value={form.whatsapp.verifyToken} onChange={e => setWA('verifyToken', e.target.value)} placeholder="A random secret string" />
          <Input label="WhatsApp Phone Number" value={form.whatsapp.phone} onChange={e => setWA('phone', e.target.value)} placeholder="+220 xxx xxxx" />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="ghost" fullWidth onClick={() => setStep(1)}>← Back</Btn>
            <Btn fullWidth onClick={submit} loading={saving}>Create Tenant</Btn>
          </div>
        </div>
      )}

      {step === 3 && created && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle2 size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Tenant Created!</h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Save the API key — it's only shown once.</p>
          </div>
          <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={15} color="var(--red)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600 }}>Copy and store this API key now — it cannot be retrieved again.</span>
          </div>
          <CopyField label="Tenant ID" value={String(created.tenant._id)} />
          {created.tenant.apiKey && <CopyField label="API Key (one-time)" value={created.tenant.apiKey} secret />}
          <CopyField label="Business Name" value={created.tenant.name} />
          <div style={{ marginTop: 16 }}>
            <Btn fullWidth onClick={onClose}>Done</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onUpdate }) {
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({
    name: tenant.name || '',
    adminPhone: tenant.adminPhone || '',
    plan: tenant.plan || 'FREE',
    whatsapp: {
      phone: tenant.whatsapp?.phone || '',
      phoneNumberId: tenant.whatsapp?.phoneNumberId || '',
      accessToken: '',  // never pre-fill for security
      verifyToken: tenant.whatsapp?.verifyToken || '',
      apiVersion: tenant.whatsapp?.apiVersion || 'v21.0',
    },
  });
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setWA = (key, val) => setForm(f => ({ ...f, whatsapp: { ...f.whatsapp, [key]: val } }));

  const saveInfo = async () => {
    setSaving(true);
    try {
      const payload = { name: form.name, adminPhone: form.adminPhone, plan: form.plan };
      const r = await adminApi.updateTenant(tenant._id, payload);
      onUpdate(r.data.tenant);
      toast.success('Updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const saveWA = async () => {
    setSaving(true);
    try {
      const payload = { whatsapp: form.whatsapp };
      const r = await adminApi.updateTenant(tenant._id, payload);
      onUpdate(r.data.tenant);
      toast.success('WhatsApp credentials updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (status) => {
    setStatusSaving(true);
    try {
      await adminApi.updateStatus(tenant._id, status);
      onUpdate({ ...tenant, status });
      toast.success(`Status → ${status}`);
    } catch (err) { toast.error(err.message); }
    finally { setStatusSaving(false); }
  };

  const tabStyle = (active) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600,
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
  });

  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{tenant.name}</h2>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 20 }}>
        {['info','whatsapp','status'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'info' ? 'Business' : t === 'whatsapp' ? 'WhatsApp' : 'Status'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Business Name" value={form.name} onChange={e => set('name', e.target.value)} />
          <Input label="Admin Phone" value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} />
          <Select label="Plan" value={form.plan} onChange={e => set('plan', e.target.value)}>
            {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {tenant._id}</div>
          <Btn onClick={saveInfo} loading={saving}><Save size={14} /> Save Info</Btn>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="WhatsApp Phone Number" value={form.whatsapp.phone} onChange={e => setWA('phone', e.target.value)} placeholder="+220 xxx xxxx" />
          <Input label="Phone Number ID" value={form.whatsapp.phoneNumberId} onChange={e => setWA('phoneNumberId', e.target.value)} />
          <Input label="Access Token (leave blank to keep existing)" value={form.whatsapp.accessToken} onChange={e => setWA('accessToken', e.target.value)} type="password" placeholder="EAAxxxxxxxx..." />
          <Input label="Verify Token" value={form.whatsapp.verifyToken} onChange={e => setWA('verifyToken', e.target.value)} />
          <Select label="API Version" value={form.whatsapp.apiVersion} onChange={e => setWA('apiVersion', e.target.value)}>
            {['v21.0','v20.0','v19.0','v18.0'].map(v => <option key={v} value={v}>{v}</option>)}
          </Select>
          <Btn onClick={saveWA} loading={saving}><Wifi size={14} /> Save Credentials</Btn>
        </div>
      )}

      {tab === 'status' && (
        <div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Change the tenant's account status. Active = bot running. Pending = awaiting setup. Suspended = access blocked.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={statusSaving || tenant.status === s}
                style={{
                  padding: '12px 16px', border: `1.5px solid ${tenant.status === s ? 'var(--primary)' : 'var(--border-mid)'}`,
                  borderRadius: 'var(--radius-md)', cursor: tenant.status === s ? 'default' : 'pointer',
                  background: tenant.status === s ? 'var(--primary-dim)' : 'var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '0.875rem', fontWeight: 600, color: tenant.status === s ? 'var(--primary)' : 'var(--text-primary)',
                  opacity: statusSaving ? 0.6 : 1,
                }}
              >
                {s}
                {tenant.status === s && <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>CURRENT</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Tenant Row ────────────────────────────────────────────────────────────────
function TenantRow({ tenant, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasWA = !!(tenant.whatsapp?.phoneNumberId);

  const del = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteTenant(tenant._id);
      onDelete(tenant._id);
      toast.success('Tenant deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  return (
    <>
      <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
          {(tenant.name || 'T')[0].toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tenant.name}</span>
            <StatusBadge status={tenant.status || 'PENDING'} />
            {tenant.plan && tenant.plan !== 'FREE' && (
              <Badge color="purple">{tenant.plan}</Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {tenant.adminPhone && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tenant.adminPhone}</span>}
            {tenant.createdAt && <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* WA badge */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div title={hasWA ? 'WhatsApp configured' : 'WhatsApp not configured'}>
            {hasWA ? <Wifi size={16} color="var(--primary)" /> : <WifiOff size={16} color="var(--text-ghost)" />}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--red)' }}><Trash2 size={13} /></Btn>
        </div>
      </div>

      {editing && (
        <EditTenantModal
          tenant={tenant}
          onClose={() => setEditing(false)}
          onUpdate={updated => { onUpdate(updated); setEditing(false); }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={del}
        loading={deleting}
        title={`Delete "${tenant.name}"?`}
        message="This will permanently delete the tenant and ALL associated data (orders, bookings, sessions, customers). This action cannot be undone."
        confirmLabel="Delete Permanently"
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.name = search;
    if (statusFilter) params.status = statusFilter;
    adminApi.listTenants(params)
      .then(r => setTenants(r.data.tenants || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUpdate = (updated) => setTenants(ts => ts.map(t => t._id === updated._id ? { ...t, ...updated } : t));
  const handleDelete = (id) => setTenants(ts => ts.filter(t => t._id !== id));
  const handleCreate = (newT) => setTenants(ts => [newT, ...ts]);

  return (
    <div className="fade-in">
      <PageHeader
        icon={Users}
        title="Tenants"
        subtitle={`${tenants.length} total`}
        actions={
          <Btn size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Tenant
          </Btn>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '8px 14px', borderRadius: 99, border: '1.5px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border-mid)',
                background: statusFilter === s ? 'var(--primary-dim)' : 'transparent',
                color: statusFilter === s ? 'var(--primary)' : 'var(--text-secondary)',
              }}>
              {s || 'All'}
            </button>
          ))}
        </div>
        <Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /></Btn>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>
      ) : tenants.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No tenants found"
            description={search || statusFilter ? 'Try adjusting your filters.' : 'Create your first tenant to get started.'}
            action={!search && !statusFilter && <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> Create First Tenant</Btn>}
          />
        </Card>
      ) : (
        <div>
          {tenants.map(t => (
            <TenantRow key={t._id} tenant={t} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTenantModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
