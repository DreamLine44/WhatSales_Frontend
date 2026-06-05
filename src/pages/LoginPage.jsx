import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hash, KeyRound, Shield, Zap, MessageSquare, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const ADMIN_TENANT_ID = import.meta.env.VITE_ADMIN_TENANT_ID || 'dreamline44';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { adminLogin } = useAdmin();
  const [tenantId, setTenantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusId, setFocusId] = useState(false);
  const [focusKey, setFocusKey] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId.trim() || !apiKey.trim()) { toast.error('Please enter both Tenant ID and API Key'); return; }
    setLoading(true);
    try {
      if (tenantId.trim() === ADMIN_TENANT_ID) {
        await adminLogin(apiKey.trim());
        navigate('/admin');
      } else {
        await login(tenantId, apiKey);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const features = [
    { icon: Zap,          label: 'Orders & payments on autopilot' },
    { icon: MessageSquare,label: 'AI-powered 24/7 customer replies' },
    { icon: BarChart3,    label: 'Real-time analytics dashboard' },
  ];

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          background: var(--bg-page);
        }
        /* ── Desktop: left hero panel + right form ── */
        .login-hero {
          flex: 1;
          min-height: 100vh;
          background: linear-gradient(160deg, var(--green-800) 0%, var(--green-950) 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          position: relative;
          overflow: hidden;
        }
        .login-form-side {
          width: 480px;
          min-height: 100vh;
          background: var(--bg-surface);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 48px;
          box-shadow: -4px 0 40px rgba(0,0,0,0.08);
          overflow-y: auto;
        }
        /* ── Mobile: stacked card layout ── */
        @media (max-width: 900px) {
          .login-root { flex-direction: column; }
          .login-hero {
            min-height: auto;
            padding: 36px 28px 52px;
            border-radius: 0 0 28px 28px;
          }
          .login-form-side {
            width: 100%;
            min-height: auto;
            padding: 36px 24px 48px;
            box-shadow: none;
            justify-content: flex-start;
          }
        }
        @media (max-width: 480px) {
          .login-hero { padding: 28px 20px 44px; }
          .login-form-side { padding: 28px 18px 40px; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-content { animation: heroFadeUp 0.5s ease both; }
        .hero-content > * { animation: heroFadeUp 0.5s ease both; }
        .hero-content > *:nth-child(1) { animation-delay: 0.05s; }
        .hero-content > *:nth-child(2) { animation-delay: 0.12s; }
        .hero-content > *:nth-child(3) { animation-delay: 0.18s; }
        .hero-content > *:nth-child(4) { animation-delay: 0.24s; }
        .hero-content > *:nth-child(5) { animation-delay: 0.30s; }
      `}</style>

      <div className="login-root">

        {/* ── LEFT / TOP: Hero panel ── */}
        <div className="login-hero">
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', right: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.025)', pointerEvents: 'none' }} />

          <div className="hero-content" style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <Logo size={44} light />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: '#fff', letterSpacing: '-0.03em' }}>WhatSales</span>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 99, padding: '5px 14px', marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-300)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WhatsApp AI Platform</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800,
              color: '#fff', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 16,
            }}>
              Turn conversations<br />into revenue
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginBottom: 48, maxWidth: 420 }}>
              Automate orders, bookings, and customer support with an AI bot that works 24/7.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {features.map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={17} color="rgba(255,255,255,0.9)" />
                  </div>
                  <span style={{ fontSize: '0.925rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{label}</span>
                  <CheckCircle size={15} color="var(--green-300)" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.85 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT / BOTTOM: Sign-in form ── */}
        <div className="login-form-side">
          <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <Logo size={36} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>WhatSales</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.03em' }}>Sign in</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.5 }}>Enter your credentials to access your dashboard</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tenant ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: focusId ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: 7, transition: 'color 0.15s' }}>
                  Tenant ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text" value={tenantId} onChange={e => setTenantId(e.target.value)}
                    placeholder="your-business-id" autoComplete="username"
                    onFocus={() => setFocusId(true)} onBlur={() => setFocusId(false)}
                    style={{
                      width: '100%', padding: '13px 13px 13px 40px',
                      border: `1.5px solid ${focusId ? 'var(--primary)' : 'var(--border-mid)'}`,
                      borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.925rem',
                      background: '#fff', color: 'var(--text-primary)', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxShadow: focusId ? '0 0 0 3px var(--primary-dim)' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* API Key */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: focusKey ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: 7, transition: 'color 0.15s' }}>
                  API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••••" autoComplete="current-password"
                    onFocus={() => setFocusKey(true)} onBlur={() => setFocusKey(false)}
                    style={{
                      width: '100%', padding: '13px 42px 13px 40px',
                      border: `1.5px solid ${focusKey ? 'var(--primary)' : 'var(--border-mid)'}`,
                      borderRadius: 'var(--r-md)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem',
                      background: '#fff', color: 'var(--text-primary)', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxShadow: focusKey ? '0 0 0 3px var(--primary-dim)' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowKey(v => !v)} style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
                  }}>
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Admin hint */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '10px 13px', background: 'var(--purple-dim)',
                border: '1.5px solid rgba(124,58,237,0.15)', borderRadius: 'var(--r-md)',
              }}>
                <Shield size={14} color="var(--purple)" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--purple)', lineHeight: 1.5 }}>
                  Use Tenant ID <strong>{ADMIN_TENANT_ID}</strong> to access the Super Admin panel.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'var(--primary-dark)' : 'var(--primary)',
                  color: '#fff', border: 'none', borderRadius: 'var(--r-md)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.15s, box-shadow 0.15s', marginTop: 4,
                  boxShadow: '0 2px 8px rgba(10,122,60,0.35)',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--primary-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--primary-dark)' : 'var(--primary)'; }}
              >
                {loading ? <Spinner size={17} color="#fff" /> : <><span>Sign in</span><ArrowRight size={17} /></>}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Don't have credentials?{' '}
              <a href="mailto:support@whatsales.app" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Contact your administrator
              </a>
            </p>

            <div style={{
              marginTop: 28, padding: '13px 14px',
              background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
            }}>
              <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>How to sign in:</strong> Your Tenant ID and API key are provided when your account is created. The API key is shown <strong style={{ color: 'var(--text-secondary)' }}>once only</strong> — store it securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
