// ── WhatSales UI Kit — upgraded ───────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { Loader2, Copy, CheckCircle2, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ size = 32, light = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11"
        fill={light ? 'rgba(255,255,255,0.14)' : 'var(--primary)'}
        stroke={light ? 'rgba(255,255,255,0.22)' : 'none'} strokeWidth="1.5"
      />
      <path d="M20 8C13.373 8 8 13.373 8 20c0 2.144.566 4.155 1.556 5.894L8 32l6.293-1.513A11.94 11.94 0 0020 32c6.627 0 12-5.373 12-12S26.627 8 20 8z"
        fill={light ? 'rgba(255,255,255,0.95)' : 'white'} />
      <path d="M15 18h10M15 22h7"
        stroke={light ? 'var(--primary-dark)' : 'var(--primary)'}
        strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', loading = false, fullWidth = false, style = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s', position: 'relative',
    borderRadius: 'var(--r-md)', whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    opacity: (loading || props.disabled) ? 0.65 : 1,
    letterSpacing: '-0.01em',
  };
  const sizes = {
    xs: { padding: '5px 10px', fontSize: '0.75rem' },
    sm: { padding: '7px 13px', fontSize: '0.815rem' },
    md: { padding: '10px 18px', fontSize: '0.875rem' },
    lg: { padding: '13px 24px', fontSize: '0.95rem' },
  };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', boxShadow: '0 1px 3px rgba(10,122,60,0.3)' },
    danger:  { background: 'var(--red)', color: '#fff', boxShadow: '0 1px 3px rgba(220,38,38,0.25)' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border-mid)' },
    soft:    { background: 'var(--primary-dim)', color: 'var(--primary)', border: '1.5px solid var(--border-accent)' },
    amber:   { background: 'var(--amber)', color: '#fff', boxShadow: '0 1px 3px rgba(217,119,6,0.3)' },
    outline: { background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {loading && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, hint, error, style = {}, wrapStyle = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...wrapStyle }}>
      {label && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: focused ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'color 0.15s',
        }}>{label}</label>
      )}
      <input
        style={{
          width: '100%', padding: '10px 13px',
          border: `1.5px solid ${error ? 'var(--red)' : focused ? 'var(--primary)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
          ...style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        {...props}
      />
      {hint && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.74rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} />{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function Textarea({ label, hint, rows = 3, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: focused ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'color 0.15s',
        }}>{label}</label>
      )}
      <textarea
        rows={rows}
        style={{
          width: '100%', padding: '10px 13px',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {hint && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, hint, style = {}, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: focused ? 'var(--primary)' : 'var(--text-secondary)',
          transition: 'color 0.15s',
        }}>{label}</label>
      )}
      <select
        style={{
          width: '100%', padding: '10px 13px',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.9rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23627065' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
          paddingRight: 36,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      >
        {children}
      </select>
      {hint && <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      {(label || hint) && (
        <div>
          {label && <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>}
          {hint  && <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: checked ? 'var(--primary)' : 'var(--border-mid)',
          transition: 'background 0.2s',
          position: 'relative',
          boxShadow: checked ? '0 0 0 3px var(--primary-dim)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          left: checked ? 23 : 3,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, pad = true, ...props }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)',
      padding: pad ? '20px 22px' : 0,
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = 'green', children, dot = false, style = {} }) {
  const colors = {
    green:  { bg: '#dcfce7', text: '#15803d' },
    amber:  { bg: '#fef3c7', text: '#b45309' },
    red:    { bg: '#fee2e2', text: '#dc2626' },
    blue:   { bg: '#dbeafe', text: '#1d4ed8' },
    purple: { bg: '#ede9fe', text: '#7c3aed' },
    gray:   { bg: 'var(--bg-overlay)', text: 'var(--text-muted)' },
    teal:   { bg: '#ccfbf1', text: '#0f766e' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
      borderRadius: 'var(--r-full)', background: c.bg, color: c.text,
      letterSpacing: '0.01em', ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.text, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  ACTIVE:   { color: 'green',  label: 'Active' },
  PENDING:  { color: 'amber',  label: 'Pending' },
  INACTIVE: { color: 'gray',   label: 'Inactive' },
  SUSPENDED:{ color: 'red',    label: 'Suspended' },
  UNKNOWN:  { color: 'amber',  label: 'Pending' },
  pending:  { color: 'amber',  label: 'Pending' },
  confirmed:{ color: 'green',  label: 'Confirmed' },
  completed:{ color: 'blue',   label: 'Completed' },
  cancelled:{ color: 'red',    label: 'Cancelled' },
  rejected: { color: 'red',    label: 'Rejected' },
  payment_failed: { color: 'red', label: 'Payment Failed' },
  payment_pending_verification: { color: 'amber', label: 'Awaiting Payment' },
};
export function StatusBadge({ status, style }) {
  const s = STATUS_MAP[status] || { color: 'gray', label: status || 'Unknown' };
  return <Badge color={s.color} dot style={style}>{s.label}</Badge>;
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, icon: Icon, back }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {Icon && (
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={20} color="var(--primary)" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.45rem)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>{title}</h1>
            {subtitle && (
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 24px' }}>
      {Icon && (
        <div style={{
          width: 60, height: 60, borderRadius: 'var(--r-xl)',
          background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Icon size={26} color="var(--text-ghost)" />
        </div>
      )}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '-0.02em' }}>{title}</h3>
      {description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto', lineHeight: 1.65 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon: Icon, color = 'green', trend }) {
  const colors = {
    green:  { icon: '#dcfce7',  text: '#15803d' },
    amber:  { icon: '#fef3c7',  text: '#b45309' },
    blue:   { icon: '#dbeafe',  text: '#1d4ed8' },
    purple: { icon: '#ede9fe',  text: '#7c3aed' },
    red:    { icon: '#fee2e2',  text: '#dc2626' },
    teal:   { icon: '#ccfbf1',  text: '#0f766e' },
    gray:   { icon: 'var(--bg-overlay)', text: 'var(--text-muted)' },
  };
  const c = colors[color] || colors.green;
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '18px 20px',
      boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'flex-start', gap: 14,
      transition: 'box-shadow 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sh-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {Icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--r-md)',
          background: c.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={20} color={c.text} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 5, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--primary)' }) {
  return <Loader2 size={size} color={color} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style = {} }) {
  return <div style={{ height: 1, background: 'var(--border)', width: '100%', ...style }} />;
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ children, onClose, maxWidth = 540, title }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(4,46,20,0.45)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
        padding: title ? '0' : '28px',
        boxShadow: 'var(--sh-xl)',
        border: '1.5px solid var(--border)',
        maxHeight: '94vh', overflowY: 'auto',
        animation: 'slideUp 0.22s ease',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1.5px solid var(--border)',
            position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1,
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>{title}</h3>
            <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: title ? '24px' : 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  if (!open) return null;
  return (
    <Modal onClose={() => !loading && onClose()} maxWidth={400}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, letterSpacing: '-0.02em' }}>{title}</h3>
          {message && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{message}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" fullWidth onClick={() => !loading && onClose()} disabled={loading}>Cancel</Btn>
          <Btn variant={variant} fullWidth onClick={onConfirm} loading={loading} disabled={loading}>{confirmLabel}</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Copy field ────────────────────────────────────────────────────────────────
export function CopyField({ label, value, secret = false }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '9px 12px',
      }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {secret && !visible ? '•'.repeat(20) : value}
        </span>
        {secret && (
          <button onClick={() => setVisible(v => !v)} style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={copy} style={{
          color: copied ? 'var(--primary)' : 'var(--text-muted)',
          display: 'flex', cursor: 'pointer', flexShrink: 0, padding: 2,
          transition: 'color 0.15s',
        }}>
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
export function SectionHeading({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{children}</h3>
      {action}
    </div>
  );
}

// ── Info banner ───────────────────────────────────────────────────────────────
export function InfoBanner({ type = 'info', children, style = {} }) {
  const types = {
    info:    { bg: 'var(--blue-dim)',   border: 'rgba(37,99,235,0.2)',    color: 'var(--blue)' },
    warning: { bg: 'var(--amber-dim)',  border: 'rgba(217,119,6,0.2)',    color: 'var(--amber)' },
    error:   { bg: 'var(--red-dim)',    border: 'rgba(220,38,38,0.2)',    color: 'var(--red)' },
    success: { bg: 'var(--primary-dim)',border: 'var(--border-accent)',   color: 'var(--primary)' },
  };
  const t = types[type] || types.info;
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--r-md)',
      background: t.bg, border: `1.5px solid ${t.border}`,
      fontSize: '0.845rem', color: t.color, lineHeight: 1.55,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '4px',
      background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
      border: '1.5px solid var(--border)', width: 'fit-content',
      flexWrap: 'wrap',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: active === tab.value ? 'var(--bg-surface)' : 'transparent',
            color: active === tab.value ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: active === tab.value ? 'var(--sh-xs)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
