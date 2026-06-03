import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hash, KeyRound, Shield, Zap, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { useAdmin } from '../store/AdminContext.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const ADMIN_TENANT_ID = 'dreamline44';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { adminLogin } = useAdmin();
  const [tenantId, setTenantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('hero'); // 'hero' | 'form'

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        await login(tenantId, apiKey);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Check your Tenant ID and API Key.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, label: 'Orders & payments on autopilot' },
    { icon: MessageSquare, label: 'AI-powered 24/7 customer replies' },
    { icon: BarChart3, label: 'Real-time analytics dashboard' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Hero card — matches screenshot 1 */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--green-800)',
        borderRadius: '0 0 28px 28px',
        padding: '40px 28px 48px',
        marginBottom: -16,
      }}>
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <Logo size={48} light />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>WhatSales</span>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 99, padding: '6px 14px', marginBottom: 22,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green-300)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>WhatsApp AI Platform</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800,
          color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16,
        }}>
          Turn conversations<br />into revenue
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 32 }}>
          Automate orders, bookings, and customer support with an AI bot that works 24/7 for your business.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {features.map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={17} color="rgba(255,255,255,0.9)" />
              </div>
              <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* How to sign in note */}
        <div style={{
          marginTop: 32, padding: '14px 16px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
        }}>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            <strong style={{ color: '#fff' }}>How to sign in:</strong> Your Tenant ID and API key are provided when your account is created by the admin. The API key is shown <strong style={{ color: '#fff' }}>once only</strong> — store it securely.
          </p>
        </div>
      </div>

      {/* Sign-in form card — matches screenshot 2 */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '36px 28px 48px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
        zIndex: 1,
        minHeight: 480,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          <Logo size={38} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>WhatSales</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.025em' }}>Sign in</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 28 }}>Enter your credentials to access your dashboard</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tenant ID */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Tenant ID</label>
            <div style={{ position: 'relative' }}>
              <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
                placeholder="your-business-id"
                autoComplete="username"
                style={{
                  width: '100%', padding: '13px 13px 13px 42px',
                  border: '1.5px solid var(--border-mid)', borderRadius: 12,
                  fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                  background: '#fff', color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
              />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>API Key</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="••••••••••••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '13px 44px 13px 42px',
                  border: '1.5px solid var(--border-mid)', borderRadius: 12,
                  fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
                  background: '#fff', color: 'var(--text-primary)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Admin hint */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px',
            background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 10,
          }}>
            <Shield size={15} color="var(--purple)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--purple)', lineHeight: 1.5 }}>
              Use Tenant ID <strong>{ADMIN_TENANT_ID}</strong> to access the Super Admin panel.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: 12,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'opacity 0.15s',
              marginTop: 4,
            }}
          >
            {loading ? <Spinner size={18} color="#fff" /> : (
              <>Sign in <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have credentials?{' '}
          <a href="mailto:support@whatsales.app" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Contact your WhatSales administrator.
          </a>
        </p>
      </div>
    </div>
  );
}
