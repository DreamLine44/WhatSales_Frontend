import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { WhatsalesLogo } from '../App';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Key, Hash, Shield, Zap, BarChart3, MessageSquare } from 'lucide-react';
import { useAdmin } from '../store/AdminContext';

// Read once at module level — these never change between renders
const ADMIN_TENANT_ID = import.meta.env.VITE_ADMIN_TENANT_ID || 'whatsales-admin';
const ADMIN_API_KEY   = import.meta.env.VITE_ADMIN_API_KEY   || '';
const ADMIN_KEY_CONFIGURED = Boolean(ADMIN_API_KEY) &&
  !ADMIN_API_KEY.startsWith('REPLACE_') &&
  ADMIN_API_KEY !== 'your_admin_key_here';

const FEATURES = [
  { icon: Zap,          label: 'Orders & payments on autopilot'    },
  { icon: MessageSquare, label: 'AI-powered 24/7 customer replies'  },
  { icon: BarChart3,    label: 'Real-time analytics dashboard'      },
];

export default function LoginPage() {
  const { login }      = useAuth();
  const { adminLogin } = useAdmin();
  const navigate       = useNavigate();
  const [form, setForm]   = useState({ apiKey: '', tenantId: '' });
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [focused, setFocused] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    if (!form.apiKey.trim() || !form.tenantId.trim()) {
      toast.error('Both API key and Tenant ID are required');
      return;
    }
    setLoading(true);
    try {
      if (form.tenantId.trim() === ADMIN_TENANT_ID) {
        if (!ADMIN_KEY_CONFIGURED) {
          toast.error('Admin login not configured — set VITE_ADMIN_API_KEY in your .env');
          return;
        }
        if (form.apiKey.trim() !== ADMIN_API_KEY) {
          toast.error('Invalid admin API key');
          return;
        }
        adminLogin(form.apiKey.trim());
        navigate('/admin');
        return;
      }
      await login(form.apiKey.trim(), form.tenantId.trim());
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Invalid API key or Tenant ID'
        : err.response?.status === 403
          ? 'Access denied — check your credentials'
          : err.response?.data?.error || 'Connection failed — check your credentials and try again';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      {/* Background shapes */}
      <div style={blob1} />
      <div style={blob2} />
      <div style={blob3} />

      <div style={wrapper}>
        {/* ── Left panel ── */}
        <div style={leftPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 52 }}>
            <WhatsalesLogo size={40} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.03em' }}>
              WhatSales
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(159,224,180,0.12)', border: '1px solid rgba(159,224,180,0.22)', borderRadius: 99, padding: '4px 12px', marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(159,224,180,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WhatsApp AI Platform</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.18, letterSpacing: '-0.04em', marginBottom: 16 }}>
              Turn conversations into revenue
            </h2>
            <p style={{ color: 'rgba(159,224,180,0.65)', fontSize: '0.94rem', lineHeight: 1.7 }}>
              Automate orders, bookings, and customer support with an AI bot that works 24/7 for your business.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(159,224,180,0.10)', border: '1px solid rgba(159,224,180,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color="var(--mint)" />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.875rem' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(159,224,180,0.7)', lineHeight: 1.65 }}>
              <strong style={{ color: 'rgba(255,255,255,0.9)' }}>How to sign in:</strong><br />
              Your Tenant ID and API key are provided when your account is created by the admin. The API key is shown <strong style={{ color: 'rgba(255,255,255,0.75)' }}>once only</strong> — store it securely.
            </p>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div style={rightPanel}>
          <div style={{ maxWidth: 400, width: '100%' }}>
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }} className="mobile-logo">
              <WhatsalesLogo size={34} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>WhatSales</span>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Sign in
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter your credentials to access your dashboard</p>
            </div>

            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Tenant ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tenant ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'tid' ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.14s', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={form.tenantId}
                    onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))}
                    onFocus={() => setFocused('tid')}
                    onBlur={() => setFocused('')}
                    placeholder="your-business-id"
                    required
                    autoComplete="username"
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>

              {/* API Key */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <label style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused === 'key' ? 'var(--primary)' : 'var(--text-muted)', transition: 'color 0.14s', pointerEvents: 'none' }} />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.apiKey}
                    onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                    onFocus={() => setFocused('key')}
                    onBlur={() => setFocused('')}
                    placeholder="••••••••••••••••"
                    required
                    autoComplete="current-password"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 5 }}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Admin hint */}
              {ADMIN_KEY_CONFIGURED && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: 'var(--purple-dim)', borderRadius: 8, border: '1px solid rgba(112,48,224,0.14)' }}>
                  <Shield size={13} color="var(--purple)" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--lavender-text)', lineHeight: 1.5, margin: 0 }}>
                    Use Tenant ID <strong>{ADMIN_TENANT_ID}</strong> to access the Super Admin panel.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.apiKey.trim() || !form.tenantId.trim()}
                style={{
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 20px',
                  background: loading || !form.apiKey.trim() || !form.tenantId.trim() ? 'var(--primary)' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: loading || !form.apiKey.trim() || !form.tenantId.trim() ? 'not-allowed' : 'pointer',
                  opacity: !form.apiKey.trim() || !form.tenantId.trim() ? 0.5 : 1,
                  boxShadow: '0 4px 16px rgba(30,138,66,0.24)',
                  transition: 'all 0.14s ease',
                  letterSpacing: '-0.01em',
                }}
                onMouseEnter={e => { if (!loading && form.apiKey && form.tenantId) e.currentTarget.style.background = 'var(--primary-hover)'; }}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p style={{ marginTop: 28, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Don't have credentials?{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Contact your WhatSales administrator.</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-logo { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const page = {
  minHeight: '100vh',
  background: 'var(--bg-base)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  position: 'relative',
  overflow: 'hidden',
};

const blob1 = {
  position: 'absolute',
  top: -120,
  left: -120,
  width: 480,
  height: 480,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(30,138,66,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const blob2 = {
  position: 'absolute',
  bottom: -100,
  right: -80,
  width: 380,
  height: 380,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(30,138,66,0.07) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const blob3 = {
  position: 'absolute',
  top: '40%',
  left: '45%',
  width: 260,
  height: 260,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(159,224,180,0.05) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const wrapper = {
  display: 'flex',
  width: '100%',
  maxWidth: 960,
  background: 'var(--bg-surface)',
  borderRadius: 'var(--radius-2xl)',
  border: '1.5px solid var(--border)',
  boxShadow: 'var(--shadow-lg)',
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1,
  minHeight: 580,
  flexWrap: 'wrap',
};

const leftPanel = {
  flex: '1 1 380px',
  background: 'linear-gradient(160deg, #0f2216 0%, #162e1e 40%, #0d2018 100%)',
  padding: '44px 40px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
};

const rightPanel = {
  flex: '1 1 340px',
  padding: '44px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
