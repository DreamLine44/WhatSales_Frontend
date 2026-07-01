import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, Plus, Search, Trash2, Pencil, RefreshCw,
  Wifi, WifiOff, CheckCircle2, Save, ShieldAlert,
  Power, PowerOff, Copy, Check, ChevronDown, ChevronUp,
  Hash, RotateCcw, Eye, EyeOff,
  AlertTriangle, Info,
} from 'lucide-react';
import { adminApi, getModeConfig, useBusinessModes } from '../../api.js';

import {
  PageHeader, Card, Btn, Badge, StatusBadge, EmptyState,
  Spinner, Modal, ConfirmDialog, TypeConfirmDialog, CopyField, Input, Select,
} from '../../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'];
const PLAN_OPTIONS   = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const STATUS_META = {
  ACTIVE:    { color: 'var(--primary)',    desc: 'Bot is live and responding to customers.' },
  PENDING:   { color: 'var(--amber)',      desc: 'Awaiting setup. Bot will not respond.' },
  INACTIVE:  { color: 'var(--text-ghost)', desc: 'Account disabled. Bot will not respond.' },
  SUSPENDED: { color: 'var(--red)',        desc: 'Suspended due to policy or payment issue.' },
};

// [FIX-MODES-DYNAMIC] Business mode options are now fetched live from
// GET /business/modes via the useBusinessModes() hook inside each component
// that needs them (CreateTenantModal, EditTenantModal) — this constant no
// longer hardcodes the list, so a mode added on the backend shows up here
// without a frontend redeploy (Appendix B bug #9).

