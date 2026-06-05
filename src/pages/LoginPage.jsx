import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Hash, KeyRound, Shield, Zap,
  MessageSquare, BarChart3, ArrowRight, CheckCircle, ShoppingCart,
  User, Mail, Phone, Building2, Wifi, ChevronRight, AlertTriangle,
  Copy, Check, Loader2,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import { registerApi, BUSINESS_MODES } from '../api.js';
import toast from 'react-hot-toast';

const ADMIN_TENANT_ID = import.meta.env.VITE_ADMIN_TENANT_ID || 'dreamline44';

const FEATURES = [
  { icon: ShoppingCart,  label: 'Orders & payments on autopilot',   desc: 'Customers order via WhatsApp, payments handled automatically' },
  { icon: MessageSquare, label: 'AI-powered 24/7 customer replies', desc: 'Never miss a message — even at 3am' },
  { icon: BarChart3,     label: 'Real-time analytics dashboard',    desc: 'Track revenue, orders and customers live' },
  { icon: Zap,           label: 'Set up in minutes, not weeks',     desc: 'No developers needed — just your WhatsApp number' },
];

const STATS = [
  { value: '10k+', label: 'Messages handled daily' },
  { value: '98%',  label: 'Bot accuracy rate' },
  { value: '24/7', label: 'Always on' },
];

const SUPPORTED_MODES = BUSINESS_MODES.filter(m =>
  ['RESTAURANT','BAKERY','SALON','BARBERSHOP','COSMETICS','ELECTRONICS',
   'FASHION','RETAIL','SUPERMARKET','PHARMACY','DELIVERY'].includes(m.value)
);

const CSS = `
  .ws-login-root {
    min-height: 100vh;
    display: flex;
    background: var(--bg-page);
  }
  .ws-hero {
    display: none;
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    background: linear-gradient(160deg, var(--green-800) 0%, var(--green-950) 100%);
    position: relative;
    overflow: hidden;
  }
  .ws-form-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 32px 20px;
    min-height: 100vh;
    overflow-y: auto;
  }
  .ws-form-inner {
    width: 100%;
    max-width: 440px;
  }
  .ws-mobile-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 20px 24px;
    background: linear-gradient(160deg, var(--green-800) 0%, var(--green-950) 100%);
    border-radius: 0 0 28px 28px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  @media (min-width: 900px) {
    .ws-hero {
      display: flex;
      width: 50%;
      max-width: 580px;
      min-height: 100vh;
      position: sticky;
      top: 0;
    }
    .ws-form-panel { padding: 48px 40px; }
    .ws-mobile-hero { display: none !important; }
  }
  @media (min-width: 1280px) {
    .ws-hero { width: 52%; }
    .ws-form-panel { padding: 60px 56px; }
  }
  @keyframes ws-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ws-fade-up { animation: ws-fade-up 0.45s ease both; }
  .ws-fade-up:nth-child(1) { animation-delay: 0.05s; }
  .ws-fade-up:nth-child(2) { animation-delay: 0.12s; }
  .ws-fade-up:nth-child(3) { animation-delay: 0.18s; }
  .ws-fade-up:nth-child(4) { animation-delay: 0.24s; }
  .ws-fade-up:nth-child(5) { animation-delay: 0.30s; }
  .ws-fade-up:nth-child(6) { animation-delay: 0.36s; }
  .ws-tab-btn {
    flex: 1;
    padding: 10px 12px;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 700;
    border-radius: var(--r-md);
    transition: all 0.15s;
    font-family: var(--font-display);
  }
  .ws-tab-btn.active {
    background: var(--primary);
    color: #fff;
    box-shadow: 0 2px 8px rgba(10,122,60,0.3);
  }
  .ws-tab-btn:not(.active) {
    background: transparent;
    color: var(--text-muted);
  }
  .ws-tab-btn:not(.active):hover {
    background: var(--bg-overlay);
    color: var(--text-secondary);
  }
  .ws-step-bar-item {
    flex: 1;
    height: 4px;
    border-radius: 99px;
    transition: background 0.35s;
  }
  .ws-credential-box {
    background: var(--red-dim);
    border: 1.5px solid rgba(220,38,38,0.25);
    border-radius: var(--r-lg);
    padding: 16px;
    margin-bottom: 12px;
  }
`;

