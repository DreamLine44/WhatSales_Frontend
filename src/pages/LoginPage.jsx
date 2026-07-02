import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Hash, KeyRound, Shield, Zap,
  MessageSquare, BarChart3, ArrowRight, CheckCircle, ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const ADMIN_TENANT_ID = import.meta.env.VITE_ADMIN_TENANT_ID || 'dreamline44';

const FEATURES = [
  { icon: ShoppingCart,  label: 'Orders & payments on autopilot',       desc: 'Customers order via WhatsApp, payments handled automatically' },
  { icon: MessageSquare, label: 'AI-powered 24/7 customer replies',     desc: 'Never miss a message — even at 3am' },
  { icon: BarChart3,     label: 'Real-time analytics dashboard',        desc: 'Track revenue, orders and customers live' },
  { icon: Zap,           label: 'Set up in minutes, not weeks',         desc: 'No developers needed — just your WhatsApp number' },
];

const STATS = [
  { value: '10k+', label: 'Messages handled daily' },
  { value: '98%',  label: 'Bot accuracy rate' },
  { value: '24/7', label: 'Always on' },
];

// ── Inline responsive styles injected once ────────────────────────────────────
const CSS = `
  .ws-login-root {
    min-height: 100vh;
    display: flex;
    background: var(--bg-page);
  }

  /* ── Left hero panel ── */
  .ws-hero {
    display: none; /* hidden on mobile */
    flex-direction: column;
    justify-content: center;
    padding: 48px 52px;
    background: linear-gradient(160deg, var(--green-800) 0%, var(--green-950) 100%);
    position: relative;
    overflow: hidden;
  }

  /* ── Right form panel ── */
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
    max-width: 420px;
  }

  /* Mobile: show the mini hero header above the form */
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

  /* Desktop (≥ 900px): side-by-side */
  @media (min-width: 900px) {
    .ws-hero {
      display: flex;
      width: 50%;
      max-width: 580px;
      min-height: 100vh;
      position: sticky;
      top: 0;
    }
    .ws-form-panel {
      padding: 48px 40px;
    }
    .ws-mobile-hero {
      display: none !important;
    }
  }

  /* Large desktop */
  @media (min-width: 1280px) {
    .ws-hero { width: 52%; }
    .ws-form-panel { padding: 60px 56px; }
  }

  .ws-input-focus:focus-within label {
    color: var(--primary);
  }

  @keyframes ws-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ws-fade-up {
    animation: ws-fade-up 0.45s ease both;
  }
  .ws-fade-up:nth-child(1) { animation-delay: 0.05s; }
  .ws-fade-up:nth-child(2) { animation-delay: 0.12s; }
  .ws-fade-up:nth-child(3) { animation-delay: 0.18s; }
  .ws-fade-up:nth-child(4) { animation-delay: 0.24s; }
  .ws-fade-up:nth-child(5) { animation-delay: 0.30s; }
  .ws-fade-up:nth-child(6) { animation-delay: 0.36s; }
`;

function FormInput({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, rightSlot, focused, onFocus, onBlur }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.8rem', fontWeight: 700,
        color: focused ? 'var(--primary)' : 'var(--text-secondary)',
        marginBottom: 7, transition: 'color 0.15s',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: focused ? 'var(--primary)' : 'var(--text-muted)',
          pointerEvents: 'none', transition: 'color 0.15s',
        }} />
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={onFocus} onBlur={onBlur}
          style={{
            width: '100%', padding: `12px ${rightSlot ? '44px' : '13px'} 12px 40px`,
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
    </div>
  );
}

