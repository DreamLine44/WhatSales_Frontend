import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/AdminContext';
import { adminApi } from '../services/api';
import { WhatsalesLogo } from '../App';
import toast from 'react-hot-toast';
import {
  Users, Plus, RefreshCw, Trash2, Eye, EyeOff, Copy, CheckCircle2,
  LogOut, ChevronDown, ChevronUp, Shield, Wifi, AlertTriangle,
  Building2, Key, Hash, X, Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { BUSINESS_MODES } from '../utils/businessConfig';

// ─── Utility ────────────────────────────────────────────────────────────────
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function statusColor(status) {
  if (!status || status === 'UNKNOWN') return { bg: 'var(--amber-dim)', text: 'var(--amber)' };
  if (status === 'ACTIVE')    return { bg: 'var(--green-dim)',  text: 'var(--green)' };
  if (status === 'PENDING')   return { bg: 'var(--amber-dim)',  text: 'var(--amber)' };
  if (status === 'INACTIVE')  return { bg: 'var(--bg-overlay)', text: 'var(--text-muted)' };
  if (status === 'SUSPENDED') return { bg: 'var(--red-dim)',    text: 'var(--red)' };
  return { bg: 'var(--blue-dim)', text: 'var(--blue)' };
}

// ─── useEscapeKey — shared hook for modal keyboard dismiss ───────────────────
function useEscapeKey(onClose) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);
}