// ── Reusable input ────────────────────────────────────────────────────────────
function FormInput({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, rightSlot, focused, onFocus, onBlur, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: focused ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: 7, transition: 'color 0.15s' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: focused ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none', transition: 'color 0.15s' }} />
        )}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={onFocus} onBlur={onBlur}
          style={{
            width: '100%',
            padding: `11px ${rightSlot ? '44px' : '13px'} 11px ${Icon ? '40px' : '13px'}`,
            border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--r-md)',
            fontFamily: type === 'password' ? 'var(--font-mono)' : 'var(--font-body)',
            fontSize: '0.925rem',
            background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
            boxSizing: 'border-box',
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {hint && <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ── Copy-once credential reveal ───────────────────────────────────────────────
function CredentialReveal({ label, value }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div className="ws-credential-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AlertTriangle size={14} color="var(--red)" />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)' }}>
          {label} — shown once only. Save it now.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', padding: '10px 12px', marginBottom: 10 }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'nowrap', filter: revealed ? 'none' : 'blur(5px)', transition: 'filter 0.2s' }}>
          {value}
        </span>
        <button type="button" onClick={() => setRevealed(v => !v)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button type="button" onClick={copy} style={{ color: copied ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Inline CopyField ──────────────────────────────────────────────────────────
function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', padding: '9px 12px' }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'nowrap' }}>{value}</span>
        <button type="button" onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ color: copied ? 'var(--primary)' : 'var(--text-ghost)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Submit button ─────────────────────────────────────────────────────────────
function SubmitBtn({ loading, children, disabled, onClick, style = {} }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '13px 16px',
        background: (loading || disabled) ? 'var(--primary-dark)' : 'var(--primary)',
        color: '#fff', border: 'none', borderRadius: 'var(--r-md)',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
        boxShadow: '0 2px 10px rgba(10,122,60,0.35)',
        letterSpacing: '-0.01em',
        ...style,
      }}
    >
      {loading ? <><Spinner size={17} color="#fff" /><span>Please wait…</span></> : children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ONBOARDING WIZARD — mirrors the confirmed Bruno 3-step flow exactly
// Step 1: POST /register          (name, email, businessName, phone, plan)
// Step 2: POST /register/business (full business config with x-api-key)
// Step 3: PUT  /register/whatsapp (phoneNumberId, accessToken, phone)
// Step 4: Success / credentials reveal
// ════════════════════════════════════════════════════════════════════════════════
function OnboardingWizard({ onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // State gathered across steps
  const [apiKey,    setApiKey]    = useState('');  // retained from Step 1 for Steps 2+3
  const [tenantId,  setTenantId]  = useState('');

  // Step 1 fields
  const [s1, setS1] = useState({ name: '', email: '', businessName: '', phone: '', plan: 'FREE' });
  const [f1, setF1] = useState({ name: false, email: false, businessName: false, phone: false });

  // Step 2 fields (business config)
  const [s2, setS2] = useState({
    description: '',
    businessMode: 'RESTAURANT',
    adminPhone: '',
    timezone: 'Africa/Banjul',
    open: '8',
    close: '21',
    currency: 'GMD',
    wavePhone: '',
    requireProof: true,
    allowAfterHoursOrders: true,
    sessionTimeout: '30',
  });
  const [f2, setF2] = useState({});

  // Step 3 fields
  const [s3, setS3] = useState({ phoneNumberId: '', accessToken: '', phone: '' });
  const [f3, setF3] = useState({ phoneNumberId: false, accessToken: false, phone: false });

  // Track which steps completed OK
  const [step2Skipped, setStep2Skipped] = useState(false);
  const [step3Skipped, setStep3Skipped] = useState(false);
  const [errors, setErrors] = useState({});

  // ── STEP 1 SUBMIT ────────────────────────────────────────────────────────────
  const submitStep1 = async () => {
    setErrors({});
    const errs = {};
    if (!s1.name.trim())         errs.name         = 'Your name is required';
    if (!s1.email.trim())        errs.email        = 'Email is required';
    if (!s1.businessName.trim()) errs.businessName = 'Business name is required';
    if (!s1.phone.trim())        errs.phone        = 'Phone number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await registerApi.createAccount({
        name:         s1.name.trim(),
        email:        s1.email.trim(),
        businessName: s1.businessName.trim(),
        phone:        s1.phone.trim(),
        plan:         s1.plan,
      });

      // Backend returns: { tenantId, apiKey, tenant, ... }
      // Normalise multiple possible shapes
      const data   = res.data;
      const key    = data?.apiKey   || data?.tenant?.apiKey  || null;
      const tid    = data?.tenantId || data?.tenant?._id     || data?.tenant?.id || null;

      if (!key)  throw new Error('Server did not return an API key. Check backend /register response.');
      if (!tid)  throw new Error('Server did not return a Tenant ID. Check backend /register response.');

      setApiKey(key);
      setTenantId(tid);
      toast.success('Account created! Continuing setup…');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 SUBMIT ────────────────────────────────────────────────────────────
  const submitStep2 = async (skip = false) => {
    if (skip) { setStep2Skipped(true); setStep(3); return; }

    setLoading(true);
    try {
      const businessPayload = {
        name:         s1.businessName.trim(),
        description:  s2.description.trim() || `${s1.businessName.trim()} — powered by WhatSales`,
        businessMode: s2.businessMode,
        adminPhone:   s2.adminPhone.trim() || s1.phone.trim(),
        menu: [],
        hours: {
          enabled:  true,
          timezone: s2.timezone || 'Africa/Banjul',
          open:     parseInt(s2.open, 10)  || 8,
          close:    parseInt(s2.close, 10) || 21,
        },
        payment: {
          wavePhone:    s2.wavePhone.trim() || s1.phone.trim(),
          currency:     s2.currency        || 'GMD',
          requireProof: s2.requireProof,
        },
        faq: [],
        settings: {
          autoSuggestions:       true,
          enableLearning:        true,
          sessionTimeout:        parseInt(s2.sessionTimeout, 10) || 30,
          allowAfterHoursOrders: s2.allowAfterHoursOrders,
          closedMessage:         `We're currently closed. Please message us during business hours!`,
        },
        customMessages: {
          welcomeMessage: '', afterOrder: '', afterBooking: '', payment: '',
          paymentInstructions: '', closed: '', orderPrompt: '', bookPrompt: '',
          servicePrompt: '', timePrompt: '', cancelMsg: '', fallback: '', loopFallback: '',
        },
      };

      await registerApi.registerBusiness(apiKey, businessPayload);
      toast.success('Business configured!');
      setStep(3);
    } catch (err) {
      toast.error(`Business setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3 SUBMIT ────────────────────────────────────────────────────────────
  const submitStep3 = async (skip = false) => {
    if (skip) { setStep3Skipped(true); setStep(4); return; }

    const errs = {};
    if (!s3.phoneNumberId.trim()) errs.phoneNumberId = 'Phone Number ID is required';
    if (!s3.accessToken.trim())   errs.accessToken   = 'Access Token is required';
    if (!s3.phone.trim())         errs.phone         = 'WhatsApp phone number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await registerApi.connectWhatsApp(apiKey, {
        phoneNumberId: s3.phoneNumberId.trim(),
        accessToken:   s3.accessToken.trim(),
        phone:         s3.phone.trim(),
      });
      toast.success('WhatsApp connected!');
      setStep3Skipped(false);
      setStep(4);
    } catch (err) {
      toast.error(`WhatsApp connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP BAR ──────────────────────────────────────────────────────────────────
  const STEPS = ['Account', 'Business', 'WhatsApp', 'Done'];
  const stepBar = (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {STEPS.map((label, i) => (
          <div key={label} className="ws-step-bar-item"
            style={{ background: i < step ? 'var(--primary)' : i === step - 1 ? 'var(--primary)' : 'var(--border-mid)' }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        Step {step} of {STEPS.length} — <strong>{STEPS[step - 1]}</strong>
      </p>
    </div>
  );

  const errStyle = { fontSize: '0.74rem', color: 'var(--red)', marginTop: 4 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── STEP 1: Account ── */}
      {step === 1 && (
        <form onSubmit={e => { e.preventDefault(); submitStep1(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ws-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,4vw,1.8rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4 }}>
              Create your account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set up your WhatSales business in minutes</p>
          </div>

          {stepBar}

          <div className="ws-fade-up">
            <FormInput label="Your Name" icon={User} value={s1.name} onChange={e => setS1(p => ({ ...p, name: e.target.value }))}
              placeholder="Hassan" focused={f1.name} onFocus={() => setF1(p => ({ ...p, name: true }))} onBlur={() => setF1(p => ({ ...p, name: false }))} />
            {errors.name && <p style={errStyle}>{errors.name}</p>}
          </div>

          <div className="ws-fade-up">
            <FormInput label="Email Address" icon={Mail} type="email" value={s1.email} onChange={e => setS1(p => ({ ...p, email: e.target.value }))}
              placeholder="you@business.com" autoComplete="email" focused={f1.email} onFocus={() => setF1(p => ({ ...p, email: true }))} onBlur={() => setF1(p => ({ ...p, email: false }))} />
            {errors.email && <p style={errStyle}>{errors.email}</p>}
          </div>

          <div className="ws-fade-up">
            <FormInput label="Business Name" icon={Building2} value={s1.businessName} onChange={e => setS1(p => ({ ...p, businessName: e.target.value }))}
              placeholder="DreamLine Restaurant" focused={f1.businessName} onFocus={() => setF1(p => ({ ...p, businessName: true }))} onBlur={() => setF1(p => ({ ...p, businessName: false }))} />
            {errors.businessName && <p style={errStyle}>{errors.businessName}</p>}
          </div>

          <div className="ws-fade-up">
            <FormInput label="Phone Number" icon={Phone} value={s1.phone} onChange={e => setS1(p => ({ ...p, phone: e.target.value }))}
              placeholder="+220 xxx xxxx" autoComplete="tel" focused={f1.phone} onFocus={() => setF1(p => ({ ...p, phone: true }))} onBlur={() => setF1(p => ({ ...p, phone: false }))} />
            {errors.phone && <p style={errStyle}>{errors.phone}</p>}
          </div>

          <div className="ws-fade-up">
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Plan</label>
            <select value={s1.plan} onChange={e => setS1(p => ({ ...p, plan: e.target.value }))}
              style={{ width: '100%', padding: '11px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
              {['FREE','STARTER','PRO','ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="ws-fade-up">
            <SubmitBtn loading={loading}>
              <span>Continue</span><ChevronRight size={16} />
            </SubmitBtn>
          </div>

          <div className="ws-fade-up" style={{ textAlign: 'center' }}>
            <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.84rem', fontFamily: 'var(--font-body)' }}>
              Already have an account? Sign in
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Business Config ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ws-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,4vw,1.6rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4 }}>
              Configure your business
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Set up your menu, hours, and payment. You can skip to do this later.</p>
          </div>

          {stepBar}

          <div className="ws-fade-up">
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Business Type</label>
            <select value={s2.businessMode} onChange={e => setS2(p => ({ ...p, businessMode: e.target.value }))}
              style={{ width: '100%', padding: '11px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
              {SUPPORTED_MODES.map(m => <option key={m.value} value={m.value}>{m.emoji} {m.label} — {m.desc}</option>)}
            </select>
          </div>

          <div className="ws-fade-up">
            <FormInput label="Business Description (optional)" value={s2.description}
              onChange={e => setS2(p => ({ ...p, description: e.target.value }))}
              placeholder="We serve authentic Gambian dishes…"
              focused={f2.desc} onFocus={() => setF2(p => ({ ...p, desc: true }))} onBlur={() => setF2(p => ({ ...p, desc: false }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="ws-fade-up">
              <FormInput label="Opening Hour (0–23)" value={s2.open}
                onChange={e => setS2(p => ({ ...p, open: e.target.value }))} placeholder="8"
                focused={f2.open} onFocus={() => setF2(p => ({ ...p, open: true }))} onBlur={() => setF2(p => ({ ...p, open: false }))} />
            </div>
            <div className="ws-fade-up">
              <FormInput label="Closing Hour (0–23)" value={s2.close}
                onChange={e => setS2(p => ({ ...p, close: e.target.value }))} placeholder="21"
                focused={f2.close} onFocus={() => setF2(p => ({ ...p, close: true }))} onBlur={() => setF2(p => ({ ...p, close: false }))} />
            </div>
          </div>

          <div className="ws-fade-up">
            <FormInput label="Payment / Admin Phone" icon={Phone} value={s2.wavePhone}
              onChange={e => setS2(p => ({ ...p, wavePhone: e.target.value }))}
              placeholder="+220 xxx xxxx (for Wave payments)"
              focused={f2.wavePhone} onFocus={() => setF2(p => ({ ...p, wavePhone: true }))} onBlur={() => setF2(p => ({ ...p, wavePhone: false }))}
              hint="Wave mobile money number for receiving payments" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="ws-fade-up">
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Currency</label>
              <select value={s2.currency} onChange={e => setS2(p => ({ ...p, currency: e.target.value }))}
                style={{ width: '100%', padding: '11px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
                {['GMD','USD','EUR','GBP','XOF','NGN','GHS','KES','ZAR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="ws-fade-up">
              <FormInput label="Session Timeout (min)" value={s2.sessionTimeout}
                onChange={e => setS2(p => ({ ...p, sessionTimeout: e.target.value }))} placeholder="30"
                focused={f2.sessionTimeout} onFocus={() => setF2(p => ({ ...p, sessionTimeout: true }))} onBlur={() => setF2(p => ({ ...p, sessionTimeout: false }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => submitStep2(true)}
              style={{ flex: 1, padding: '12px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', transition: 'all 0.15s' }}>
              Skip for now
            </button>
            <div style={{ flex: 2 }}>
              <SubmitBtn loading={loading} onClick={() => submitStep2(false)}>
                <span>Save & Continue</span><ChevronRight size={16} />
              </SubmitBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: WhatsApp Credentials ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="ws-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,4vw,1.6rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4 }}>
              Connect WhatsApp
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Link your Meta WhatsApp Business number. You can skip and connect later via admin.</p>
          </div>

          {stepBar}

          <div style={{ background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, border: '1.5px solid var(--border)' }}>
            Get these credentials from <strong>Meta for Developers → WhatsApp → API Setup</strong>.
          </div>

          <div className="ws-fade-up">
            <FormInput label="Phone Number ID *" icon={Hash} value={s3.phoneNumberId}
              onChange={e => setS3(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="1149315044929352"
              focused={f3.phoneNumberId} onFocus={() => setF3(p => ({ ...p, phoneNumberId: true }))} onBlur={() => setF3(p => ({ ...p, phoneNumberId: false }))}
              hint="Found in Meta Business Manager → WhatsApp → Phone Number ID" />
            {errors.phoneNumberId && <p style={{ fontSize: '0.74rem', color: 'var(--red)', marginTop: 4 }}>{errors.phoneNumberId}</p>}
          </div>

          <div className="ws-fade-up">
            <FormInput label="Access Token *" icon={KeyRound} type="password" value={s3.accessToken}
              onChange={e => setS3(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxxx…"
              focused={f3.accessToken} onFocus={() => setF3(p => ({ ...p, accessToken: true }))} onBlur={() => setF3(p => ({ ...p, accessToken: false }))}
              hint="Permanent or long-lived token from Meta" />
            {errors.accessToken && <p style={{ fontSize: '0.74rem', color: 'var(--red)', marginTop: 4 }}>{errors.accessToken}</p>}
          </div>

          <div className="ws-fade-up">
            <FormInput label="WhatsApp Phone Number *" icon={Phone} value={s3.phone}
              onChange={e => setS3(p => ({ ...p, phone: e.target.value }))} placeholder="+15556722493"
              focused={f3.phone} onFocus={() => setF3(p => ({ ...p, phone: true }))} onBlur={() => setF3(p => ({ ...p, phone: false }))} />
            {errors.phone && <p style={{ fontSize: '0.74rem', color: 'var(--red)', marginTop: 4 }}>{errors.phone}</p>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => submitStep3(true)}
              style={{ flex: 1, padding: '12px', background: 'transparent', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', transition: 'all 0.15s' }}>
              Skip for now
            </button>
            <div style={{ flex: 2 }}>
              <SubmitBtn loading={loading} onClick={() => submitStep3(false)}>
                <Wifi size={15} /><span>Connect WhatsApp</span>
              </SubmitBtn>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 4: Success / Credentials ── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ws-fade-up" style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="var(--primary)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 6 }}>
              Account Created!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {step3Skipped
                ? 'Your account and business are set up. Connect WhatsApp from the admin panel to go live.'
                : step2Skipped
                  ? 'Your account is ready. Complete business setup from your dashboard.'
                  : 'Your account, business, and WhatsApp are fully configured and ready to go.'}
            </p>
          </div>

          {/* Tenant ID — always safe to show */}
          <CopyRow label="Tenant ID (your login username)" value={tenantId} />

          {/* API Key — shown ONCE */}
          <CredentialReveal label="API Key" value={apiKey} />

          <div style={{ background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.2)', borderRadius: 'var(--r-md)', padding: '12px 14px', fontSize: '0.8rem', color: 'var(--amber)', lineHeight: 1.6 }}>
            <strong>⚠ Important:</strong> Your API Key is shown only once and cannot be recovered. Copy it before continuing.
          </div>

          {step2Skipped && (
            <div style={{ background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, border: '1.5px solid var(--border)' }}>
              <strong>Next steps:</strong> Sign in to your dashboard to configure menu, hours, and payment settings.
            </div>
          )}
          {step3Skipped && (
            <div style={{ background: 'var(--blue-dim)', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--blue)', lineHeight: 1.55, border: '1.5px solid rgba(37,99,235,0.2)' }}>
              <strong>Connect WhatsApp:</strong> Ask your super admin to configure WhatsApp credentials from the Admin → Tenants panel, or use <em>Edit → WhatsApp</em>.
            </div>
          )}

          <SubmitBtn onClick={onSwitchToLogin} style={{ marginTop: 4 }}>
            <span>Sign In to Dashboard</span><ArrowRight size={16} />
          </SubmitBtn>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SIGN-IN FORM
// ════════════════════════════════════════════════════════════════════════════════
function SignInForm({ onSwitchToRegister }) {
  const navigate       = useNavigate();
  const { login }      = useAuth();
  const { adminLogin } = useAdmin();
  const [tenantId, setTenantId] = useState('');
  const [apiKey,   setApiKey]   = useState('');
  const [showKey,  setShowKey]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focusId,  setFocusId]  = useState(false);
  const [focusKey, setFocusKey] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!tenantId.trim() || !apiKey.trim()) { toast.error('Please enter both Tenant ID and API Key'); return; }
    setLoading(true);
    try {
      if (tenantId.trim() === ADMIN_TENANT_ID) {
        await adminLogin(apiKey.trim());
        navigate('/admin');
      } else {
        await login(tenantId.trim(), apiKey.trim());
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="ws-fade-up">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 1.9rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 6 }}>
          Sign in
        </h2>
        <p style={{ fontSize: '0.855rem', color: 'var(--text-muted)' }}>
          Enter your credentials to access your dashboard
        </p>
      </div>

      <div className="ws-fade-up">
        <FormInput label="Tenant ID" icon={Hash} value={tenantId} onChange={e => setTenantId(e.target.value)}
          placeholder="your-business-id" autoComplete="username"
          focused={focusId} onFocus={() => setFocusId(true)} onBlur={() => setFocusId(false)} />
      </div>

      <div className="ws-fade-up">
        <FormInput label="API Key" icon={KeyRound} type={showKey ? 'text' : 'password'}
          value={apiKey} onChange={e => setApiKey(e.target.value)}
          placeholder="••••••••••••••••••" autoComplete="current-password"
          focused={focusKey} onFocus={() => setFocusKey(true)} onBlur={() => setFocusKey(false)}
          rightSlot={
            <button type="button" onClick={() => setShowKey(v => !v)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
      </div>

      <div className="ws-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 13px', background: 'var(--purple-dim)', border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-md)' }}>
        <Shield size={13} color="var(--purple)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--purple)', lineHeight: 1.5 }}>
          Use Tenant ID <strong>{ADMIN_TENANT_ID}</strong> to access the Super Admin panel.
        </p>
      </div>

      <div className="ws-fade-up">
        <SubmitBtn loading={loading}>
          <span>Sign in</span><ArrowRight size={17} />
        </SubmitBtn>
      </div>

      <div className="ws-fade-up" style={{ textAlign: 'center' }}>
        <button type="button" onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, fontSize: '0.84rem', fontFamily: 'var(--font-body)' }}>
          New business? Create an account
        </button>
      </div>

      <div className="ws-fade-up">
        <div style={{ marginTop: 4, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>How to sign in:</strong>{' '}
            Your Tenant ID and API key are provided when your account is created. The API key is shown{' '}
            <strong style={{ color: 'var(--text-secondary)' }}>once only</strong> — store it securely.
          </p>
        </div>
      </div>
    </form>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'

  return (
    <>
      <style>{CSS}</style>
      <div className="ws-login-root">

        {/* ══ LEFT Hero (desktop only) ══ */}
        <div className="ws-hero">
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 52 }}>
            <Logo size={46} light />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.03em' }}>WhatSales</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '5px 14px', marginBottom: 24, alignSelf: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-300)', animation: 'pulse 2s infinite', display: 'block' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WhatsApp AI Platform</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', lineHeight: 1.1, color: '#fff', letterSpacing: '-0.04em', marginBottom: 16 }}>
            Turn conversations<br />into revenue
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, marginBottom: 40, maxWidth: 400 }}>
            Automate orders, bookings, and customer support with an AI bot that works around the clock.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 44 }}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="rgba(255,255,255,0.9)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.5 }}>{desc}</div>
                </div>
                <CheckCircle size={14} color="var(--green-300)" style={{ flexShrink: 0, marginTop: 3 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: '14px 16px', textAlign: 'center', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-300)', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT Form panel ══ */}
        <div className="ws-form-panel">

          {/* Mobile hero */}
          <div className="ws-mobile-hero">
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14, position: 'relative' }}>
              <Logo size={38} light />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.03em' }}>WhatSales</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 6vw, 1.8rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, position: 'relative' }}>
              Turn conversations into revenue
            </h2>
          </div>

          <div className="ws-form-inner">

            {/* Tab switcher — only show for simple sign-in vs register toggle */}
            {(mode === 'signin' || mode === 'register') && (
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-overlay)', borderRadius: 'var(--r-lg)', padding: 4, marginBottom: 24 }}>
                <button className={`ws-tab-btn ${mode === 'signin' ? 'active' : ''}`} type="button" onClick={() => setMode('signin')}>Sign In</button>
                <button className={`ws-tab-btn ${mode === 'register' ? 'active' : ''}`} type="button" onClick={() => setMode('register')}>Create Account</button>
              </div>
            )}

            {mode === 'signin' && (
              <SignInForm onSwitchToRegister={() => setMode('register')} />
            )}
            {mode === 'register' && (
              <OnboardingWizard onSwitchToLogin={() => setMode('signin')} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
