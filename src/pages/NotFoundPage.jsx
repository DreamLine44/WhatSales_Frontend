import { useNavigate } from 'react-router-dom';
import { WhatsalesLogo } from '../App';
import { ArrowRight, Home } from 'lucide-react';

export default function NotFoundPage() {
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
        maxWidth: 420,
        width: '100%',
        background: 'var(--bg-surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-2xl)',
        padding: '44px 36px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <WhatsalesLogo size={44} />
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4rem',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          color: 'var(--border-strong)',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.3rem',
          letterSpacing: '-0.03em',
          marginBottom: 10,
        }}>
          Page not found
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          lineHeight: 1.65,
          marginBottom: 32,
        }}>
          The page you're looking for doesn't exist or has been moved.
          Head back to the dashboard to continue.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
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
          <Home size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
