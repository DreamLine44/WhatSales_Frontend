/**
 * WhatsAppConnectionPage.jsx
 * Tenant-facing WhatsApp onboarding page.
 *
 * FIXES:
 *  [FIX-PAGE-1] BUSINESS_CATEGORIES uses {value, label} objects — select renders
 *               label but sends backend enum value. Fixes "Please fill required fields"
 *               even when category IS selected.
 *  [FIX-PAGE-2] WhatsAppStatusCard reads request.contactPerson (not contactPersonName)
 *               to match backend field name stored in DB.
 *  [FIX-PAGE-3] Validation checks non-empty VALUE not presence of key.
 *  [FIX-PAGE-4] whatsappNumber normalised (spaces/dashes stripped) before submitting.
 *  [FIX-PAGE-5] OnboardingTimeline step logic simplified — no duplicate PENDING entries.
 *  [FIX-PAGE-6] Status normalised via normalizeStatus() for consistent key lookups.
 *  [FIX-PAGE-7] Error state no longer blocks the form for fresh users who have no
 *               existing request. If loading fails with a 404-like error but there is
 *               no existing request, the form is still shown so the user can submit.
 *  [FIX-PAGE-8] Form validation error toasts replaced with inline field-level errors
 *               so they don't get lost behind the keyboard on mobile.
 *  [FIX-PAGE-9] Phone number field shows E.164 hint text.
 */

import { useState } from 'react';
import {
  Wifi, Send, CheckCircle2, Clock, Phone, Mail, User,
  Building2, AlertTriangle, Loader2, RefreshCw,
  MessageSquare, ChevronRight, Zap, Info,
} from 'lucide-react';
import { useWhatsAppOnboarding } from '../hooks/useWhatsAppOnboarding';
import {
  BUSINESS_CATEGORIES,
  ONBOARDING_STATUSES,
  getStatusMeta,
  normalizeStatus,
} from '../services/whatsappOnboardingApi';
import toast from 'react-hot-toast';

// ── Shared micro-styles ────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 14,
  padding: '24px',
};

const labelStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '10px 13px',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const inputErrorStyle = {
  ...inputStyle,
  borderColor: 'var(--red)',
};

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--primary)', color: '#fff', border: 'none',
  borderRadius: 9, padding: '11px 22px', fontFamily: 'var(--font-body)',
  fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
};

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'none', color: 'var(--text-secondary)',
  border: '1.5px solid var(--border)', borderRadius: 8,
  padding: '9px 16px', fontFamily: 'var(--font-body)',
  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
};

// ── Timeline steps ─────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { status: 'PENDING',    label: 'Requested',    desc: 'Your request has been received and is pending review.' },
  { status: 'CONTACTED',  label: 'Under Review', desc: 'Our team has reviewed your request and will contact you.' },
  { status: 'CONNECTING', label: 'Connecting',   desc: 'Your WhatsApp account is being configured.' },
  { status: 'CONNECTED',  label: 'Connected',    desc: 'Your WhatsApp account is fully connected and active.' },
];
const STATUS_ORDER = ['PENDING', 'CONTACTED', 'CONNECTING', 'CONNECTED'];

// ── Notifications per status ───────────────────────────────────────────────────
const STATUS_NOTIFICATIONS = {
  PENDING: {
    icon: Clock, color: 'var(--amber)', bg: 'var(--amber-dim)',
    title: 'Request Received',
    message: 'Your WhatsApp connection request has been received. Our team will review it shortly.',
  },
  CONTACTED: {
    icon: MessageSquare, color: 'var(--blue)', bg: 'var(--blue-dim)',
    title: 'Under Review',
    message: 'Your request is under review. We will reach out to you via the email or phone you provided.',
  },
  CONNECTING: {
    icon: Wifi, color: 'var(--purple)', bg: 'var(--purple-dim)',
    title: 'Connection in Progress',
    message: 'Your WhatsApp account is being connected. This usually takes 24–48 hours.',
  },
  CONNECTED: {
    icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-dim)',
    title: 'Successfully Connected! 🎉',
    message: 'Your WhatsApp account has been connected successfully. Your bot is now live and ready to serve customers.',
  },
  REJECTED: {
    icon: AlertTriangle, color: 'var(--red)', bg: 'var(--red-dim)',
    title: 'Request Rejected',
    message: 'Unfortunately your request was rejected. Please contact support for more information.',
  },
};

