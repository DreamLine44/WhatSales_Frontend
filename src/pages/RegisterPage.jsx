/**
 * RegisterPage — this backend has no self-registration.
 * Tenant accounts are created by a super-admin via POST /admin/tenants.
 * The admin then provides the tenant with their Tenant ID and API key.
 */
import { useNavigate } from 'react-router-dom';
import { WhatsalesLogo } from '../App';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '24px 16px',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'var(--bg-surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-2xl)',
        padding: '40px 36px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <WhatsalesLogo size={48} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.4rem',
          letterSpacing: '-0.03em',
          marginBottom: 12,
        }}>
          Accounts are admin-provisioned
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          lineHeight: 1.65,
          marginBottom: 28,
        }}>
          WhatSales does not offer self-registration. New business accounts are
          created by a <strong style={{ color: 'var(--text-secondary)' }}>WhatSales administrator</strong>.
          Once your account is set up, you'll receive a <strong>Tenant ID</strong> and
          an <strong>API key</strong> to sign in.
        </p>

        <div style={{
          background: 'var(--primary-dim)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 28,
          textAlign: 'left',
        }}>
          Already have credentials?{' '}
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Use the Sign In page below.
          </span>
          <br />
          Need an account?{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Contact your WhatSales administrator.
          </span>
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '11px 24px',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(30,138,66,0.22)',
          }}
        >
          Go to Sign In <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
