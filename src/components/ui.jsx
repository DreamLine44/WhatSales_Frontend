// Shared UI primitives used across the app
import { Loader2 } from 'lucide-react';

// ── Logo ────────────────────────────────────────────────────────────────────
export function Logo({ size = 32, light = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11"
        fill={light ? 'rgba(255,255,255,0.12)' : 'var(--primary)'}
        stroke={light ? 'rgba(255,255,255,0.2)' : 'none'}
        strokeWidth="1.5"
      />
      <path
        d="M20 8C13.373 8 8 13.373 8 20c0 2.144.566 4.155 1.556 5.894L8 32l6.293-1.513A11.94 11.94 0 0020 32c6.627 0 12-5.373 12-12S26.627 8 20 8z"
        fill={light ? 'rgba(255,255,255,0.95)' : 'white'}
      />
      <path d="M15 18h10M15 22h7"
        stroke={light ? 'var(--primary-dark)' : 'var(--primary)'}
        strokeWidth="2.2" strokeLinecap="round"
      />
    </svg>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', loading = false, fullWidth = false, style = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s', position: 'relative',
    borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    opacity: (loading || props.disabled) ? 0.65 : 1,
  };
  const sizes = {
    sm: { padding: '7px 13px', fontSize: '0.8rem' },
    md: { padding: '10px 18px', fontSize: '0.875rem' },
    lg: { padding: '13px 24px', fontSize: '0.95rem' },
  };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff' },
    danger:  { background: 'var(--red)', color: '#fff' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border-mid)' },
    soft:    { background: 'var(--primary-dim)', color: 'var(--primary)' },
    amber:   { background: 'var(--amber)', color: '#fff' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, hint, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>}
      <input
        style={{
          width: '100%', padding: '10px 13px', border: `1.5px solid ${error ? 'var(--red)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          transition: 'border-color 0.15s', ...style,
        }}
        onFocus={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border-mid)'}
        {...props}
      />
      {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>{error}</span>}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, hint, style = {}, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>}
      <select
        style={{
          width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)',
          borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          cursor: 'pointer', ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, ...props }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px 22px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }} {...props}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = 'green', children, dot = false, style = {} }) {
  const colors = {
    green:  { bg: 'var(--green-50)',  text: '#15803d' },
    amber:  { bg: 'var(--amber-dim)', text: 'var(--amber)' },
    red:    { bg: 'var(--red-dim)',   text: 'var(--red)' },
    blue:   { bg: 'var(--blue-dim)',  text: 'var(--blue)' },
    purple: { bg: 'var(--purple-dim)',text: 'var(--purple)' },
    gray:   { bg: 'var(--bg-overlay)',text: 'var(--text-muted)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 9px',
      borderRadius: 'var(--radius-full)', background: c.bg, color: c.text, ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.text, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  ACTIVE:     { color: 'green', label: 'Active' },
  PENDING:    { color: 'amber', label: 'Pending Setup' },
  INACTIVE:   { color: 'gray',  label: 'Inactive' },
  SUSPENDED:  { color: 'red',   label: 'Suspended' },
  UNKNOWN:    { color: 'amber', label: 'Pending Setup' },
  pending:    { color: 'amber', label: 'Pending' },
  confirmed:  { color: 'green', label: 'Confirmed' },
  completed:  { color: 'blue',  label: 'Completed' },
  cancelled:  { color: 'red',   label: 'Cancelled' },
  rejected:   { color: 'red',   label: 'Rejected' },
  payment_failed: { color: 'red', label: 'Payment Failed' },
  payment_pending_verification: { color: 'amber', label: 'Awaiting Payment' },
};

export function StatusBadge({ status, style }) {
  const s = STATUS_MAP[status] || { color: 'gray', label: status || 'Unknown' };
  return <Badge color={s.color} dot style={style}>{s.label}</Badge>;
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && (
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color="var(--primary)" />
          </div>
        )}
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      {Icon && (
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={24} color="var(--text-ghost)" />
        </div>
      )}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'green' }) {
  const colors = {
    green:  { bg: 'var(--green-50)',    text: '#15803d',       icon: 'rgba(21,128,61,0.12)' },
    amber:  { bg: 'var(--amber-dim)',   text: 'var(--amber)',  icon: 'rgba(217,119,6,0.12)' },
    blue:   { bg: 'var(--blue-dim)',    text: 'var(--blue)',   icon: 'rgba(37,99,235,0.12)' },
    purple: { bg: 'var(--purple-dim)',  text: 'var(--purple)', icon: 'rgba(124,58,237,0.12)' },
    red:    { bg: 'var(--red-dim)',     text: 'var(--red)',    icon: 'rgba(220,38,38,0.12)' },
  };
  const c = colors[color] || colors.green;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      {Icon && (
        <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: c.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={c.text} />
        </div>
      )}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--primary)' }) {
  return <Loader2 size={size} color={color} style={{ animation: 'spin 0.8s linear infinite' }} />;
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ children, onClose, maxWidth = 540 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'rgba(5,20,10,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        padding: '28px', boxShadow: 'var(--shadow-lg)',
        border: '1.5px solid var(--border)', maxHeight: '92vh', overflowY: 'auto',
        animation: 'slideUp 0.2s ease',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  if (!open) return null;
  return (
    <Modal onClose={() => !loading && onClose()} maxWidth={400}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{title}</h3>
      {message && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 22 }}>{message}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="ghost" fullWidth onClick={() => !loading && onClose()} disabled={loading}>Cancel</Btn>
        <Btn variant={variant} fullWidth onClick={onConfirm} loading={loading} disabled={loading}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ── Copy field ────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Copy, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function CopyField({ label, value, secret = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-overlay)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px' }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {secret && !visible ? '••••••••••••••••••••' : value}
        </span>
        {secret && (
          <button onClick={() => setVisible(v => !v)} style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer', flexShrink: 0 }}>
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={copy} style={{ color: copied ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', cursor: 'pointer', flexShrink: 0 }}>
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
