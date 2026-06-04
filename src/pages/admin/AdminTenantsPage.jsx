import { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Search, Trash2, Pencil, RefreshCw,
  Wifi, WifiOff, CheckCircle2, X, Save, ShieldAlert,
  Power, PowerOff, Copy, Check, ChevronDown, Eye, EyeOff,
  KeyRound, Hash, Building2,
} from 'lucide-react';
import { adminApi, BUSINESS_MODES, getModeConfig } from '../../api.js';
import {
  PageHeader, Card, Btn, Badge, StatusBadge, EmptyState,
  Spinner, Modal, ConfirmDialog, CopyField, Input, Select,
} from '../../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'];
const PLAN_OPTIONS   = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

// Only the modes actually supported by the backend
const SUPPORTED_MODES = BUSINESS_MODES.filter(m =>
  ['RESTAURANT','BAKERY','SALON','BARBERSHOP','COSMETICS','ELECTRONICS',
   'FASHION','RETAIL','SUPERMARKET','PHARMACY','DELIVERY'].includes(m.value)
);

// ── Quick Copy button ─────────────────────────────────────────────────────────
function CopyBtn({ value, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title={`Copy ${label}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        color: copied ? 'var(--primary)' : 'var(--text-ghost)', display: 'inline-flex', alignItems: 'center',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ── Create Tenant Modal ───────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', adminPhone: '', businessMode: 'RESTAURANT', email: '',
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
      setCreated(r.data);
      onCreate(r.data.tenant);
      toast.success(`Tenant "${form.name}" created`);
      setStep(3);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const selectedMode = SUPPORTED_MODES.find(m => m.value === form.businessMode);

  return (
    <Modal onClose={onClose} maxWidth={520}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
          Create Tenant
        </h2>
        {step < 3 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: 3, flex: 1, borderRadius: 99,
                background: s <= step ? 'var(--primary)' : 'var(--border-mid)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}
        {step < 3 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Step {step} of 2 — {step === 1 ? 'Business info' : 'WhatsApp credentials (optional)'}
          </p>
        )}
      </div>

      {/* Step 1 — Business Info */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Business Name *"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="My Business"
            autoFocus
          />
          <Input
            label="Admin WhatsApp Phone"
            value={form.adminPhone}
            onChange={e => set('adminPhone', e.target.value)}
            placeholder="+220 xxx xxxx"
            hint="For order/booking notifications"
          />
          <Input
            label="Owner Email (optional)"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="owner@business.com"
            type="email"
          />

          {/* Business Mode — custom selector with descriptions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Business Mode
            </label>
            <select
              value={form.businessMode}
              onChange={e => set('businessMode', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {SUPPORTED_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
              ))}
            </select>
            {selectedMode && (
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 5, marginLeft: 2 }}>
                {selectedMode.desc}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="ghost" fullWidth onClick={onClose}>Cancel</Btn>
            <Btn fullWidth onClick={() => setStep(2)} disabled={!form.name.trim()}>
              Next: WhatsApp →
            </Btn>
          </div>
        </div>
      )}

      {/* Step 2 — WhatsApp */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
            padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            Optional — you can leave all fields blank and configure WhatsApp later from the tenant's status tab.
          </div>
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

      {/* Step 3 — Credentials reveal */}
      {step === 3 && created && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
            }}>
              <CheckCircle2 size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>
              Tenant Created!
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Save the credentials below — the API key is only shown once.
            </p>
          </div>

          <div style={{
            background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShieldAlert size={15} color="var(--red)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 600 }}>
              Copy and store this API key now — it cannot be retrieved again.
            </span>
          </div>

          <CopyField label="Tenant ID" value={String(created.tenant._id)} />
          {created.apiKey
            ? <CopyField label="API Key (one-time)" value={created.apiKey} secret />
            : created.tenant?.apiKey
              ? <CopyField label="API Key (one-time)" value={created.tenant.apiKey} secret />
              : null
          }
          <CopyField label="Business Name" value={created.tenant.name} />

          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
            fontSize: '0.78rem', color: 'var(--text-muted)',
          }}>
            Status is <strong>PENDING</strong> — go to the tenant row → Edit → Status tab to activate.
          </div>

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
    businessMode: tenant.businessMode || 'RESTAURANT',
    plan: tenant.plan || 'FREE',
    whatsapp: {
      phone: tenant.whatsapp?.phone || '',
      phoneNumberId: tenant.whatsapp?.phoneNumberId || '',
      accessToken: '',
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
      const r = await adminApi.updateTenant(tenant._id, {
        name: form.name,
        adminPhone: form.adminPhone,
        businessMode: form.businessMode,
        plan: form.plan,
      });
      onUpdate(r.data.tenant);
      toast.success('Updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const saveWA = async () => {
    setSaving(true);
    try {
      const payload = { whatsapp: { ...form.whatsapp } };
      if (!payload.whatsapp.accessToken) delete payload.whatsapp.accessToken;
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

  const STATUS_DESCRIPTIONS = {
    ACTIVE:    'Bot is live and responding to customers.',
    PENDING:   'Awaiting setup. Bot will not respond.',
    INACTIVE:  'Account disabled. Bot will not respond.',
    SUSPENDED: 'Account suspended due to policy or payment.',
  };

  const tabStyle = (active) => ({
    padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    borderRadius: 'var(--r-md)', transition: 'all 0.15s',
  });

  return (
    <Modal onClose={onClose} maxWidth={540}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{tenant.name}</h2>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {tenant._id}
          </div>
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', padding: 4, marginBottom: 20 }}>
        {['info', 'whatsapp', 'status'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>
            {t === 'info' ? 'Business' : t === 'whatsapp' ? 'WhatsApp' : 'Status'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Business Name" value={form.name} onChange={e => set('name', e.target.value)} />
          <Input label="Admin Phone" value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} />

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Business Mode
            </label>
            <select
              value={form.businessMode}
              onChange={e => set('businessMode', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {SUPPORTED_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
              ))}
            </select>
          </div>

          <Select label="Plan" value={form.plan} onChange={e => set('plan', e.target.value)}>
            {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
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
            {['v21.0', 'v20.0', 'v19.0', 'v18.0'].map(v => <option key={v} value={v}>{v}</option>)}
          </Select>
          <Btn onClick={saveWA} loading={saving}><Wifi size={14} /> Save Credentials</Btn>
        </div>
      )}

      {tab === 'status' && (
        <div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Control the tenant's account status. Only <strong>ACTIVE</strong> tenants have a running bot.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STATUS_OPTIONS.map(s => {
              const isCurrent = tenant.status === s;
              return (
                <button
                  key={s}
                  onClick={() => !isCurrent && updateStatus(s)}
                  disabled={statusSaving || isCurrent}
                  style={{
                    padding: '12px 16px',
                    border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--border-mid)'}`,
                    borderRadius: 'var(--r-md)',
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent ? 'var(--primary-dim)' : 'var(--bg-surface)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    textAlign: 'left',
                    opacity: statusSaving ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--text-primary)' }}>{s}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{STATUS_DESCRIPTIONS[s]}</div>
                  </div>
                  {isCurrent && (
                    <Badge color="green" style={{ flexShrink: 0, marginLeft: 8 }}>CURRENT</Badge>
                  )}
                </button>
              );
            })}
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
  const [togglingStatus, setTogglingStatus] = useState(false);

  const hasWA = !!(tenant.whatsapp?.phoneNumberId);
  const modeConfig = getModeConfig(tenant.businessMode);

  const toggleActive = async () => {
    const newStatus = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingStatus(true);
    try {
      await adminApi.updateStatus(tenant._id, newStatus);
      onUpdate({ ...tenant, status: newStatus });
      toast.success(`${tenant.name} → ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingStatus(false);
    }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteTenant(tenant._id);
      onDelete(tenant._id);
      toast.success('Tenant deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const isActive = tenant.status === 'ACTIVE';

  return (
    <>
      <div style={{
        background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
        transition: 'border-color 0.15s',
      }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0,
        }}>
          {(tenant.name || 'T')[0].toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tenant.name}</span>
            <StatusBadge status={tenant.status || 'PENDING'} />
            {tenant.plan && tenant.plan !== 'FREE' && (
              <Badge color="purple">{tenant.plan}</Badge>
            )}
            {modeConfig && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-overlay)', borderRadius: 99, padding: '2px 8px' }}>
                {modeConfig.emoji} {modeConfig.label}
              </span>
            )}
          </div>

          {/* Tenant ID row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)' }}>
              <Hash size={9} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {tenant._id}
            </span>
            <CopyBtn value={String(tenant._id)} label="Tenant ID" />
            {tenant.adminPhone && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                · {tenant.adminPhone}
              </span>
            )}
            {tenant.createdAt && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>
                · {new Date(tenant.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* WA badge */}
        <div title={hasWA ? 'WhatsApp configured' : 'WhatsApp not configured'} style={{ flexShrink: 0 }}>
          {hasWA
            ? <Wifi size={16} color="var(--primary)" />
            : <WifiOff size={16} color="var(--text-ghost)" />
          }
        </div>

        {/* Quick Active/Inactive toggle */}
        <button
          onClick={toggleActive}
          disabled={togglingStatus || tenant.status === 'SUSPENDED'}
          title={
            tenant.status === 'SUSPENDED'
              ? 'Cannot toggle a suspended tenant'
              : isActive ? 'Deactivate tenant' : 'Activate tenant'
          }
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', borderRadius: 'var(--r-md)', border: '1.5px solid',
            cursor: (togglingStatus || tenant.status === 'SUSPENDED') ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
            borderColor: isActive ? 'var(--primary)' : 'var(--border-mid)',
            background: isActive ? 'var(--primary-dim)' : 'transparent',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            opacity: togglingStatus ? 0.6 : 1,
          }}
        >
          {togglingStatus
            ? <Spinner size={12} />
            : isActive
              ? <><Power size={12} /> Active</>
              : <><PowerOff size={12} /> Inactive</>
          }
        </button>

        {/* Edit / Delete */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)} title="Edit tenant">
            <Pencil size={13} />
          </Btn>
          <Btn
            variant="ghost" size="sm"
            onClick={() => setConfirmDelete(true)}
            style={{ color: 'var(--red)' }}
            title="Delete tenant"
          >
            <Trash2 size={13} />
          </Btn>
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

  const fetchTenants = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.name = search;
    if (statusFilter) params.status = statusFilter;
    adminApi.listTenants(params)
      .then(r => setTenants(r.data.tenants || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleUpdate = (updated) =>
    setTenants(ts => ts.map(t => t._id === updated._id ? { ...t, ...updated } : t));
  const handleDelete = (id) => setTenants(ts => ts.filter(t => t._id !== id));
  const handleCreate = (newT) => setTenants(ts => [newT, ...ts]);

  const activeTenants   = tenants.filter(t => t.status === 'ACTIVE').length;
  const pendingTenants  = tenants.filter(t => t.status === 'PENDING').length;

  return (
    <div className="fade-in">
      <PageHeader
        icon={Users}
        title="Tenants"
        subtitle={`${tenants.length} total · ${activeTenants} active · ${pendingTenants} pending`}
        actions={
          <Btn size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Tenant
          </Btn>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tenants..."
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '7px 13px', borderRadius: 99, border: '1.5px solid', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
                borderColor: statusFilter === s ? 'var(--primary)' : 'var(--border-mid)',
                background: statusFilter === s ? 'var(--primary-dim)' : 'transparent',
                color: statusFilter === s ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <Btn variant="ghost" size="sm" onClick={fetchTenants} title="Refresh">
          <RefreshCw size={14} />
        </Btn>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Spinner size={32} />
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No tenants found"
            description={search || statusFilter ? 'Try adjusting your filters.' : 'Create your first tenant to get started.'}
            action={!search && !statusFilter && (
              <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> Create First Tenant</Btn>
            )}
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
