import { Component } from 'react';
import { WhatsalesLogo } from '../App';

/**
 * Top-level error boundary.
 * Catches unhandled render errors anywhere in the tree and shows
 * a friendly fallback instead of a blank screen.
 *
 * Usage in main.jsx:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd forward this to a monitoring service (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

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
          maxWidth: 460,
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

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.35rem',
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 10,
          }}>
            Something went wrong
          </h2>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            lineHeight: 1.65,
            marginBottom: 10,
          }}>
            An unexpected error occurred. Refreshing the page usually fixes it.
          </p>

          {this.state.error?.message && (
            <div style={{
              background: 'var(--red-dim)',
              border: '1px solid rgba(220,53,53,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: 24,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: 'var(--red)',
              wordBreak: 'break-all',
              textAlign: 'left',
            }}>
              {this.state.error.message}
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
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
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
