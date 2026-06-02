/**
 * AdminDashboardPage — redesigned with a step-by-step Create Tenant wizard.
 * 
 * Wizard steps:
 *   Step 1: Business Info (name, phone, mode) 
 *   Step 2: WhatsApp Credentials (phoneNumberId, accessToken, verifyToken)
 *   Step 3: Review & Create
 *   Step 4: Success — copy API key
 */
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
  ArrowRight, ArrowLeft, Check, Phone, Zap, Package, MessageSquare,
  Utensils, Scissors, Shirt, Cpu, ShoppingBag, Info, Star,
} from 'lucide-react';
import { BUSINESS_MODES } from '../utils/businessConfig';

// ─── Utility ────────────────────────────────────────────────────────────────
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
}

function statusColor(status) {
  if (!status || status === 'UNKNOWN') return { bg: 'var(--amber-dim)', text: 'var(--amber)' };
  if (status === 'ACTIVE')    return { bg: 'var(--green-dim)',  text: 'var(--green)' };
  if (status === 'PENDING')   return { bg: 'var(--amber-dim)',  text: 'var(--amber)' };
  if (status === 'INACTIVE')  return { bg: 'var(--bg-overlay)', text: 'var(--text-muted)' };
  if (status === 'SUSPENDED') return { bg: 'var(--red-dim)',    text: 'var(--red)' };
  return { bg: 'var(--blue-dim)', text: 'var(--blue)' };
}

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
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
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