export default function LoginPage() {
  const navigate    = useNavigate();
  const { login }   = useAuth();
  const { adminLogin } = useAdmin();
  const [tenantId, setTenantId] = useState('');
  const [apiKey,   setApiKey]   = useState('');
  const [showKey,  setShowKey]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focusId,  setFocusId]  = useState(false);
  const [focusKey, setFocusKey] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!tenantId.trim() || !apiKey.trim()) {
      toast.error('Please enter both Tenant ID and API Key');
      return;
    }
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
    <>
      <style>{CSS}</style>

      <div className="ws-login-root">

        {/* ══ LEFT — Hero (desktop only) ══════════════════════════════════════ */}
        <div className="ws-hero">
          {/* Background decorative orbs */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '45%', right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(74,222,128,0.06)', pointerEvents: 'none' }} />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 52 }}>
            <Logo size={46} light />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.03em' }}>
              WhatSales
            </span>
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 24, alignSelf: 'flex-start',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-300)', animation: 'pulse 2s infinite', display: 'block' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WhatsApp AI Platform</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', lineHeight: 1.1,
            color: '#fff', letterSpacing: '-0.04em', marginBottom: 16,
          }}>
            Turn conversations<br />into revenue
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, marginBottom: 40, maxWidth: 400 }}>
            Automate orders, bookings, and customer support with an AI bot that works around the clock.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 44 }}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--r-bubble)', flexShrink: 0,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
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

          {/* Stats strip */}
          <div style={{
            display: 'flex', gap: 0,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--r-lg)', overflow: 'hidden',
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                flex: 1, padding: '14px 16px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: i === 1 ? '#e0ac4f' : 'var(--green-300)', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ RIGHT — Form panel ══════════════════════════════════════════════ */}
        <div className="ws-form-panel">

          {/* Mobile-only compact hero header */}
          <div className="ws-mobile-hero">
            {/* Subtle orbs */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -20, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16, position: 'relative' }}>
              <Logo size={40} light />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.03em' }}>WhatSales</span>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 99, padding: '4px 12px', marginBottom: 14,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-300)', animation: 'pulse 2s infinite', display: 'block' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WhatsApp AI Platform</span>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 6vw, 1.9rem)',
              fontWeight: 800, color: '#fff', letterSpacing: '-0.04em',
              lineHeight: 1.15, marginBottom: 10, position: 'relative',
            }}>
              Turn conversations<br />into revenue
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 300, position: 'relative' }}>
              Automate orders &amp; customer support with an AI bot that works 24/7.
            </p>

            {/* Mini feature chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18, justifyContent: 'center', position: 'relative' }}>
              {FEATURES.slice(0, 3).map(({ icon: Icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 99, padding: '5px 10px',
                }}>
                  <Icon size={11} color="var(--green-300)" />
                  <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.82)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label.split(' ').slice(0,3).join(' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Form card ── */}
          <div className="ws-form-inner">

            {/* Desktop-only form header (brand mark above form on wide screens) */}
            <div style={{ marginBottom: 32, display: 'none' }} className="ws-desktop-form-header">
              {/* hidden — brand is in hero panel on desktop */}
            </div>

            {/* Form heading */}
            <div style={{ marginBottom: 28 }} className="ws-fade-up">
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 1.9rem)',
                fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 6,
              }}>
                Sign in
              </h2>
              <p style={{ fontSize: '0.855rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Enter your credentials to access your dashboard
              </p>
            </div>

            {/* The form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="ws-fade-up">
                <FormInput
                  label="Tenant ID"
                  icon={Hash}
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                  placeholder="your-business-id"
                  autoComplete="username"
                  focused={focusId}
                  onFocus={() => setFocusId(true)}
                  onBlur={() => setFocusId(false)}
                />
              </div>

              <div className="ws-fade-up">
                <FormInput
                  label="API Key"
                  icon={KeyRound}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••••"
                  autoComplete="current-password"
                  focused={focusKey}
                  onFocus={() => setFocusKey(true)}
                  onBlur={() => setFocusKey(false)}
                  rightSlot={
                    <button type="button" onClick={() => setShowKey(v => !v)} style={{
                      color: 'var(--text-muted)', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', padding: 2,
                    }}>
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
              </div>

              {/* Admin hint */}
              <div className="ws-fade-up" style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '10px 13px',
                background: 'var(--purple-dim)',
                border: '1.5px solid rgba(124,58,237,0.15)',
                borderRadius: 'var(--r-md)',
              }}>
                <Shield size={13} color="var(--purple)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--purple)', lineHeight: 1.5 }}>
                  Use your Super Admin credentials to access the admin panel.
                </p>
              </div>

              {/* Submit */}
              <div className="ws-fade-up">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px 16px',
                    background: loading ? 'var(--primary-dark)' : 'var(--primary)',
                    color: '#fff', border: 'none', borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
                    boxShadow: '0 2px 10px rgba(10,122,60,0.35)',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,122,60,0.4)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--primary-dark)' : 'var(--primary)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(10,122,60,0.35)'; }}
                >
                  {loading
                    ? <><Spinner size={17} color="#fff" /><span>Signing in…</span></>
                    : <><span>Sign in</span><ArrowRight size={17} /></>
                  }
                </button>
              </div>
            </form>

            {/* Footer links */}
            <div className="ws-fade-up">
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Don't have credentials?{' '}
                <a href="mailto:support@whatsales.app" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  Contact your administrator
                </a>
              </p>

              <div style={{
                marginTop: 20, padding: '12px 14px',
                background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)',
              }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>How to sign in:</strong>{' '}
                  Your Tenant ID and API key are provided when your account is created. The API key is shown{' '}
                  <strong style={{ color: 'var(--text-secondary)' }}>once only</strong> — store it securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