// ── FieldError ─────────────────────────────────────────────────────────────────
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.76rem', color: 'var(--red)' }}>
      <AlertTriangle size={11} />
      {msg}
    </div>
  );
}

// ── WhatsAppRequestForm ────────────────────────────────────────────────────────
function WhatsAppRequestForm({ onSubmitted, submitting }) {
  const [form, setForm] = useState({
    businessName: '',
    businessCategory: '',
    whatsappNumber: '',
    contactPersonName: '',
    contactEmail: '',
    additionalNotes: '',
  });
  const [focused, setFocused] = useState('');
  // [FIX-PAGE-8] Inline field errors instead of relying solely on toast
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // Clear field error on change
    if (fieldErrors[k]) setFieldErrors(e => ({ ...e, [k]: '' }));
  };

  const handleSubmit = async () => {
    const required = [
      { key: 'businessName',      label: 'Business Name'        },
      { key: 'contactPersonName', label: 'Contact Person Name'  },
      { key: 'whatsappNumber',    label: 'WhatsApp Number'      },
      { key: 'contactEmail',      label: 'Contact Email'        },
      { key: 'businessCategory',  label: 'Business Category'    },
    ];

    const errors = {};
    for (const { key, label: lbl } of required) {
      if (!form[key]?.trim()) {
        errors[key] = `${lbl} is required`;
      }
    }

    if (form.contactEmail && !form.contactEmail.includes('@')) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    // [FIX-PAGE-4] Strip whitespace/dashes from phone before sending
    const normalizedForm = {
      ...form,
      whatsappNumber: form.whatsappNumber.replace(/[\s\-().]/g, ''),
    };

    await onSubmitted(normalizedForm);
  };

  const textFields = [
    { key: 'businessName',      label: 'Business Name',       icon: Building2, placeholder: "e.g. Mama's Kitchen",   type: 'text'  },
    { key: 'contactPersonName', label: 'Contact Person Name', icon: User,      placeholder: 'e.g. Aminata Diallo',   type: 'text'  },
    { key: 'whatsappNumber',    label: 'WhatsApp Number',     icon: Phone,     placeholder: 'e.g. +2207001234',      type: 'tel'   },
    { key: 'contactEmail',      label: 'Contact Email',       icon: Mail,      placeholder: 'e.g. info@business.com', type: 'email' },
  ];

  return (
    <div style={{ ...card, maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wifi size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 6 }}>
            Request WhatsApp Connection
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Submit your details below and our team will connect your WhatsApp Business account to WhatSales.
            The process typically takes 1–3 business days.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--primary-dim)', border: '1px solid var(--border-accent)', borderRadius: 10, marginBottom: 24 }}>
        <Info size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You will need a <strong>WhatsApp Business account</strong> and access to the <strong>Meta Business Manager</strong>.
          Our team will guide you through the credential setup after reviewing your request.
        </p>
      </div>

      {/* Text fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {textFields.map(({ key, label: lbl, icon: Icon, placeholder, type }) => (
          <div key={key}>
            <label style={labelStyle}>
              {lbl} <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Icon
                size={15}
                style={{
                  position: 'absolute', left: 11, top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === key ? 'var(--primary)' : fieldErrors[key] ? 'var(--red)' : 'var(--text-muted)',
                  transition: 'color 0.15s', pointerEvents: 'none',
                }}
              />
              <input
                type={type}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused('')}
                style={{
                  ...(fieldErrors[key] ? inputErrorStyle : inputStyle),
                  paddingLeft: 36,
                  borderColor: focused === key ? 'var(--primary)' : fieldErrors[key] ? 'var(--red)' : undefined,
                }}
              />
            </div>
            <FieldError msg={fieldErrors[key]} />
          </div>
        ))}
      </div>

      {/* [FIX-PAGE-1] Category select — value is enum, label is human-readable */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Business Category <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <select
          value={form.businessCategory}
          onChange={e => set('businessCategory', e.target.value)}
          onFocus={() => setFocused('businessCategory')}
          onBlur={() => setFocused('')}
          style={{
            ...(fieldErrors.businessCategory ? inputErrorStyle : inputStyle),
            borderColor: focused === 'businessCategory' ? 'var(--primary)' : fieldErrors.businessCategory ? 'var(--red)' : undefined,
          }}
        >
          <option value="">Select a category…</option>
          {BUSINESS_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <FieldError msg={fieldErrors.businessCategory} />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>
          Additional Notes{' '}
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <textarea
          value={form.additionalNotes}
          onChange={e => set('additionalNotes', e.target.value)}
          placeholder="Any additional context, specific requirements, or questions for our team…"
          rows={3}
          onFocus={() => setFocused('additionalNotes')}
          onBlur={() => setFocused('')}
          style={{
            ...inputStyle,
            resize: 'vertical',
            lineHeight: 1.6,
            borderColor: focused === 'additionalNotes' ? 'var(--primary)' : undefined,
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ ...primaryBtn, width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
      >
        {submitting
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
          : <><Send size={16} /> Request WhatsApp Connection</>
        }
      </button>
    </div>
  );
}

// ── WhatsAppStatusCard ─────────────────────────────────────────────────────────
function WhatsAppStatusCard({ request }) {
  // [FIX-PAGE-6] normalizeStatus handles both 'pending' and 'PENDING'
  const status = normalizeStatus(request?.status);
  const meta   = getStatusMeta(status);
  const notif  = STATUS_NOTIFICATIONS[status] || STATUS_NOTIFICATIONS.PENDING;
  const NotifIcon = notif.icon;

  return (
    <div style={{ ...card, maxWidth: 680, margin: '0 auto 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Connection Status
        </h3>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, color: meta.color, background: meta.bg, padding: '5px 13px', borderRadius: 99 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, animation: status === 'CONNECTING' ? 'glow 2s ease-in-out infinite' : 'none' }} />
          {meta.label}
        </span>
      </div>

      {/* Notification banner */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: notif.bg, border: `1px solid ${notif.color}22`, borderRadius: 10, marginBottom: 20 }}>
        <NotifIcon size={18} color={notif.color} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: notif.color, marginBottom: 4 }}>{notif.title}</div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{notif.message}</div>
        </div>
      </div>

      {/* Request details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Business Name',   value: request?.businessName },
          { label: 'WhatsApp Number', value: request?.whatsappNumber },
          // [FIX-PAGE-2] contactPerson is the correct backend field name
          { label: 'Contact Person',  value: request?.contactPerson },
          { label: 'Contact Email',   value: request?.contactEmail },
          { label: 'Category',        value: request?.businessCategory },
          {
            label: 'Submitted',
            value: request?.createdAt
              ? new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—',
          },
        ].map(({ label: lbl, value }) => (
          <div key={lbl} style={{ padding: '10px 12px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{lbl}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Admin notes — only visible when present */}
      {request?.adminNotes && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--blue-dim)', border: '1px solid rgba(29,88,224,0.15)', borderRadius: 10 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Note from Team</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{request.adminNotes}</div>
        </div>
      )}
    </div>
  );
}