// ── Tiny copy button ──────────────────────────────────────────────────────────
function CopyBtn({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => toast.error('Copy failed'));
  };
  return (
    <button
      onClick={copy}
      title={`Copy ${label}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        color: copied ? 'var(--primary)' : 'var(--text-ghost)',
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ── One-time reveal box (for newly generated keys) ────────────────────────────
function NewCredentialBox({ label, value, onDone }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error('Copy failed'));
  };

  return (
    <div style={{
      background: 'var(--red-dim)', border: '1.5px solid rgba(220,38,38,0.25)',
      borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <ShieldAlert size={15} color="var(--red)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--red)' }}>
          {label} — shown once only. Copy it now.
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-surface)', borderRadius: 'var(--r-md)',
        border: '1.5px solid var(--border)', padding: '10px 12px',
        marginBottom: 10,
      }}>
        <span style={{
          flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
          color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'nowrap',
          filter: revealed ? 'none' : 'blur(5px)', userSelect: revealed ? 'text' : 'none',
          transition: 'filter 0.2s',
        }}>
          {value}
        </span>
        <button onClick={() => setRevealed(v => !v)} title={revealed ? 'Hide' : 'Reveal'}
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button onClick={copy} title="Copy"
          style={{ color: copied ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <Btn size="sm" variant="soft" onClick={onDone} style={{ width: '100%' }}>
        <Check size={13} /> I've copied this safely — close
      </Btn>
    </div>
  );
}

// ── Create Tenant Modal ───────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreate }) {
  const SUPPORTED_MODES = useBusinessModes();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', adminPhone: '', businessMode: 'RESTAURANT', email: '',
    whatsapp: { phoneNumberId: '', accessToken: '', verifyToken: '', phone: '', webhookSecret: '' },
  });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setWA = (k, v) => setForm(f => ({ ...f, whatsapp: { ...f.whatsapp, [k]: v } }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      // [FIX-CREATE-1] Include email in payload (was being silently dropped)
      const payload = {
        name:         form.name.trim(),
        adminPhone:   form.adminPhone.trim()  || undefined,
        businessMode: form.businessMode,
        email:        form.email.trim()       || undefined,
      };

      // [FIX-CREATE-2] Include all WhatsApp fields including webhookSecret.
      // Only include the block if phoneNumberId is provided; otherwise skip entirely
      // so the backend creates the tenant with empty whatsapp (configurable later).
      if (form.whatsapp.phoneNumberId.trim()) {
        payload.whatsapp = {
          phoneNumberId: form.whatsapp.phoneNumberId.trim(),
          accessToken:   form.whatsapp.accessToken.trim()   || undefined,
          verifyToken:   form.whatsapp.verifyToken.trim()   || undefined,
          phone:         form.whatsapp.phone.trim()         || undefined,
          webhookSecret: form.whatsapp.webhookSecret.trim() || undefined,
        };
      }

      const r = await adminApi.createTenant(payload);

      // Backend returns: { tenant: { _id, name, status, apiKey }, business, next }
      // apiKey lives inside tenant object — shown ONCE ONLY, never stored in DB
      const serverTenant = r.data?.tenant || r.data;
      const apiKey = r.data?.tenant?.apiKey || r.data?.apiKey || null;

      // [FIX-CREATE-5] Build a rich tenant object so the newly-added row in the list
      // has all fields (businessMode, adminPhone, email, plan, whatsapp, onboardingStep).
      // The create endpoint only returns a minimal tenant object — supplement with form data.
      const richTenant = {
        ...serverTenant,
        businessMode:   form.businessMode,
        adminPhone:     form.adminPhone.trim() || undefined,
        email:          form.email.trim()      || undefined,
        plan:           'FREE',
        onboardingStep: form.whatsapp.phoneNumberId.trim() ? 2 : 1,
        createdAt:      new Date().toISOString(),
        whatsapp: form.whatsapp.phoneNumberId.trim() ? {
          phoneNumberId: form.whatsapp.phoneNumberId.trim(),
          phone:         form.whatsapp.phone.trim()        || undefined,
          verifyToken:   form.whatsapp.verifyToken.trim()  || undefined,
          connected:     false,
        } : {},
      };

      setCreated({ tenant: richTenant, apiKey, formWhatsapp: form.whatsapp });
      onCreate(richTenant);
      toast.success(`Tenant "${form.name.trim()}" created`);
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedMode = SUPPORTED_MODES.find(m => m.value === form.businessMode);

  return (
    <Modal onClose={step === 3 && created?.apiKey ? undefined : onClose} maxWidth={520}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>
          {step < 3 ? 'Create Tenant' : '🎉 Tenant Created'}
        </h2>
        {step < 3 && (
          <>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  height: 3, flex: 1, borderRadius: 99,
                  background: s <= step ? 'var(--primary)' : 'var(--border-mid)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Step {step} of 2 — {step === 1 ? 'Business info' : 'WhatsApp credentials (optional)'}
            </p>
          </>
        )}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Business Name *" value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="My Business" autoFocus />
          <Input label="Admin WhatsApp Phone" value={form.adminPhone}
            onChange={e => set('adminPhone', e.target.value)} placeholder="+220 xxx xxxx"
            hint="For order/booking notifications" />
          <Input label="Owner Email (optional)" value={form.email}
            onChange={e => set('email', e.target.value)} placeholder="owner@business.com" type="email" />

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Business Mode
            </label>
            <select value={form.businessMode} onChange={e => set('businessMode', e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                outline: 'none', appearance: 'none', cursor: 'pointer',
              }}>
              {SUPPORTED_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
              ))}
            </select>
            {selectedMode && (
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>{selectedMode.desc}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Btn variant="ghost" fullWidth onClick={onClose}>Cancel</Btn>
            <Btn fullWidth onClick={() => setStep(2)} disabled={!form.name.trim()}>
              Next: WhatsApp →
            </Btn>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
            padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            Optional — leave blank and configure WhatsApp later from the tenant edit panel.
          </div>
          <Input label="Phone Number ID" value={form.whatsapp.phoneNumberId}
            onChange={e => setWA('phoneNumberId', e.target.value)} placeholder="From Meta Business Manager" />
          <Input label="Access Token" value={form.whatsapp.accessToken}
            onChange={e => setWA('accessToken', e.target.value)} placeholder="EAAxxxxxxxx..." type="password" />
          <Input label="Verify Token" value={form.whatsapp.verifyToken}
            onChange={e => setWA('verifyToken', e.target.value)} placeholder="A random secret string" />
          {/* [FIX-CREATE-4] Added webhookSecret field that was missing */}
          <Input label="Webhook Secret (optional)" value={form.whatsapp.webhookSecret}
            onChange={e => setWA('webhookSecret', e.target.value)} placeholder="Secret for webhook signature verification" />
          <Input label="WhatsApp Phone Number" value={form.whatsapp.phone}
            onChange={e => setWA('phone', e.target.value)} placeholder="+220 xxx xxxx" />

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Btn variant="ghost" fullWidth onClick={() => setStep(1)}>← Back</Btn>
            <Btn fullWidth onClick={submit} loading={saving}>Create Tenant</Btn>
          </div>
        </div>
      )}

      {/* Step 3 — Credentials */}
      {step === 3 && created && (
        <div>
          <CopyField label="Tenant ID" value={String(created.tenant._id)} />
          {created.apiKey
            ? <NewCredentialBox label="API Key" value={created.apiKey} onDone={onClose} />
            : (
              <div style={{
                background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
                padding: '12px 14px', marginBottom: 12,
                border: '1.5px solid var(--border-mid)',
              }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  API key was not returned by the server. Check the backend response
                  — it should include <code>apiKey</code> at the top level of the JSON.
                </p>
                <Btn style={{ marginTop: 10 }} onClick={onClose}>Close</Btn>
              </div>
            )
          }
          <CopyField label="Business Name" value={created.tenant.name || ''} />
          {/* [FIX-CREATE-6] richTenant.whatsapp is built from form data so these fields are always available */}
          {created.tenant.whatsapp?.phoneNumberId && (
            <CopyField label="Phone Number ID" value={created.tenant.whatsapp.phoneNumberId} />
          )}
          {created.tenant.whatsapp?.phone && (
            <CopyField label="WhatsApp Number" value={created.tenant.whatsapp.phone} />
          )}
          <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            Status starts as <strong>PENDING</strong>. Open Edit → Status tab to activate this tenant.
          </p>
        </div>
      )}
    </Modal>
  );
}

// ── Regen API Key Modal ───────────────────────────────────────────────────────
function RegenKeyModal({ tenant, onClose, onKeyRegenerated }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [newKey, setNewKey] = useState(null);

  const regen = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      const r = await adminApi.rotateApiKey(tenant._id);
      // [FIX-REGEN-1] Normalise both response shapes: { apiKey } or { tenant: { apiKey } }
      const key = r.data?.apiKey || r.data?.tenant?.apiKey || null;
      if (!key) {
        throw new Error(
          'Server did not return a new API key. Expected { apiKey: "..." } in response.'
        );
      }
      setNewKey(key);
      // [FIX-REGEN-2] Notify parent so it can mark the tenant's keyRotatedAt timestamp if present
      if (onKeyRegenerated) onKeyRegenerated(tenant._id);
      toast.success('API key regenerated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // [FIX-REGEN-3] Once the key is shown, block backdrop-close to force the user to copy it
    <Modal onClose={newKey ? undefined : onClose} maxWidth={480}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
          Regenerate API Key
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{tenant.name}</p>
      </div>

      {!newKey ? (
        <>
          <div style={{
            background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.25)',
            borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--amber)', lineHeight: 1.6 }}>
              <strong>This will invalidate the existing API key immediately.</strong> The tenant
              will be logged out and unable to access their dashboard until they use the new key.
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              I understand the existing key will stop working immediately
            </span>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" fullWidth onClick={onClose} disabled={loading}>Cancel</Btn>
            <Btn
              fullWidth
              variant={confirmed && !loading ? 'amber' : 'ghost'}
              disabled={!confirmed || loading}
              loading={loading}
              onClick={regen}
            >
              <RotateCcw size={14} /> Regenerate Key
            </Btn>
          </div>
        </>
      ) : (
        <NewCredentialBox label="New API Key" value={newKey} onDone={onClose} />
      )}
    </Modal>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant: initialTenant, onClose, onUpdate }) {
  const SUPPORTED_MODES = useBusinessModes();
  const [tab, setTab] = useState('info');
  // [FIX-EDIT-1] Keep a mutable local copy so status changes reflect in the header badge
  const [tenant, setTenant] = useState(initialTenant);
  const [form, setForm] = useState({
    name:         initialTenant.name         || '',
    adminPhone:   initialTenant.adminPhone   || '',
    businessMode: initialTenant.businessMode || 'RESTAURANT',
    plan:         initialTenant.plan         || 'FREE',
    email:        initialTenant.email        || '',
    whatsapp: {
      phone:         initialTenant.whatsapp?.phone         || '',
      phoneNumberId: initialTenant.whatsapp?.phoneNumberId || '',
      accessToken:   '',  // never pre-fill — it's hashed on the server
      verifyToken:   initialTenant.whatsapp?.verifyToken   || '',
      webhookSecret: '',  // never pre-fill — hashed on server
      apiVersion:    initialTenant.whatsapp?.apiVersion    || 'v21.0',
    },
  });
  const [saving, setSaving]             = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [showRegenKey, setShowRegenKey] = useState(false);

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setWA = (k, v) => setForm(f => ({ ...f, whatsapp: { ...f.whatsapp, [k]: v } }));

  // [FIX-EDIT-2] applyUpdate accepts either a patch object or a function (prev => patch).
  // Using setTenant's functional form ensures we always merge from the latest state,
  // not from a stale closure snapshot — critical when saveWA and saveInfo can be
  // called in quick succession.
  const applyUpdate = useCallback((patchOrFn) => {
    setTenant(prev => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(prev) : patchOrFn;
      const merged = { ...prev, ...patch };
      // Schedule onUpdate outside the updater to avoid side-effects during render
      setTimeout(() => onUpdate(merged), 0);
      return merged;
    });
  }, [onUpdate]);

  // [FIX-BUSINESSMODE-1] Appendix B bug #1: businessMode lives on the
  // BusinessConfig document, not on Tenant. PATCH /admin/tenants/:id's field
  // allowlist is ['name','adminPhone','email','plan','notes','whatsapp.*',
  // 'meta.*','limits.*'] — it has NO businessMode field, so sending it there
  // was being silently dropped (200 OK, but the mode never actually changed).
  // Fix: fire two separate requests when businessMode has changed —
  //   1) PATCH /admin/tenants/:id for name/phone/email/plan
  //   2) PUT   /business/:tenantId for businessMode specifically
  // and report success only once both succeed; if either fails, say which one.
  const saveInfo = async () => {
    if (!form.name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    const modeChanged = form.businessMode !== tenant.businessMode;
    let tenantOk = false, tenantErr = null;
    let modeOk   = true,  modeErr   = null; // true when unchanged (nothing to fail)

    try {
      const r = await adminApi.updateTenant(tenant._id, {
        name:       form.name.trim(),
        adminPhone: form.adminPhone.trim() || undefined,
        plan:       form.plan,
        email:      form.email.trim()      || undefined,
      });
      const serverData = r.data?.tenant || {};
      applyUpdate(() => ({
        name:       serverData.name       ?? form.name.trim(),
        adminPhone: serverData.adminPhone ?? form.adminPhone.trim(),
        plan:       serverData.plan       ?? form.plan,
        email:      serverData.email      ?? form.email.trim(),
      }));
      tenantOk = true;
    } catch (err) {
      tenantErr = err.message;
    }

    if (modeChanged) {
      try {
        await adminApi.updateBusinessMode(tenant._id, form.businessMode);
        applyUpdate({ businessMode: form.businessMode });
        modeOk = true;
      } catch (err) {
        modeOk = false;
        modeErr = err.message;
      }
    }

    setSaving(false);

    if (tenantOk && modeOk) {
      toast.success('Business info saved');
    } else if (tenantOk && !modeOk) {
      toast.error(`Business details saved, but Business Mode failed to update — ${modeErr || 'try again'}`);
    } else if (!tenantOk && modeOk) {
      toast.error(`Business Mode saved, but the rest of the business details failed — ${tenantErr || 'try again'}`);
    } else {
      toast.error(tenantErr || 'Failed to save changes');
    }
  };

  const saveWA = async () => {
    setSaving(true);
    try {
      const waPayload = { ...form.whatsapp };
      // [FIX-EDIT-5] Don't send empty strings — they would overwrite existing stored values.
      // verifyToken is plaintext but still stored on the tenant; sending '' would break
      // Meta webhook verification for this tenant.
      if (!waPayload.accessToken)   delete waPayload.accessToken;
      if (!waPayload.webhookSecret) delete waPayload.webhookSecret;
      if (!waPayload.verifyToken)   delete waPayload.verifyToken;

      const r = await adminApi.updateTenant(tenant._id, { whatsapp: waPayload });
      const serverWA = r.data?.tenant?.whatsapp || {};
      // [FIX-EDIT-6] Merge WhatsApp update using functional updater pattern inside applyUpdate.
      // applyUpdate now uses setTenant(prev => ...) so `prev.whatsapp` is always fresh —
      // this avoids the stale-closure bug where tenant.whatsapp captured at render time
      // would clobber fields that were just written by a prior applyUpdate call.
      applyUpdate(prev => ({
        whatsapp: {
          ...prev.whatsapp,
          ...waPayload,
          // Override with whatever the server returned (may include connected status, etc.)
          ...serverWA,
          // Never cache the plaintext tokens in state
          accessToken:   undefined,
          webhookSecret: undefined,
        },
      }));
      toast.success('WhatsApp credentials saved');
      // Clear token fields to prevent accidental re-submission
      setWA('accessToken', '');
      setWA('webhookSecret', '');

      // Credentials are saved. Use the "Verify WhatsApp" button (POST /admin/tenants/:id/verify-whatsapp)
      // to call Meta's API and advance onboardingStep to 3 before activating the tenant.
      toast('Credentials saved. Use "Verify WhatsApp" to confirm credentials with Meta before activating.', { icon: 'ℹ️', duration: 5000 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // POST /admin/tenants/:id/verify-whatsapp
  // Calls Meta API with stored credentials. Sets whatsapp.connected=true and onboardingStep=3 on success.
  // Must be called AFTER saveWA (credentials must already be stored on the tenant).
  const verifyWA = async () => {
    setVerifying(true);
    try {
      const r = await adminApi.verifyWhatsApp(tenant._id);
      const { displayPhone, verifiedName, onboardingStep } = r.data || {};
      applyUpdate(prev => ({
        onboardingStep: onboardingStep || 3,
        whatsapp: { ...prev.whatsapp, connected: true },
      }));
      toast.success(`✅ Verified: ${verifiedName || 'Business'} (${displayPhone || tenant.whatsapp?.phone || ''})`);
    } catch (err) {
      // Provide specific guidance for common Meta API errors
      const msg = err.message || '';
      const isNotFound = msg.toLowerCase().includes('does not exist') || msg.toLowerCase().includes('unsupported get');
      const isPermission = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('oauth');
      let guidance = '';
      if (isNotFound) {
        guidance = ' • The Phone Number ID looks wrong. In Meta Business Manager → WhatsApp → API Setup, copy the numeric Phone Number ID (NOT the WABA ID or App ID).';
      } else if (isPermission) {
        guidance = ' • Access Token may be expired or missing whatsapp_business_messaging permission. Generate a new System User token in Meta Business Manager.';
      }
      toast.error(`Verification failed: ${msg}${guidance}`, { duration: 10000 });
    } finally {
      setVerifying(false);
    }
  };

  // Status update with pre-flight guards matching backend rules
  const updateStatus = async (newStatus) => {
    if (newStatus === tenant.status) return;

    // Guard: SIM_ phoneNumberId blocks activation (backend returns 400)
    if (newStatus === 'ACTIVE') {
      const pid = tenant.whatsapp?.phoneNumberId || '';
      if (pid.startsWith('SIM_')) {
        toast.error('Cannot activate: remove the SIM_ placeholder Phone Number ID first. Set real credentials in the WhatsApp tab.');
        return;
      }

      // [FIX-6] Block activation when no phoneNumberId at all — bot cannot send messages.
      if (!pid) {
        toast.error('Cannot activate: no WhatsApp credentials configured. Use the WhatsApp tab to save Phone Number ID and Access Token, then verify.');
        return;
      }

      // [FIX-5] Block activation when credentials haven't been verified against Meta.
      // Previously this silently force-activated, meaning bots would be set live without
      // verified credentials and then silently fail to respond to every message.
      // Now it hard-blocks: admin must verify first via the WhatsApp tab.
      if ((tenant.onboardingStep ?? 0) < 3 && !tenant.whatsapp?.connected) {
        toast.error(
          'Cannot activate: WhatsApp credentials have not been verified with Meta yet. ' +
          'Go to the WhatsApp tab → Save Credentials → Verify WhatsApp, then activate.',
          { duration: 8000 }
        );
        return;
      }
    }

    setStatusSaving(true);
    try {
      await adminApi.updateStatus(tenant._id, newStatus);
      applyUpdate({ status: newStatus });
      toast.success(`Status updated → ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const tabStyle = (active) => ({
    padding: '7px 14px', border: 'none', cursor: 'pointer',
    fontSize: '0.8rem', fontWeight: 600, borderRadius: 'var(--r-md)',
    background: active ? 'var(--bg-surface)' : 'transparent',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    transition: 'all 0.15s',
  });

  const apiBase    = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';
  // The webhook is a single shared Meta endpoint — /webhook (no tenant ID in path)
  // Backend routes by phoneNumberId in the Meta payload, not by URL segment
  const webhookUrl = `${apiBase}/webhook`;

  return (
    <>
      <Modal onClose={onClose} maxWidth={560}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                {String(tenant._id).slice(0, 20)}…
              </span>
              <CopyBtn value={String(tenant._id)} label="Tenant ID" />
            </div>
          </div>
          <StatusBadge status={tenant.status || 'PENDING'} style={{ flexShrink: 0 }} />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--bg-overlay)',
          borderRadius: 'var(--r-md)', padding: 4, marginBottom: 20,
        }}>
          {[
            { key: 'info',     label: 'Business' },
            { key: 'whatsapp', label: 'WhatsApp' },
            { key: 'status',   label: 'Status' },
            { key: 'security', label: 'Security' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Business Info tab ── */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Business Name *" value={form.name}
              onChange={e => set('name', e.target.value)} />
            <Input label="Admin Phone (WhatsApp)" value={form.adminPhone}
              onChange={e => set('adminPhone', e.target.value)} placeholder="+220 xxx xxxx" />
            {/* [FIX-EDIT-9] Email field in edit modal (was missing) */}
            <Input label="Owner Email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="owner@business.com" type="email" />

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Business Mode
              </label>
              <select value={form.businessMode} onChange={e => set('businessMode', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                  background: 'var(--bg-surface)', color: 'var(--text-primary)',
                  outline: 'none', appearance: 'none', cursor: 'pointer',
                }}>
                {SUPPORTED_MODES.map(m => (
                  <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
                ))}
              </select>
            </div>

            <Select label="Plan" value={form.plan} onChange={e => set('plan', e.target.value)}>
              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>

            <Btn onClick={saveInfo} loading={saving} style={{ alignSelf: 'flex-start' }}>
              <Save size={14} /> Save Changes
            </Btn>
          </div>
        )}

        {/* ── WhatsApp tab ── */}
        {tab === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!tenant.whatsapp?.phoneNumberId && (
              <div style={{
                background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.2)',
                borderRadius: 'var(--r-md)', padding: '10px 14px',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <Info size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--amber)', lineHeight: 1.5 }}>
                  No WhatsApp credentials configured yet. Fill in the fields below to connect this tenant.
                </span>
              </div>
            )}

            {/* [FIX-WA-1] Show current phone number ID as read-only reference if already set */}
            {tenant.whatsapp?.phoneNumberId && (
              <div style={{
                background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                border: '1.5px solid var(--border)',
              }}>
                <Wifi size={13} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1 }}>
                  Currently configured: <strong>{tenant.whatsapp.phoneNumberId}</strong>
                  {tenant.whatsapp.phone && ` · ${tenant.whatsapp.phone}`}
                </span>
                <Badge color={tenant.whatsapp.connected ? 'green' : 'amber'} dot>
                  {tenant.whatsapp.connected ? 'Connected' : 'Not connected'}
                </Badge>
              </div>
            )}

            <Input label="WhatsApp Phone Number" value={form.whatsapp.phone}
              onChange={e => setWA('phone', e.target.value)} placeholder="+220 xxx xxxx" />
            <div>
              <Input label="Phone Number ID" value={form.whatsapp.phoneNumberId}
                onChange={e => setWA('phoneNumberId', e.target.value)} placeholder="e.g. 123456789012345" />
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                ⚠️ Must be the <strong>Phone Number ID</strong> — a long numeric ID from Meta for Developers → WhatsApp → API Setup → "Phone number ID" field. Do NOT use the WABA ID, App ID, or phone number itself.
              </p>
            </div>
            <Input
              label={`Access Token${tenant.whatsapp?.phoneNumberId ? ' (leave blank to keep existing)' : ''}`}
              value={form.whatsapp.accessToken}
              onChange={e => setWA('accessToken', e.target.value)}
              type="password" placeholder="EAAxxxxxxxx..." />
            <Input label="Verify Token" value={form.whatsapp.verifyToken}
              onChange={e => setWA('verifyToken', e.target.value)} />
            {/* [FIX-WA-2] Added webhookSecret field that was missing from edit modal */}
            <Input
              label={`Webhook Secret${tenant.whatsapp?.phoneNumberId ? ' (leave blank to keep existing)' : ''}`}
              value={form.whatsapp.webhookSecret}
              onChange={e => setWA('webhookSecret', e.target.value)}
              placeholder="Secret for webhook signature verification" />
            <Select label="API Version" value={form.whatsapp.apiVersion}
              onChange={e => setWA('apiVersion', e.target.value)}>
              {['v21.0', 'v20.0', 'v19.0', 'v18.0'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </Select>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Btn onClick={saveWA} loading={saving} style={{ alignSelf: 'flex-start' }}>
                <Wifi size={14} /> Save Credentials
              </Btn>
              <Btn
                variant="ghost"
                onClick={verifyWA}
                loading={verifying}
                disabled={!tenant.whatsapp?.phoneNumberId}
                title={!tenant.whatsapp?.phoneNumberId ? 'Save credentials first — click "Save Credentials" before verifying' : 'Call Meta API to verify stored credentials'}
                style={{ alignSelf: 'flex-start' }}
              >
                <CheckCircle2 size={14} /> Verify WhatsApp
              </Btn>
            </div>

            {/* [FIX-WA-3] Show the per-tenant webhook URL for Meta configuration */}
            <div style={{
              borderTop: '1.5px solid var(--border)', paddingTop: 14, marginTop: 4,
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Meta Webhook Configuration
              </div>
              <CopyField label="Webhook URL" value={webhookUrl} />
              {form.whatsapp.verifyToken || tenant.whatsapp?.verifyToken
                ? <CopyField label="Verify Token" value={form.whatsapp.verifyToken || tenant.whatsapp?.verifyToken || ''} />
                : null
              }
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                Configure in Meta for Developers → WhatsApp → Configuration → Webhooks. Subscribe to <strong>messages</strong> events.
              </p>
            </div>
          </div>
        )}

        {/* ── Status tab ── */}
        {tab === 'status' && (
          <div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Only <strong>ACTIVE</strong> tenants have a running bot. Click a status to apply it instantly.
            </p>

            {/* Pre-flight warnings shown inline before user clicks */}
            {(() => {
              const pid = tenant.whatsapp?.phoneNumberId || '';
              const step = tenant.onboardingStep ?? 0;
              if (pid.startsWith('SIM_')) return (
                <div style={{ background: 'var(--red-dim)', border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--red)', lineHeight: 1.5 }}>
                    <strong>SIM_ placeholder credentials detected.</strong> Activation will be blocked by the server. Replace the Phone Number ID with a real Meta value in the WhatsApp tab first.
                  </span>
                </div>
              );
              if (step < 3 && !tenant.whatsapp?.connected) return (
                <div style={{ background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--amber)', lineHeight: 1.5 }}>
                    {/* [FIX-5] Previously said "activating will proceed automatically" — that was incorrect.
                        Activation is now blocked until verification is complete. */}
                    <strong>WhatsApp not yet verified</strong> (step {step}/3). Activation is blocked until credentials are verified with Meta. Go to the <strong>WhatsApp tab → Save Credentials → Verify WhatsApp</strong> first.
                  </span>
                </div>
              );
              if (tenant.whatsapp?.connected || step >= 3) return (
                <div style={{ background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckCircle2 size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', lineHeight: 1.5 }}>
                    WhatsApp credentials verified. Ready to activate.
                  </span>
                </div>
              );
              return null;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATUS_OPTIONS.map(s => {
                const isCurrent = tenant.status === s;
                const meta = STATUS_META[s] || {};
                // Visually warn that ACTIVE may be blocked
                const isBlockedBySimCredential = s === 'ACTIVE' && (tenant.whatsapp?.phoneNumberId || '').startsWith('SIM_');
                return (
                  <button
                    key={s}
                    onClick={() => !isCurrent && !statusSaving && updateStatus(s)}
                    disabled={statusSaving || isCurrent || isBlockedBySimCredential}
                    style={{
                      padding: '12px 16px',
                      border: `1.5px solid ${isBlockedBySimCredential ? 'var(--red)' : isCurrent ? meta.color : 'var(--border-mid)'}`,
                      borderRadius: 'var(--r-md)',
                      cursor: isCurrent || statusSaving || isBlockedBySimCredential ? 'not-allowed' : 'pointer',
                      background: isCurrent ? `${meta.color}14` : 'var(--bg-surface)',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      textAlign: 'left', opacity: statusSaving && !isCurrent ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isCurrent ? meta.color : 'var(--text-primary)', marginBottom: 2 }}>
                        {s}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{meta.desc}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      {statusSaving && !isCurrent && <Spinner size={12} />}
                      {isCurrent && (
                        <Badge color={s === 'ACTIVE' ? 'green' : s === 'PENDING' ? 'amber' : 'gray'}>
                          CURRENT
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Security tab ── */}
        {tab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tenant ID (read-only, immutable) */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Tenant ID
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', padding: '10px 12px',
              }}>
                <Hash size={14} color="var(--text-muted)" />
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {tenant._id}
                </span>
                <CopyBtn value={String(tenant._id)} label="Tenant ID" />
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 5 }}>
                The Tenant ID is the MongoDB document ID — it is permanent and cannot be changed.
              </p>
            </div>

            {/* Regen API Key */}
            <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                API Key
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.55 }}>
                The tenant's API key is stored as a hash and <strong>cannot be revealed</strong>.
                Regenerate it if the tenant has lost their key or it needs rotation.
                The new key is shown <strong>once only</strong> — make sure the tenant saves it immediately.
              </p>
              <Btn
                variant="ghost"
                onClick={() => setShowRegenKey(true)}
                style={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}
              >
                <RotateCcw size={14} /> Regenerate API Key
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {showRegenKey && (
        <RegenKeyModal
          tenant={tenant}
          onClose={() => setShowRegenKey(false)}
          onKeyRegenerated={() => {
            // [FIX-REGEN-4] After key regen, reflect a visual indicator in the parent list
            applyUpdate({ keyRotatedAt: new Date().toISOString() });
          }}
        />
      )}
    </>
  );
}

// ── Tenant Row ────────────────────────────────────────────────────────────────
function TenantRow({ tenant, onUpdate, onDelete }) {
  const [editing, setEditing]                     = useState(false);
  const [confirmDelete, setConfirmDelete]         = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [togglingStatus, setTogglingStatus]       = useState(false);
  const [expanded, setExpanded]                   = useState(false);
  // [FIX-ROW-4] Deactivating a live tenant stops their bot from responding to
  // real customers — this now requires an explicit confirm, not one click.
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  // [FIX-ROW-5] Force-activating an unverified tenant is now a distinct,
  // explicitly-labeled, explicitly-confirmed action instead of a silent
  // auto-force triggered by clicking the same "Activate" toggle.
  const [confirmForceActivate, setConfirmForceActivate] = useState(false);
  // [FIX-ROW-1] Guard against double-tap toggle race: only allow one in-flight toggle at a time
  const togglePending = useRef(false);

  const hasWA       = !!(tenant.whatsapp?.phoneNumberId);
  const isActive    = tenant.status === 'ACTIVE';
  const isSuspended = tenant.status === 'SUSPENDED';
  const modeConfig  = getModeConfig(tenant.businessMode);

  const runStatusChange = async (newStatus, opts = {}) => {
    if (togglePending.current) return;
    togglePending.current = true;
    setTogglingStatus(true);
    try {
      await adminApi.updateStatus(tenant._id, newStatus, opts);
      onUpdate({ ...tenant, status: newStatus });
      toast.success(`${tenant.name || 'Tenant'} → ${newStatus}`);
      if (opts.force) {
        toast('Next step: open Edit → WhatsApp tab → Verify WhatsApp to confirm credentials with Meta.', { icon: 'ℹ️', duration: 7000 });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingStatus(false);
      togglePending.current = false;
    }
  };

  // Quick toggle: ACTIVE ↔ INACTIVE only.
  // Suspended tenants must be changed via Edit → Status (prevents accidental unsuspend).
  const toggleActive = () => {
    if (isSuspended) {
      toast.error('Cannot toggle a suspended tenant. Use Edit → Status to change.');
      return;
    }
    if (togglePending.current) return;

    // Deactivating a currently-live tenant — confirm first, real customers are affected.
    if (isActive) {
      setConfirmDeactivate(true);
      return;
    }

    // Guard: SIM_ phoneNumberId blocks activation (backend returns 400)
    const pid = tenant.whatsapp?.phoneNumberId || '';
    if (pid.startsWith('SIM_')) {
      toast.error('Cannot activate: SIM_ placeholder credentials detected. Set real Meta credentials first via Edit → WhatsApp.');
      return;
    }
    // Not yet verified with Meta — offer the distinct Force Activate path
    // instead of silently sending force:true.
    if ((tenant.onboardingStep ?? 0) < 3 && !tenant.whatsapp?.connected) {
      setConfirmForceActivate(true);
      return;
    }

    runStatusChange('ACTIVE');
  };

  const del = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteTenant(tenant._id);
      onDelete(tenant._id);
      toast.success(`"${tenant.name}" deleted`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div style={{
        background: 'var(--bg-surface)', border: `1.5px solid ${isSuspended ? 'rgba(220,38,38,0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)', marginBottom: 8, overflow: 'hidden',
        boxShadow: 'var(--sh-xs)', transition: 'border-color 0.15s',
      }}>
        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: isSuspended ? 'rgba(220,38,38,0.1)' : 'var(--primary-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: isSuspended ? 'var(--red)' : 'var(--primary)',
            fontSize: '0.9rem',
          }}>
            {(tenant.name || 'T')[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {tenant.name}
              </span>
              <StatusBadge status={tenant.status || 'PENDING'} />
              {tenant.plan && tenant.plan !== 'FREE' && <Badge color="purple">{tenant.plan}</Badge>}
              {modeConfig && (
                <span style={{
                  fontSize: '0.7rem', color: 'var(--text-muted)',
                  background: 'var(--bg-overlay)', borderRadius: 99, padding: '1px 7px',
                }}>
                  {modeConfig.emoji} {modeConfig.label}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.69rem', color: 'var(--text-ghost)', fontFamily: 'var(--font-mono)' }}>
                {tenant._id}
              </span>
              <CopyBtn value={String(tenant._id)} label="Tenant ID" />
              {tenant.adminPhone && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  · {tenant.adminPhone}
                </span>
              )}
            </div>
          </div>

          {/* WA status */}
          <div title={hasWA ? 'WhatsApp configured' : 'WhatsApp not configured'} style={{ flexShrink: 0 }}>
            {hasWA
              ? <Wifi size={16} color={tenant.whatsapp?.connected ? 'var(--primary)' : 'var(--text-muted)'} />
              : <WifiOff size={16} color="var(--text-ghost)" />
            }
          </div>

          {/* Quick activate/deactivate toggle */}
          <button
            onClick={toggleActive}
            disabled={togglingStatus || isSuspended}
            title={isSuspended ? 'Suspended — use Edit → Status to change' : isActive ? 'Click to Deactivate' : 'Click to Activate'}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 'var(--r-md)', border: '1.5px solid',
              cursor: (togglingStatus || isSuspended) ? 'not-allowed' : 'pointer',
              fontSize: '0.74rem', fontWeight: 700, transition: 'all 0.15s',
              borderColor: isActive ? 'var(--primary)' : isSuspended ? 'var(--red)' : 'var(--border-mid)',
              background:  isActive ? 'var(--primary-dim)' : isSuspended ? 'rgba(220,38,38,0.08)' : 'transparent',
              color:       isActive ? 'var(--primary)'     : isSuspended ? 'var(--red)'           : 'var(--text-muted)',
              opacity: togglingStatus ? 0.6 : 1,
            }}
          >
            {togglingStatus
              ? <Spinner size={11} />
              : isActive
                ? <><Power size={11} /> Active</>
                : isSuspended
                  ? 'Suspended'
                  : <><PowerOff size={11} /> Inactive</>
            }
          </button>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)} title="Edit tenant">
              <Pencil size={13} />
            </Btn>
            <Btn variant="ghost" size="sm"
              onClick={() => setConfirmDelete(true)}
              style={{ color: 'var(--red)' }}
              title="Delete tenant">
              <Trash2 size={13} />
            </Btn>
            <button
              onClick={() => setExpanded(v => !v)}
              title="Expand details"
              style={{
                display: 'flex', alignItems: 'center', padding: '6px 6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', borderRadius: 'var(--r-sm)',
              }}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Expanded detail panel */}
        {expanded && (
          <div style={{
            borderTop: '1.5px solid var(--border)', padding: '14px 16px',
            background: 'var(--bg-page)', display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14,
            animation: 'fadeIn 0.15s ease',
          }}>
            <div>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Tenant ID</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {String(tenant._id).slice(0, 16)}…
                <CopyBtn value={String(tenant._id)} label="Tenant ID" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>WhatsApp</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {hasWA
                  ? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      ✓ Configured {tenant.whatsapp?.phone ? `· ${tenant.whatsapp.phone}` : ''}
                      {tenant.whatsapp?.connected ? ' · Live' : ' · Not connected'}
                    </span>
                  : <span style={{ color: 'var(--text-ghost)' }}>Not configured</span>
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Created</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {tenant.createdAt
                  ? new Date(tenant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Plan / Mode</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {tenant.plan || 'FREE'} · {modeConfig?.label || tenant.businessMode || '—'}
              </div>
            </div>
            {/* [FIX-ROW-3] Show email in expanded panel */}
            {tenant.email && (
              <div>
                <div style={{ fontSize: '0.67rem', fontWeight: 800, color: 'var(--text-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tenant.email}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditTenantModal
          tenant={tenant}
          onClose={() => setEditing(false)}
          onUpdate={updated => onUpdate(updated)}
        />
      )}

      {/* [FIX-ROW-4] Deactivate confirm — this stops the live bot for real customers */}
      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setConfirmDeactivate(false); runStatusChange('INACTIVE'); }}
        loading={togglingStatus}
        title={`Deactivate "${tenant.name}"?`}
        message={`This will immediately stop ${tenant.name || 'this tenant'}'s bot from responding to their customers on WhatsApp. Continue?`}
        confirmLabel="Deactivate"
      />

      {/* [FIX-ROW-5] Force Activate — distinct, danger-styled, explicitly confirmed.
          Skips Meta verification; the bot may go "live" without confirmed ability to send messages. */}
      <ConfirmDialog
        open={confirmForceActivate}
        onClose={() => setConfirmForceActivate(false)}
        onConfirm={() => { setConfirmForceActivate(false); runStatusChange('ACTIVE', { force: true }); }}
        loading={togglingStatus}
        title="Force Activate — skip verification?"
        message="This tenant's WhatsApp credentials haven't been verified with Meta yet. Force Activate marks the bot as live anyway, even though we couldn't confirm it can actually send messages. Use this only if you're confident the credentials are correct."
        confirmLabel="Force Activate"
      />

      {/* [FIX-DELETE-1] Type-to-confirm — matches the severity of a 7-collection cascade delete */}
      <TypeConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={del}
        loading={deleting}
        title={`Delete "${tenant.name}"?`}
        message="This permanently deletes the tenant and ALL their data — orders, bookings, sessions, customers, analytics. This cannot be undone."
        matchValue={tenant.name}
        confirmLabel="Delete Permanently"
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTenantsPage() {
  const [tenants, setTenants]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  // [FIX-PAGE-1] Debounce search so we don't hammer the API on every keystroke
  const searchTimer = useRef(null);

  const fetchTenants = useCallback((q, sf) => {
    setLoading(true);
    const params = {};
    if (q?.trim())  params.name   = q.trim();
    if (sf)         params.status = sf;
    adminApi.listTenants(params)
      .then(r => {
        const list = r.data?.tenants;
        setTenants(Array.isArray(list) ? list : []);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTenants('', ''); }, [fetchTenants]);

  // [FIX-PAGE-2] Debounced search — 400ms after user stops typing
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTenants(val, statusFilter), 400);
  };

  const handleStatusFilter = (sf) => {
    setStatusFilter(sf);
    fetchTenants(search, sf);
  };

  // [FIX-PAGE-3] Replace entire tenant object (not just patch) to avoid stale fields
  const handleUpdate = useCallback((updated) =>
    setTenants(ts => ts.map(t => t._id === updated._id ? updated : t)),
  []);

  const handleDelete = useCallback((id) =>
    setTenants(ts => ts.filter(t => t._id !== id)),
  []);

  const handleCreate = useCallback((newT) =>
    setTenants(ts => [newT, ...ts]),
  []);

  const counts = {
    total:     tenants.length,
    active:    tenants.filter(t => t.status === 'ACTIVE').length,
    pending:   tenants.filter(t => t.status === 'PENDING').length,
    suspended: tenants.filter(t => t.status === 'SUSPENDED').length,
  };

  return (
    <div className="fade-in">
      <PageHeader
        icon={Users}
        title="Tenants"
        subtitle={`${counts.total} total · ${counts.active} active · ${counts.pending} pending${counts.suspended ? ` · ${counts.suspended} suspended` : ''}`}
        actions={
          <Btn size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Tenant
          </Btn>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name..."
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
              onClick={() => handleStatusFilter(s)}
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

        <Btn variant="ghost" size="sm" onClick={() => fetchTenants(search, statusFilter)} title="Refresh">
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
            description={search || statusFilter
              ? 'No tenants match your current filters. Try adjusting or clearing them.'
              : 'No tenants yet. Create your first tenant to get started.'}
            action={!search && !statusFilter && (
              <Btn onClick={() => setShowCreate(true)}><Plus size={14} /> Create First Tenant</Btn>
            )}
          />
        </Card>
      ) : (
        <div>
          {tenants.map(t => (
            <TenantRow
              key={t._id}
              tenant={t}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
