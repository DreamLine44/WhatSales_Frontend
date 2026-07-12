import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { Logo, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// [FEATURE-STAFF-1] Landing page for an invite link (e.g.
// https://app.example.com/accept-invite?token=<raw invite token>).
// POST /dashboard/auth/accept-invite — the raw token itself is the credential
// (no separate login needed to reach this page), so this route is public.
export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeInvite } = useAuth();
  const token = searchParams.get('token') || '';

  const [password, setPassword]   = useState('');
  const [confirm,  setConfirm]    = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading,  setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('This invite link is missing its token — ask for a new one.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await completeInvite(token, password);
      toast.success('Account activated — welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'This invite link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-page)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
          <Logo size={34} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>WhatSales</span>
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: 28, boxShadow: 'var(--sh-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle2 size={18} color="var(--primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              Set your password
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
            You've been invited to join a WhatSales team. Choose a password to activate your account.
          </p>

          {!token && (
            <div style={{
              background: 'var(--red-dim)', border: '1.5px solid rgba(220,38,38,0.2)',
              borderRadius: 'var(--r-md)', padding: '10px 12px', fontSize: '0.82rem', color: 'var(--red)', marginBottom: 18,
            }}>
              No invite token found in this link. Ask whoever invited you to resend it — invite links look like
              {' '}<code>…/accept-invite?token=…</code>.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} color="var(--text-ghost)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '11px 40px 11px 38px',
                    borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                    background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                  }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Confirm password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                  borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                  background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              style={{
                width: '100%', padding: '12px 16px', marginTop: 4,
                background: loading || !token ? 'var(--primary-dark)' : 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><Spinner size={16} color="#fff" /><span>Activating…</span></> : <><span>Activate account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8rem' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