// ─── CopyField ──────────────────────────────────────────────────────────────
function CopyField({ label, value, secret = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {secret && !visible ? '••••••••••••••••' : value}
        </span>
        {secret && (
          <button onClick={() => setVisible(v => !v)} style={iconBtn}>
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={handleCopy} style={{ ...iconBtn, color: copied ? 'var(--green)' : 'var(--text-muted)' }}>
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── NewApiKeyModal ──────────────────────────────────────────────────────────
function NewApiKeyModal({ tenantId, apiKey, onClose }) {
  const [copied, setCopied] = useState(false);
  // Escape key closes this modal
  useEscapeKey(onClose);

  const handleCopy = () => {
    copyToClipboard(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={modalOverlay}>
      {/* FIX: clicking backdrop closes modal */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ ...modalBox, maxWidth: 480, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} color="var(--amber)" />
          </div>
          <div>
            <h3 style={modalTitle}>Save API Key Now</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
              This key is shown <strong style={{ color: 'var(--red)' }}>only once</strong>. Copy and store it securely before closing.
            </p>
          </div>
        </div>

        <CopyField label="Tenant ID" value={tenantId} />
        
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</div>
          <div style={{ background: 'var(--bg-overlay)', border: '2px solid var(--amber)', borderRadius: 8, padding: '10px 12px' }}>
            <code style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all', display: 'block', marginBottom: 10 }}>
              {apiKey}
            </code>
            <button onClick={handleCopy} style={{ ...primaryBtn, background: copied ? 'var(--green)' : 'var(--amber)', width: '100%', justifyContent: 'center' }}>
              {copied ? <><CheckCircle2 size={15} /> Copied!</> : <><Copy size={15} /> Copy API Key</>}
            </button>
          </div>
        </div>

        <button onClick={onClose} style={{ ...primaryBtn, background: 'var(--primary)', width: '100%', justifyContent: 'center' }}>
          I've saved it — Close
        </button>
      </div>
    </div>
  );
}

// ─── CreateTenantModal ───────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', adminPhone: '', businessMode: 'RESTAURANT', // Must match BusinessConfig enum exactly
    whatsappPhoneNumberId: '', whatsappAccessToken: '',
    whatsappBusinessId: '', whatsappVerifyToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [showWA, setShowWA] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Escape key closes modal (only when not submitting)
  useEscapeKey(() => { if (!loading) onClose(); });

  const submit = async () => {
    if (!form.name.trim() || !form.adminPhone.trim()) {
      toast.error('Business name and admin phone are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        adminPhone: form.adminPhone.trim(),
        businessMode: form.businessMode,
      };
      // Backend createTenant only accepts: phoneNumberId, accessToken, apiVersion
      // wabaId and verifyToken must be sent via PATCH /admin/tenants/:id after creation
      if (form.whatsappPhoneNumberId) {
        payload.whatsapp = {
          phoneNumberId: form.whatsappPhoneNumberId,
          ...(form.whatsappAccessToken ? { accessToken: form.whatsappAccessToken } : {}),
        };
      }
      const res = await adminApi.createTenant(payload);
      const tenant = res.data?.tenant;
      // Backend returns apiKey nested inside tenant object: { tenant: { _id, name, status, apiKey } }
      const apiKey  = res.data?.tenant?.apiKey || res.data?.apiKey;
      if (!tenant) throw new Error('Backend did not return tenant data — check server logs');
      if (!apiKey)  throw new Error('Backend did not return an API key — tenant was created, check Railway logs');

      // PATCH additional WhatsApp fields that createTenant ignores (wabaId, verifyToken)
      // Uses whatsapp.wabaId (NOT businessId — that field doesn't exist on backend schema)
      if (tenant._id && (form.whatsappBusinessId || form.whatsappVerifyToken)) {
        try {
          const patchPayload = {};
          if (form.whatsappBusinessId) patchPayload['whatsapp.wabaId']       = form.whatsappBusinessId;
          if (form.whatsappVerifyToken) patchPayload['whatsapp.verifyToken']  = form.whatsappVerifyToken;
          await adminApi.updateTenant(tenant._id, patchPayload);
        } catch {
          // Non-fatal — tenant is created, just extra WA fields not saved
          toast.error('Tenant created but some WhatsApp fields could not be saved — edit the tenant to retry');
        }
      }

      onCreated(tenant, apiKey);
    } catch (err) {
      toast.error(err.message || err.response?.data?.error || err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  // Enter key in any input triggers submit
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !loading) submit(); };

  return (
    <div style={modalOverlay}>
      {/* FIX: backdrop click closes modal only when not loading */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={() => { if (!loading) onClose(); }} />
      <div style={{ ...modalBox, maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={modalTitle}>Create New Tenant</h3>
          {/* FIX: X button disabled while loading */}
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ ...iconBtn, opacity: loading ? 0.4 : 1 }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSt}>Business Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g. Mama's Kitchen" style={{ marginTop: 6 }} />
          </div>
          <div>
            <label style={labelSt}>Admin Phone (WhatsApp) *</label>
            <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} onKeyDown={handleKeyDown} placeholder="+220 7001234" style={{ marginTop: 6, fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={labelSt}>Business Mode</label>
            <select value={form.businessMode} onChange={e => set('businessMode', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <optgroup label="— Full AI Flow (dedicated bot module)">
                {BUSINESS_MODES.filter(m => m.tier === 'full').map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
              <optgroup label="— Basic Flow (standard order flow)">
                {BUSINESS_MODES.filter(m => m.tier === 'basic').map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowWA(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Wifi size={15} />
            {showWA ? 'Hide' : 'Add'} WhatsApp Credentials (optional)
            {showWA ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showWA && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                These can also be added later via tenant settings.
              </div>
              {[
                ['whatsappPhoneNumberId', 'Phone Number ID'],
                ['whatsappAccessToken', 'Access Token'],
                ['whatsappBusinessId', 'Business Account ID'],
                ['whatsappVerifyToken', 'Webhook Verify Token'],
              ].map(([key, lbl]) => (
                <div key={key}>
                  <label style={labelSt}>{lbl}</label>
                  <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '0.82rem' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {/* FIX: Cancel button disabled while loading to prevent mid-flight close */}
          <button onClick={onClose} disabled={loading} style={{ ...ghostBtn, flex: 1, opacity: loading ? 0.4 : 1 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...primaryBtn, flex: 2, justifyContent: 'center' }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><Plus size={15} /> Create Tenant</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditTenantModal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onUpdated }) {
  const tid = tenant.tenantId || tenant._id || '';
  const [form, setForm] = useState({
    name:                  tenant.name || '',
    adminPhone:            tenant.adminPhone || '',
    businessMode:          tenant.businessMode || 'GENERIC',
    description:           tenant.description || '',
    status:                tenant.status || 'ACTIVE',
    whatsappPhoneNumberId: '',
    whatsappAccessToken:   '',
    whatsappBusinessId:    '',
    whatsappVerifyToken:   '',
  });
  const [loading, setLoading] = useState(false);
  const [showWA, setShowWA]   = useState(false);

  // Escape key closes modal
  useEscapeKey(() => { if (!loading) onClose(); });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.adminPhone.trim()) {
      toast.error('Business name and admin phone are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name:         form.name.trim(),
        adminPhone:   form.adminPhone.trim(),
        businessMode: form.businessMode,
        description:  form.description.trim(),
        status:       form.status,
      };
      // Only include whatsapp block if at least one credential field is filled
      if (form.whatsappPhoneNumberId || form.whatsappAccessToken || form.whatsappBusinessId || form.whatsappVerifyToken) {
        payload.whatsapp = {
          ...(form.whatsappPhoneNumberId ? { phoneNumberId: form.whatsappPhoneNumberId } : {}),
          ...(form.whatsappAccessToken   ? { accessToken:   form.whatsappAccessToken   } : {}),
          // Backend updateTenant uses whatsapp.wabaId (not businessId)
          ...(form.whatsappBusinessId    ? { wabaId:      form.whatsappBusinessId    } : {}),
          ...(form.whatsappVerifyToken   ? { verifyToken:   form.whatsappVerifyToken   } : {}),
        };
      }
      const res = await adminApi.updateTenant(tenant._id || tid, payload);
      onUpdated(res.data?.tenant || { ...tenant, ...payload });
      toast.success('Tenant updated');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlay}>
      {/* FIX: backdrop click closes modal only when not loading */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={() => { if (!loading) onClose(); }} />
      <div style={{ ...modalBox, maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={modalTitle}>Edit Tenant</h3>
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ ...iconBtn, opacity: loading ? 0.4 : 1 }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--bg-overlay)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Tenant ID</div>
          <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{tid}</code>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSt}>Business Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mama's Kitchen" style={{ marginTop: 6 }} />
          </div>
          <div>
            <label style={labelSt}>Admin Phone (WhatsApp) *</label>
            <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} placeholder="+220 7001234" style={{ marginTop: 6, fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={labelSt}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description of this business…"
              style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', minHeight: 72 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>Business Mode</label>
              <select value={form.businessMode} onChange={e => set('businessMode', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <optgroup label="— Full AI Flow">
                  {BUSINESS_MODES.filter(m => m.tier === 'full').map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </optgroup>
                <optgroup label="— Basic Flow">
                  {BUSINESS_MODES.filter(m => m.tier === 'basic').map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label style={labelSt}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowWA(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Wifi size={15} />
            {showWA ? 'Hide' : 'Update'} WhatsApp Credentials
            {showWA ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showWA && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: 4 }}>
                ⚠️ Only fill fields you want to update — blank fields are skipped (existing values kept).
              </div>
              {[
                ['whatsappPhoneNumberId', 'Phone Number ID'],
                ['whatsappAccessToken',   'Access Token'],
                ['whatsappBusinessId',    'Business Account ID'],
                ['whatsappVerifyToken',   'Webhook Verify Token'],
              ].map(([key, lbl]) => (
                <div key={key}>
                  <label style={labelSt}>{lbl}</label>
                  <input type="text" value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder="Leave blank to keep existing value"
                    style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '0.82rem' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} disabled={loading} style={{ ...ghostBtn, flex: 1, opacity: loading ? 0.4 : 1 }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ ...primaryBtn, flex: 2, justifyContent: 'center' }}>
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle2 size={15} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── ConfirmModal (local) ────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, loading]);
  if (!open) return null;
  const variantColor = variant === 'danger' ? 'var(--red)' : variant === 'amber' ? 'var(--amber)' : 'var(--primary)';
  const variantBg    = variant === 'danger' ? 'var(--red-dim)' : variant === 'amber' ? 'var(--amber-dim)' : 'var(--primary-dim)';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,12,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => { if (!loading) onClose?.(); }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '28px 28px 24px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: variantBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={20} color={variantColor} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        {message && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 22 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { if (!loading) onClose?.(); }} disabled={loading} style={{ ...ghostBtn, flex: 1, opacity: loading ? 0.5 : 1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: variantColor, color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TenantRow ───────────────────────────────────────────────────────────────
function TenantRow({ tenant, onDeleted, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [regening, setRegening] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const [regenConfirm, setRegenConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const sc = statusColor(tenant.status);

  const regenKey = async () => {
    setRegenConfirm(true);
  };
  const regenKeyConfirmed = async () => {
    setRegenConfirm(false);
    setRegening(true);
    try {
      const res = await adminApi.regenerateKey(tenant._id || tenant.tenantId);
      // Backend returns { apiKey } or { tenant: { apiKey } } depending on version
      const key = res.data?.apiKey || res.data?.tenant?.apiKey;
      if (!key) throw new Error('Backend did not return a new API key');
      setNewKey(key);
      toast.success('API key regenerated');
    } finally {
      setRegening(false);
    }
  };

  const toggleStatus = async () => {
    const next = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminApi.updateTenant(tenant._id || tenant.tenantId, { status: next });
      onUpdated(res.data?.tenant || { ...tenant, status: next });
      toast.success(`Tenant ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteTenant = () => {
    setDeleteConfirm(true);
  };
  const deleteTenantConfirmed = async () => {
    setDeleteConfirm(false);
    setDeleting(true);
    try {
      await adminApi.deleteTenant(tenant._id || tenant.tenantId);
      onDeleted(tenant._id || tenant.tenantId);
      toast.success('Tenant deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const tid = tenant.tenantId || tenant._id || '—';

  return (
    <>
      {newKey && (
        <NewApiKeyModal
          tenantId={tid}
          apiKey={newKey}
          onClose={() => setNewKey(null)}
        />
      )}
      {editing && (
        <EditTenantModal
          tenant={tenant}
          onClose={() => setEditing(false)}
          onUpdated={(updated) => { onUpdated(updated); setEditing(false); }}
        />
      )}
      <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
          onClick={() => setExpanded(v => !v)}
        >
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{tenant.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tid}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>
              {tenant.status || 'UNKNOWN'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.businessMode}</span>
            {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Admin Phone</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.83rem', color: 'var(--text-primary)' }}>{tenant.adminPhone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Mode</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{tenant.businessMode || '—'}</div>
              </div>
            </div>

            <CopyField label="Tenant ID (share with tenant)" value={tid} />

            {tenant.description && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Description</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{tenant.description}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={() => setEditing(true)} style={{ ...primaryBtn, fontSize: '0.8rem', padding: '7px 12px' }}>
                <Hash size={13} /> Edit
              </button>
              <button onClick={toggleStatus} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {tenant.status === 'ACTIVE'
                  ? <><ToggleRight size={14} color="var(--green)" /> Deactivate</>
                  : <><ToggleLeft size={14} color="var(--text-muted)" /> Activate</>}
              </button>
              <button onClick={regenKey} disabled={regening} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {regening ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />}
                Regen API Key
              </button>
              <button onClick={deleteTenant} disabled={deleting} style={{ ...ghostBtn, color: 'var(--red)', borderColor: 'var(--red-dim)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
      {regenConfirm && (
        <ConfirmModal
          open={regenConfirm}
          onClose={() => setRegenConfirm(false)}
          onConfirm={regenKeyConfirmed}
          loading={regening}
          title="Regenerate API Key"
          message="The current API key will stop working immediately. The new key will be shown once."
          confirmLabel="Yes, Regenerate"
          variant="amber"
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          open={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          onConfirm={deleteTenantConfirmed}
          loading={deleting}
          title="Delete Tenant"
          message={`Delete "${tenant.name}"? All data will be permanently removed. This cannot be undone.`}
          confirmLabel="Yes, Delete"
          variant="danger"
        />
      )}
    </>
  );
}

// ─── Main Admin Dashboard ────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [newTenantId, setNewTenantId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listTenants();
      const list = res.data?.tenants || res.data?.data || res.data || [];
      setTenants(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tenants');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleLogout = () => {
    adminLogout();
    navigate('/login');
  };

  const handleCreated = (tenant, apiKey) => {
    // Close create modal FIRST, then show key modal — prevents modal stacking confusion
    setShowCreate(false);
    // Normalise: backend response may omit fields that TenantRow renders.
    // Provide safe defaults so the new row renders correctly immediately.
    const normalised = {
      status:       'ACTIVE',
      businessMode: 'GENERIC',
      adminPhone:   '',
      description:  '',
      ...tenant,
    };
    setTenants(t => [normalised, ...t]);
    setNewTenantId(normalised?.tenantId || normalised?._id || null);
    setNewApiKey(apiKey);
    toast.success(`Tenant "${normalised?.name || 'New tenant'}" created!`);
  };

  // filter handles both tenantId (string UUID) and _id (MongoDB ObjectId)
  const filtered = tenants.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.tenantId || '').toLowerCase().includes(q) ||
      (t._id || '').toLowerCase().includes(q) ||
      (t.adminPhone || '').includes(q)
    );
  });

  const stats = {
    total:    tenants.length,
    active:   tenants.filter(t => t.status === 'ACTIVE').length,
    inactive: tenants.filter(t => t.status !== 'ACTIVE').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Nav */}
      <header style={{ background: 'var(--deep-green)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WhatsalesLogo size={34} light />
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '1rem', letterSpacing: '-0.02em' }}>
              WhatSales
            </span>
            <span style={{ marginLeft: 8, background: 'rgba(255,100,100,0.2)', color: '#ff9999', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,100,100,0.3)', letterSpacing: '0.08em' }}>
              SUPER ADMIN
            </span>
          </div>
        </div>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
          <LogOut size={14} /> Sign out
        </button>
      </header>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield size={20} color="var(--primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Admin Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage tenants, issue credentials, and monitor all accounts.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Tenants', value: stats.total,    color: 'var(--blue)',  bg: 'var(--blue-dim)'  },
            { label: 'Active',        value: stats.active,   color: 'var(--green)', bg: 'var(--green-dim)' },
            { label: 'Inactive',      value: stats.inactive, color: 'var(--amber)', bg: 'var(--amber-dim)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* search input wrapped in a flex container so global `input { width:100% }` 
              style doesn't cause it to overflow the flex row */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, or ID…"
              style={{ width: '100%' }}
            />
          </div>
          <button onClick={fetchTenants} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Plus size={15} /> New Tenant
          </button>
        </div>

        {/* Tenant list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} color="var(--primary)" />
            <div style={{ fontSize: '0.88rem' }}>Loading tenants…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 16 }}>
            <Users size={36} color="var(--border-strong)" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              {search ? 'No tenants match your search' : 'No tenants yet'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              {!search && 'Create your first tenant to get started.'}
            </div>
            {!search && (
              <button onClick={() => setShowCreate(true)} style={{ ...primaryBtn, margin: '0 auto' }}>
                <Plus size={15} /> Create First Tenant
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              {filtered.length} tenant{filtered.length !== 1 ? 's' : ''}{search ? ' matching search' : ''}
            </div>
            {filtered.map(t => (
              <TenantRow
                key={t._id || t.tenantId}
                tenant={t}
                onDeleted={id => setTenants(ts => ts.filter(x => (x._id || x.tenantId) !== id))}
                onUpdated={updated => setTenants(ts => ts.map(x => (x._id || x.tenantId) === (updated._id || updated.tenantId) ? updated : x))}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {newApiKey && (
        <NewApiKeyModal
          tenantId={newTenantId}
          apiKey={newApiKey}
          onClose={() => { setNewApiKey(null); setNewTenantId(null); }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        input { width: 100%; padding: 10px 13px; border: 1.5px solid var(--border); border-radius: 8px;
          font-family: var(--font-body); font-size: 0.9rem; background: var(--bg-surface);
          color: var(--text-primary); outline: none; transition: border-color 0.15s; }
        input:focus { border-color: var(--primary); }
        button { cursor: pointer; font-family: var(--font-body); border: none; }
      `}</style>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
const iconBtn = {
  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  borderRadius: 4, transition: 'color 0.15s',
};
const labelSt = { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' };
const primaryBtn = {
  display: 'flex', alignItems: 'center', gap: 7,
  background: 'var(--primary)', color: '#fff',
  border: 'none', borderRadius: 8, padding: '9px 16px',
  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
  cursor: 'pointer', transition: 'background 0.15s',
};
const ghostBtn = {
  background: 'none', color: 'var(--text-secondary)', border: '1.5px solid var(--border)',
  borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 600,
  fontSize: '0.85rem', cursor: 'pointer',
};
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(10,25,15,0.55)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const modalBox = {
  background: 'var(--bg-surface)', borderRadius: 16, padding: '28px',
  width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1.5px solid var(--border)',
};
const modalTitle = {
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem',
  color: 'var(--text-primary)', letterSpacing: '-0.02em',
};