// ─── SuccessModal — Step 4 ────────────────────────────────────────────────
function SuccessModal({ tenant, apiKey, onClose }) {
  const [copied, setCopied] = useState('');
  useEscapeKey(onClose);
  const tid = tenant?.tenantId || tenant?._id || '';

  const handleCopy = (text, key) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2500);
  };

  const shareMessage = `Hi! Your WhatSales business dashboard is ready.

Business: ${tenant?.name}
Tenant ID: ${tid}
API Key: ${apiKey}

Sign in at: ${window.location.origin}/login
Use your Tenant ID and API Key to access your dashboard.`;

  return (
    <div style={modalOverlay}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ ...modalBox, maxWidth: 520, position: 'relative', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        {/* Success icon */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-dim)', border: '3px solid rgba(25,163,72,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={32} color="var(--green)" strokeWidth={2.5} />
        </div>
        <h3 style={{ ...modalTitle, fontSize: '1.3rem', marginBottom: 6 }}>Tenant Created! 🎉</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{tenant?.name}</strong> is now set up.
          Share the credentials below — the API key is shown <strong style={{ color: 'var(--red)' }}>only once</strong>.
        </p>

        <div style={{ textAlign: 'left', marginBottom: 20 }}>
          <CopyField label="Tenant ID" value={tid} />
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>API Key</div>
            <div style={{ background: 'var(--bg-overlay)', border: '2px solid var(--amber)', borderRadius: 8, padding: '10px 12px' }}>
              <code style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all', display: 'block', marginBottom: 10 }}>
                {apiKey}
              </code>
              <button
                onClick={() => handleCopy(apiKey, 'key')}
                style={{ ...primaryBtn, background: copied === 'key' ? 'var(--green)' : 'var(--amber)', width: '100%', justifyContent: 'center' }}
              >
                {copied === 'key' ? <><CheckCircle2 size={15} /> Copied!</> : <><Copy size={15} /> Copy API Key</>}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share with tenant</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre', overflow: 'auto', marginBottom: 8, lineHeight: 1.6 }}>
            {shareMessage}
          </div>
          <button
            onClick={() => handleCopy(shareMessage, 'share')}
            style={{ ...ghostBtn, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
          >
            {copied === 'share' ? <><CheckCircle2 size={13} /> Copied!</> : <><Copy size={13} /> Copy Onboarding Message</>}
          </button>
        </div>

        <button onClick={onClose} style={{ ...primaryBtn, background: 'var(--primary)', width: '100%', justifyContent: 'center' }}>
          Done — I've saved the credentials
        </button>
      </div>
    </div>
  );
}

// ─── Business Mode Picker ────────────────────────────────────────────────────
function ModePicker({ value, onChange }) {
  const fullModes = BUSINESS_MODES.filter(m => m.tier === 'full');
  const basicModes = BUSINESS_MODES.filter(m => m.tier === 'basic');

  return (
    <div>
      {/* Full AI */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Zap size={12} color="var(--primary)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Full AI Flow</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— dedicated smart bot</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {fullModes.map(m => (
            <div
              key={m.value}
              onClick={() => onChange(m.value)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${value === m.value ? 'var(--primary)' : 'var(--border)'}`,
                background: value === m.value ? 'var(--primary-dim)' : 'var(--bg-overlay)',
                transition: 'all 0.12s',
              }}
            >
              <div style={{ fontSize: '0.88rem', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{m.desc}</div>
              {value === m.value && <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700 }}>✓ Selected</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Basic */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Package size={12} color="var(--text-muted)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Basic Flow</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— standard ordering</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {basicModes.map(m => (
            <div
              key={m.value}
              onClick={() => onChange(m.value)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${value === m.value ? 'var(--primary)' : 'var(--border)'}`,
                background: value === m.value ? 'var(--primary-dim)' : 'var(--bg-overlay)',
                transition: 'all 0.12s', opacity: 0.85,
              }}
            >
              <div style={{ fontSize: '0.88rem', marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{m.desc}</div>
              {value === m.value && <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700 }}>✓ Selected</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < steps.length - 1 ? undefined : undefined }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--bg-overlay)',
                border: `2px solid ${done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--border)'}`,
                color: done || active ? '#fff' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: active ? 'var(--primary)' : done ? 'var(--green)' : 'var(--text-muted)', marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? 'var(--green)' : 'var(--border)', margin: '0 6px', marginBottom: 20, transition: 'background 0.2s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── CreateTenantWizard ──────────────────────────────────────────────────────
function CreateTenantWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(0); // 0=Business, 1=WhatsApp, 2=Review
  const [form, setForm] = useState({
    name: '', adminPhone: '', businessMode: 'RESTAURANT',
    whatsappPhoneNumberId: '', whatsappAccessToken: '',
    whatsappBusinessId: '', whatsappVerifyToken: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEscapeKey(() => { if (!loading) onClose(); });

  const STEPS = ['Business Info', 'WhatsApp', 'Review & Create'];

  const selectedMode = BUSINESS_MODES.find(m => m.value === form.businessMode);

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
      if (form.whatsappPhoneNumberId) {
        payload.whatsapp = {
          phoneNumberId: form.whatsappPhoneNumberId,
          ...(form.whatsappAccessToken ? { accessToken: form.whatsappAccessToken } : {}),
        };
      }
      const res = await adminApi.createTenant(payload);
      const tenant = res.data?.tenant;
      const apiKey = res.data?.tenant?.apiKey || res.data?.apiKey;
      if (!tenant) throw new Error('Backend did not return tenant data');
      if (!apiKey) throw new Error('Backend did not return an API key');

      // PATCH additional WA fields
      if (tenant._id && (form.whatsappBusinessId || form.whatsappVerifyToken)) {
        try {
          const patch = {};
          if (form.whatsappBusinessId) patch['whatsapp.wabaId'] = form.whatsappBusinessId;
          if (form.whatsappVerifyToken) patch['whatsapp.verifyToken'] = form.whatsappVerifyToken;
          await adminApi.updateTenant(tenant._id, patch);
        } catch {
          toast.error('Tenant created but some WhatsApp fields could not be saved');
        }
      }
      onCreated(tenant, apiKey);
    } catch (err) {
      toast.error(err.message || err.response?.data?.error || err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const hasWA = form.whatsappPhoneNumberId || form.whatsappAccessToken;

  return (
    <div style={modalOverlay}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={() => { if (!loading) onClose(); }} />
      <div style={{ ...modalBox, maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={modalTitle}>Create New Tenant</h3>
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ ...iconBtn, opacity: loading ? 0.4 : 1 }}><X size={18} /></button>
        </div>

        <StepIndicator current={step} steps={STEPS} />

        {/* ── STEP 0: Business Info ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '12px 14px', background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--border-accent)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Step 1:</strong> Enter the business basics. The bot uses these in every customer interaction.
            </div>
            <div>
              <label style={labelSt}>Business Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mama's Kitchen" style={{ marginTop: 6 }} autoFocus />
            </div>
            <div>
              <label style={labelSt}>Admin Phone (WhatsApp number) *</label>
              <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} placeholder="+220 7001234" style={{ marginTop: 6, fontFamily: 'monospace' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                This is the owner's number that receives order notifications.
              </div>
            </div>
            <div>
              <label style={labelSt}>Business Type / Mode *</label>
              <div style={{ marginTop: 10 }}>
                <ModePicker value={form.businessMode} onChange={v => set('businessMode', v)} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: WhatsApp ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 14px', background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--border-accent)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Step 2: Connect WhatsApp</strong> — This is what makes the bot actually work.
              Get these from <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Meta Developer Console</a>.
              You can skip and add later via Edit.
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Where to find these:
              </div>
              {[
                { label: '📱 Phone Number ID', hint: 'Meta Console → WhatsApp → API Setup → Phone number ID' },
                { label: '🔑 Access Token', hint: 'Meta Console → WhatsApp → API Setup → Temporary / Permanent token' },
                { label: '🏢 Business Account ID', hint: 'Meta Console → WhatsApp → API Setup → WhatsApp Business Account ID' },
                { label: '🔒 Verify Token', hint: 'Any secure string you choose — paste the same into Meta webhook config' },
              ].map((item, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700 }}>{item.label}:</span> {item.hint}
                </div>
              ))}
            </div>

            {[
              ['whatsappPhoneNumberId', 'Phone Number ID', 'From Meta → WhatsApp → API Setup', false],
              ['whatsappAccessToken', 'Access Token', 'Permanent token recommended', true],
              ['whatsappBusinessId', 'Business Account ID (WABA ID)', 'Optional — for advanced features', false],
              ['whatsappVerifyToken', 'Webhook Verify Token', 'Any secret string — copy to Meta webhook config', false],
            ].map(([key, lbl, hint, secret]) => (
              <div key={key}>
                <label style={labelSt}>{lbl}</label>
                {hint && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 4 }}>{hint}</div>}
                <input
                  type={secret ? 'password' : 'text'}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="Leave blank to configure later"
                  style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                />
              </div>
            ))}

            {!hasWA && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--amber-dim)', border: '1px solid rgba(184,109,0,0.2)', borderRadius: 8 }}>
                <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--amber)', lineHeight: 1.5 }}>
                  Without WhatsApp credentials, the bot won't reply to customers. You can add these later via the tenant's Edit panel.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 14px', background: 'var(--primary-dim)', borderRadius: 10, border: '1px solid var(--border-accent)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Step 3: Review & Create</strong> — Double-check everything before creating.
            </div>

            <div style={{ background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Business */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Business Info</div>
                <ReviewRow label="Name" value={form.name || '—'} />
                <ReviewRow label="Admin Phone" value={form.adminPhone || '—'} />
                <ReviewRow label="Business Mode" value={selectedMode ? `${selectedMode.label} (${selectedMode.tier === 'full' ? 'Full AI' : 'Basic'})` : form.businessMode} last />
              </div>
              {/* WhatsApp */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>WhatsApp Connection</div>
                {form.whatsappPhoneNumberId ? (
                  <>
                    <ReviewRow label="Phone Number ID" value={form.whatsappPhoneNumberId} mono />
                    <ReviewRow label="Access Token" value={form.whatsappAccessToken ? '••••••••••' : 'Not set'} />
                    <ReviewRow label="Business ID" value={form.whatsappBusinessId || 'Not set'} />
                    <ReviewRow label="Verify Token" value={form.whatsappVerifyToken || 'Not set'} last />
                  </>
                ) : (
                  <div style={{ fontSize: '0.83rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} /> WhatsApp not configured — can be added via Edit after creation.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} disabled={loading} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ ...ghostBtn, opacity: loading ? 0.4 : 1 }}>
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button
              onClick={() => {
                if (step === 0 && (!form.name.trim() || !form.adminPhone.trim())) {
                  toast.error('Business name and phone are required');
                  return;
                }
                setStep(s => s + 1);
              }}
              style={{ ...primaryBtn, justifyContent: 'center', gap: 7 }}
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={submit} disabled={loading} style={{ ...primaryBtn, justifyContent: 'center', minWidth: 140 }}>
              {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><Check size={15} /> Create Tenant</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, mono, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined }}>{value}</span>
    </div>
  );
}

// ─── EditTenantModal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onUpdated }) {
  const tid = tenant.tenantId || tenant._id || '';
  const [form, setForm] = useState({
    name: tenant.name || '', adminPhone: tenant.adminPhone || '',
    businessMode: tenant.businessMode || 'GENERIC', description: tenant.description || '',
    status: tenant.status || 'ACTIVE',
    whatsappPhoneNumberId: '', whatsappAccessToken: '',
    whatsappBusinessId: '', whatsappVerifyToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [showWA, setShowWA] = useState(false);
  useEscapeKey(() => { if (!loading) onClose(); });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.adminPhone.trim()) { toast.error('Name and phone required'); return; }
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), adminPhone: form.adminPhone.trim(), businessMode: form.businessMode, description: form.description.trim(), status: form.status };
      if (form.whatsappPhoneNumberId || form.whatsappAccessToken || form.whatsappBusinessId || form.whatsappVerifyToken) {
        payload.whatsapp = {
          ...(form.whatsappPhoneNumberId ? { phoneNumberId: form.whatsappPhoneNumberId } : {}),
          ...(form.whatsappAccessToken   ? { accessToken:   form.whatsappAccessToken   } : {}),
          ...(form.whatsappBusinessId    ? { wabaId:        form.whatsappBusinessId    } : {}),
          ...(form.whatsappVerifyToken   ? { verifyToken:   form.whatsappVerifyToken   } : {}),
        };
      }
      const res = await adminApi.updateTenant(tenant._id || tid, payload);
      onUpdated(res.data?.tenant || { ...tenant, ...payload });
      toast.success('Tenant updated');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={() => { if (!loading) onClose(); }} />
      <div style={{ ...modalBox, maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={modalTitle}>Edit Tenant</h3>
          <button onClick={() => { if (!loading) onClose(); }} disabled={loading} style={{ ...iconBtn, opacity: loading ? 0.4 : 1 }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--bg-overlay)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Tenant ID</div>
          <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{tid}</code>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSt}>Business Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={{ marginTop: 6 }} />
          </div>
          <div>
            <label style={labelSt}>Admin Phone *</label>
            <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} style={{ marginTop: 6, fontFamily: 'monospace' }} />
          </div>
          <div>
            <label style={labelSt}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', minHeight: 60 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt}>Business Mode</label>
              <select value={form.businessMode} onChange={e => set('businessMode', e.target.value)} style={{ marginTop: 6, width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-body)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                <optgroup label="Full AI Flow">
                  {BUSINESS_MODES.filter(m => m.tier === 'full').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </optgroup>
                <optgroup label="Basic Flow">
                  {BUSINESS_MODES.filter(m => m.tier === 'basic').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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

          <button type="button" onClick={() => setShowWA(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Wifi size={15} /> {showWA ? 'Hide' : 'Update'} WhatsApp Credentials
            {showWA ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showWA && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: 4 }}>
                ⚠️ Only fill fields you want to update — blank fields keep existing values.
              </div>
              {[
                ['whatsappPhoneNumberId', 'Phone Number ID', false],
                ['whatsappAccessToken', 'Access Token', true],
                ['whatsappBusinessId', 'Business Account ID (WABA ID)', false],
                ['whatsappVerifyToken', 'Webhook Verify Token', false],
              ].map(([key, lbl, secret, hint]) => (
                <div key={key}>
                  <label style={labelSt}>{lbl}</label>
                  {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 3, lineHeight: 1.4 }}>{hint}</div>}
                  <input type={secret ? 'password' : 'text'} value={form[key]} onChange={e => set(key, e.target.value)} placeholder="Leave blank to keep existing" style={{ marginTop: 2, fontFamily: 'monospace', fontSize: '0.82rem' }} />
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

// ─── ConfirmModal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, loading]);
  if (!open) return null;
  const vc = variant === 'danger' ? 'var(--red)' : variant === 'amber' ? 'var(--amber)' : 'var(--primary)';
  const vb = variant === 'danger' ? 'var(--red-dim)' : variant === 'amber' ? 'var(--amber-dim)' : 'var(--primary-dim)';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,18,12,0.55)', backdropFilter: 'blur(6px)' }} onClick={() => { if (!loading) onClose?.(); }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 16, padding: '28px', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: vb, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertTriangle size={20} color={vc} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        {message && <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 22 }}>{message}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { if (!loading) onClose?.(); }} disabled={loading} style={{ ...ghostBtn, flex: 1, opacity: loading ? 0.5 : 1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: vc, color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
  const tid = tenant.tenantId || tenant._id || '—';

  const regenKeyConfirmed = async () => {
    setRegenConfirm(false);
    setRegening(true);
    try {
      const res = await adminApi.regenerateKey(tenant._id || tenant.tenantId);
      const key = res.data?.apiKey || res.data?.tenant?.apiKey;
      if (!key) throw new Error('Backend did not return a new API key');
      setNewKey(key);
      toast.success('API key regenerated');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'API key regeneration failed');
    } finally { setRegening(false); }
  };

  const toggleStatus = async () => {
    const next = tenant.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await adminApi.updateTenant(tenant._id || tenant.tenantId, { status: next });
      onUpdated(res.data?.tenant || { ...tenant, status: next });
      toast.success(`Tenant ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
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
    } finally { setDeleting(false); }
  };

  const hasWA = !!(tenant.whatsapp?.connected || tenant.whatsapp?.phoneNumberId);

  return (
    <>
      {newKey && <SuccessModal tenant={tenant} apiKey={newKey} onClose={() => setNewKey(null)} />}
      {editing && <EditTenantModal tenant={tenant} onClose={() => setEditing(false)} onUpdated={(u) => { onUpdated(u); setEditing(false); }} />}
      <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 2 }}>{tenant.name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tid}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* WhatsApp status dot */}
            <div title={hasWA ? 'WhatsApp connected' : 'WhatsApp not configured'} style={{ width: 8, height: 8, borderRadius: '50%', background: hasWA ? 'var(--green)' : 'var(--amber)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.text }}>
              {tenant.status || 'UNKNOWN'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.businessMode}</span>
            {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Admin Phone</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.83rem', color: 'var(--text-primary)' }}>{tenant.adminPhone || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Mode</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)' }}>{tenant.businessMode || '—'}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>WhatsApp</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasWA ? 'var(--green)' : 'var(--amber)', flexShrink: 0 }} />
                <span style={{ color: hasWA ? 'var(--green)' : 'var(--amber)', fontWeight: 600 }}>
                  {hasWA ? 'Connected' : 'Not configured — use Edit to add credentials'}
                </span>
              </div>
            </div>
            <CopyField label="Tenant ID (share with tenant)" value={tid} />
            {tenant.description && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Description</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{tenant.description}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={() => setEditing(true)} style={{ ...primaryBtn, fontSize: '0.8rem', padding: '7px 12px' }}>
                <Hash size={13} /> Edit
              </button>
              <button onClick={toggleStatus} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {tenant.status === 'ACTIVE' ? <><ToggleRight size={14} color="var(--green)" /> Deactivate</> : <><ToggleLeft size={14} /> Activate</>}
              </button>
              <button onClick={() => setRegenConfirm(true)} disabled={regening} style={{ ...ghostBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {regening ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Key size={14} />} Regen API Key
              </button>
              <button onClick={() => setDeleteConfirm(true)} disabled={deleting} style={{ ...ghostBtn, color: 'var(--red)', borderColor: 'var(--red-dim)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />} Delete
              </button>
            </div>
          </div>
        )}
      </div>
      {regenConfirm && <ConfirmModal open title="Regenerate API Key" message="Current key stops working immediately. New key shown once." confirmLabel="Yes, Regenerate" variant="amber" loading={regening} onClose={() => setRegenConfirm(false)} onConfirm={regenKeyConfirmed} />}
      {deleteConfirm && <ConfirmModal open title="Delete Tenant" message={`Delete "${tenant.name}"? All data is permanently removed.`} confirmLabel="Yes, Delete" variant="danger" loading={deleting} onClose={() => setDeleteConfirm(false)} onConfirm={deleteTenantConfirmed} />}
    </>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createdData, setCreatedData] = useState(null); // { tenant, apiKey }
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleCreated = (tenant, apiKey) => {
    setShowCreate(false);
    const norm = { status: 'ACTIVE', businessMode: 'GENERIC', adminPhone: '', description: '', ...tenant };
    setTenants(t => [norm, ...t]);
    setCreatedData({ tenant: norm, apiKey });
    toast.success(`Tenant "${norm?.name || 'New tenant'}" created!`);
  };

  const filtered = tenants.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.name || '').toLowerCase().includes(q) || (t.tenantId || '').toLowerCase().includes(q) || (t._id || '').toLowerCase().includes(q) || (t.adminPhone || '').includes(q);
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'ACTIVE').length,
    connected: tenants.filter(t => t.whatsapp?.connected || t.whatsapp?.phoneNumberId).length,
  };

  return (
    <div className='ws-admin' style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Nav */}
      <header style={{ background: 'var(--deep-green)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WhatsalesLogo size={34} light />
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '1rem', letterSpacing: '-0.02em' }}>WhatSales</span>
            <span style={{ marginLeft: 8, background: 'rgba(255,100,100,0.2)', color: '#ff9999', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,100,100,0.3)', letterSpacing: '0.08em' }}>
              SUPER ADMIN
            </span>
          </div>
        </div>
        <button onClick={() => { adminLogout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
          <LogOut size={14} /> Sign out
        </button>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Shield size={20} color="var(--primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Admin Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Create tenants, issue credentials, and manage WhatsApp connections.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total Tenants', value: stats.total, color: 'var(--blue)', bg: 'var(--blue-dim)' },
            { label: 'Active', value: stats.active, color: 'var(--green)', bg: 'var(--green-dim)' },
            { label: 'WhatsApp Connected', value: stats.connected, color: 'var(--primary)', bg: 'var(--primary-dim)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── WhatsApp Onboarding section (NEW) ─────────────────────────── */}
        <div style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wifi size={20} color="var(--primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>WhatsApp Onboarding</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Review tenant connection requests, update statuses, and configure credentials.</div>
          </div>
          <button onClick={() => navigate('/admin/onboarding')} style={{ ...primaryBtn, flexShrink: 0 }}>
            Manage Requests <ArrowRight size={14} />
          </button>
        </div>

        {/* Quick guide */}        {tenants.length === 0 && !loading && (
          <div style={{ marginBottom: 24, padding: '18px 20px', background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', borderRadius: 14 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Zap size={15} /> Getting started
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { n: '1', label: 'Click "New Tenant"', desc: 'Enter business name, phone & type' },
                { n: '2', label: 'Add WhatsApp credentials', desc: 'Phone Number ID & Access Token from Meta' },
                { n: '3', label: 'Share credentials', desc: 'Send Tenant ID + API Key to the business' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: '1 1 200px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.label}</div>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or ID…" style={{ width: '100%' }} />
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
                onUpdated={u => setTenants(ts => ts.map(x => (x._id || x.tenantId) === (u._id || u.tenantId) ? u : x))}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateTenantWizard onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {createdData && <SuccessModal tenant={createdData.tenant} apiKey={createdData.apiKey} onClose={() => setCreatedData(null)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes glow { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .ws-admin input, .ws-admin textarea { width: 100%; padding: 10px 13px; border: 1.5px solid var(--border); border-radius: 8px; font-family: var(--font-body); font-size: 0.9rem; background: var(--bg-surface); color: var(--text-primary); outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .ws-admin input:focus, .ws-admin textarea:focus { border-color: var(--primary); }
        .ws-admin button { cursor: pointer; font-family: var(--font-body); }
      `}</style>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
const iconBtn = { background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', borderRadius: 4 };
const labelSt = { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' };
const primaryBtn = { display: 'flex', alignItems: 'center', gap: 7, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' };
const ghostBtn = { background: 'none', color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(10,25,15,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
const modalBox = { background: 'var(--bg-surface)', borderRadius: 16, padding: '28px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '1.5px solid var(--border)' };
const modalTitle = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' };