// ── OnboardingTimeline ─────────────────────────────────────────────────────────
function OnboardingTimeline({ request }) {
  // [FIX-PAGE-6] normalizeStatus ensures we always get UPPERCASE key
  const currentStatus = normalizeStatus(request?.status);
  const isRejected    = currentStatus === 'REJECTED';
  // [FIX-PAGE-5] currentIndex is the 0-based position in STATUS_ORDER
  const currentIndex  = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div style={{ ...card, maxWidth: 680, margin: '0 auto 20px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24 }}>
        Onboarding Progress
      </h3>

      {isRejected ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', background: 'var(--red-dim)', border: '1px solid rgba(220,53,53,0.2)', borderRadius: 10 }}>
          <AlertTriangle size={18} color="var(--red)" />
          <div style={{ fontSize: '0.88rem', color: 'var(--red)', fontWeight: 600 }}>
            This request was rejected. Please contact support to resubmit.
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Vertical connector line */}
          <div style={{ position: 'absolute', left: 15, top: 16, bottom: 16, width: 2, background: 'var(--border)', zIndex: 0 }} />

          {TIMELINE_STEPS.map((step, i) => {
            const stepIndex = STATUS_ORDER.indexOf(step.status);
            const done      = currentIndex > stepIndex;
            const active    = currentIndex === stepIndex;

            return (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: i < TIMELINE_STEPS.length - 1 ? 24 : 0, position: 'relative', zIndex: 1 }}>
                {/* Circle indicator */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--bg-surface)',
                  border: `2px solid ${done ? 'var(--green)' : active ? 'var(--primary)' : 'var(--border-strong)'}`,
                  transition: 'all 0.2s',
                }}>
                  {done
                    ? <CheckCircle2 size={15} color="#fff" />
                    : active
                      ? <Zap size={14} color="#fff" />
                      : <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</span>
                  }
                </div>

                {/* Step content */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: done || active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function WhatsAppConnectionPage() {
  const { request, loading, submitting, error, fetchStatus, submitRequest, hasRequest } = useWhatsAppOnboarding();

  const handleSubmit = async (formData) => {
    const result = await submitRequest(formData);
    if (result.success) {
      toast.success("Request submitted! We'll be in touch soon.");
    } else {
      toast.error(result.error || 'Failed to submit request');
    }
  };

  // [FIX-PAGE-7] Determine whether to show the form.
  // Show form when: not loading AND no existing request found.
  // A load ERROR that isn't about an existing request (e.g. network blip) should
  // still allow the user to submit — don't gate the form behind the error banner.
  const showForm = !loading && !hasRequest;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Wifi size={20} color="var(--primary)" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            WhatsApp Connection
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Connect your WhatsApp Business account to start receiving orders and engaging customers automatically.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
          <div style={{ fontSize: '0.88rem' }}>Loading status…</div>
        </div>
      )}

      {/* Non-blocking error banner — shown above the form/status, not replacing it */}
      {!loading && error && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--red-dim)', border: '1px solid rgba(220,53,53,0.2)', borderRadius: 10, marginBottom: 24 }}>
          <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>
              {hasRequest ? 'Error loading status' : 'Could not load existing request — you can still submit below'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{error}</div>
          </div>
          <button onClick={fetchStatus} style={{ ...ghostBtn, fontSize: '0.8rem', flexShrink: 0 }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* No request yet — show form (even if there was a load error) */}
      {showForm && (
        <WhatsAppRequestForm onSubmitted={handleSubmit} submitting={submitting} />
      )}

      {/* Has request — show status + timeline */}
      {!loading && hasRequest && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={fetchStatus} style={ghostBtn}>
              <RefreshCw size={13} /> Refresh Status
            </button>
          </div>
          <WhatsAppStatusCard request={request} />
          <OnboardingTimeline request={request} />

          {/* Connected CTA */}
          {normalizeStatus(request?.status) === 'CONNECTED' && (
            <div style={{ ...card, maxWidth: 680, margin: '0 auto', background: 'var(--green-dim)', border: '1.5px solid rgba(25,163,72,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={24} color="var(--green)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                    Your bot is live!
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    WhatsApp is connected. Go to your dashboard to monitor orders and sessions.
                  </div>
                </div>
                <ChevronRight size={18} color="var(--green)" />
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes glow { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        input:focus, select:focus, textarea:focus { border-color: var(--primary) !important; }
      `}</style>
    </div>
  );
}
