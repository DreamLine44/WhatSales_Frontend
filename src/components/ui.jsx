// ── WhatSales UI Kit — v3 ─────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Loader2, Copy, CheckCircle2, Eye, EyeOff, X, AlertTriangle, Info, CheckCircle, AlertCircle, Search, TrendingUp, TrendingDown } from 'lucide-react';

// ── Hover helper (inline-style hover without CSS classes) ─────────────────────
function useHover() {
  const [hovered, setHovered] = useState(false);
  return [hovered, { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }];
}

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
// Hover is handled via CSS class `ws-btn` injected once into <head>.
const _btnStyleInjected = { done: false };
function injectBtnStyles() {
  if (_btnStyleInjected.done || typeof document === 'undefined') return;
  _btnStyleInjected.done = true;
  const s = document.createElement('style');
  s.textContent = `
    .ws-btn { transition: filter 0.14s, box-shadow 0.14s, transform 0.12s; }
    .ws-btn:not(:disabled):hover { filter: brightness(1.07); box-shadow: 0 2px 8px rgba(0,0,0,0.13); transform: translateY(-1px); }
    .ws-btn:not(:disabled):active { transform: translateY(0); filter: brightness(0.97); box-shadow: none; }
    .ws-btn:disabled { cursor: not-allowed !important; opacity: 0.55 !important; }
    .ws-btn-ghost:not(:disabled):hover { background: var(--bg-overlay) !important; color: var(--text-primary) !important; }
    .ws-btn-outline:not(:disabled):hover { background: var(--primary-dim) !important; }
    .ws-btn-soft:not(:disabled):hover { background: var(--primary-mid) !important; }
  `;
  document.head.appendChild(s);
}

export function Btn({ children, variant = 'primary', size = 'md', loading = false, fullWidth = false, style = {}, className = '', ...props }) {
  injectBtnStyles();
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 7, fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
    border: 'none', position: 'relative',
    borderRadius: 'var(--r-md)', whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    letterSpacing: '-0.01em',
  };
  const sizes = {
    xs: { padding: '5px 10px', fontSize: '0.75rem' },
    sm: { padding: '7px 13px', fontSize: '0.815rem' },
    md: { padding: '10px 18px', fontSize: '0.875rem' },
    lg: { padding: '13px 24px', fontSize: '0.95rem' },
  };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', boxShadow: '0 1px 3px rgba(10,122,60,0.3)', border: 'none' },
    danger:  { background: 'var(--red)', color: '#fff', boxShadow: '0 1px 3px rgba(220,38,38,0.25)', border: 'none' },
    ghost:   { background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border-mid)' },
    soft:    { background: 'var(--primary-dim)', color: 'var(--primary)', border: '1.5px solid var(--border-accent)' },
    amber:   { background: 'var(--amber)', color: '#fff', boxShadow: '0 1px 3px rgba(217,119,6,0.3)', border: 'none' },
    outline: { background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)' },
  };
  const variantClass = { ghost: 'ws-btn-ghost', outline: 'ws-btn-outline', soft: 'ws-btn-soft' }[variant] || '';
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      className={`ws-btn ${variantClass} ${className}`}
      {...props}
    >
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
          boxSizing: 'border-box',
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

// ── Search Input ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…', onClear, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      <Search size={15} style={{
        position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
        color: focused ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none',
        transition: 'color 0.15s',
      }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 36px 10px 40px',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--r-lg)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
          boxSizing: 'border-box',
        }}
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          style={{
            position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 3,
            borderRadius: 4, transition: 'color 0.12s', background: 'none', border: 'none',
          }}
        >
          <X size={13} />
        </button>
      )}
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
export function Toggle({ checked, onChange, label, hint, disabled = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, opacity: disabled ? 0.55 : 1 }}>
      {(label || hint) && (
        <div>
          {label && <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>}
          {hint  && <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
        </div>
      )}
      <button
        role="switch"
        aria-checked={checked}
        title={checked ? 'Turn off' : 'Turn on'}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 46, height: 26, borderRadius: 99, border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
          background: checked ? 'var(--primary)' : 'var(--border-mid)',
          transition: 'background 0.2s, box-shadow 0.15s',
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
export function Card({ children, style = {}, pad = true, hover = false, ...props }) {
  const [hovered, hoverProps] = useHover();
  return (
    <div
      style={{
        background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: hover && hovered ? 'var(--sh-md)' : 'var(--sh-xs)',
        padding: pad ? '20px 22px' : 0,
        transform: hover && hovered ? 'translateY(-1px)' : 'none',
        transition: hover ? 'box-shadow 0.15s, transform 0.15s' : 'none',
        ...style,
      }}
      {...(hover ? hoverProps : {})}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
// All colors use CSS variables — dark-mode safe.
export function Badge({ color = 'green', children, dot = false, style = {} }) {
  const colors = {
    green:  { bg: 'var(--badge-green-bg)',  text: 'var(--badge-green-text)' },
    amber:  { bg: 'var(--badge-amber-bg)',  text: 'var(--badge-amber-text)' },
    red:    { bg: 'var(--badge-red-bg)',    text: 'var(--badge-red-text)' },
    blue:   { bg: 'var(--badge-blue-bg)',   text: 'var(--badge-blue-text)' },
    purple: { bg: 'var(--badge-purple-bg)', text: 'var(--badge-purple-text)' },
    gray:   { bg: 'var(--bg-overlay)',      text: 'var(--text-muted)' },
    teal:   { bg: 'var(--badge-teal-bg)',   text: 'var(--badge-teal-text)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px',
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
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 10, flexWrap: 'wrap', rowGap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, flex: '1 1 0' }}>
          {Icon && (
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--r-md)',
              background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={18} color="var(--primary)" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.1rem, 2.8vw, 1.42rem)',
              fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</h1>
            {subtitle && (
              <p style={{
                fontSize: '0.81rem', color: 'var(--text-muted)', marginTop: 2,
                lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
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
    green:  { icon: 'rgba(21,128,61,0.1)',  text: '#15803d', border: 'rgba(21,128,61,0.18)' },
    amber:  { icon: 'rgba(180,83,9,0.1)',   text: '#b45309', border: 'rgba(180,83,9,0.18)' },
    blue:   { icon: 'rgba(29,78,216,0.1)',  text: '#1d4ed8', border: 'rgba(29,78,216,0.18)' },
    purple: { icon: 'rgba(124,58,237,0.1)', text: '#7c3aed', border: 'rgba(124,58,237,0.18)' },
    red:    { icon: 'rgba(220,38,38,0.1)',  text: '#dc2626', border: 'rgba(220,38,38,0.18)' },
    teal:   { icon: 'rgba(15,118,110,0.1)', text: '#0f766e', border: 'rgba(15,118,110,0.18)' },
    gray:   { icon: 'var(--bg-overlay)', text: 'var(--text-muted)', border: 'var(--border)' },
  };
  const c = colors[color] || colors.green;
  const [hovered, hoverProps] = useHover();

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '16px 18px',
      boxShadow: hovered ? 'var(--sh-md)' : 'var(--sh-xs)',
      display: 'flex', alignItems: 'flex-start', gap: 13,
      transition: 'box-shadow 0.15s, transform 0.15s',
      transform: hovered ? 'translateY(-1px)' : 'none',
      cursor: 'default',
    }}
      {...hoverProps}
    >
      {Icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: c.icon, border: `1.5px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={c.text} />
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        {/* FIX: label bumped from 0.69rem → 0.73rem, contrast improved */}
        <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {typeof value === 'string' && value.includes(' ')
            ? <><span style={{ fontSize: '1.05rem', fontWeight: 700, opacity: 0.55 }}>{value.split(' ')[0]}</span>{' '}{value.split(' ')[1]}</>
            : (value ?? '—')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{sub}</div>}
          {trend != null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              fontSize: '0.69rem', fontWeight: 700,
              color: trend >= 0 ? 'var(--primary)' : 'var(--red)',
              background: trend >= 0 ? 'var(--primary-dim)' : 'var(--red-dim)',
              padding: '1px 6px', borderRadius: 99,
            }}>
              {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, color = 'var(--primary)' }) {
  return <Loader2 size={size} color={color} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height={14} width={i === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
    </Card>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style = {} }) {
  return <div style={{ height: 1, background: 'var(--border)', width: '100%', ...style }} />;
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
export function Modal({ children, onClose, maxWidth = 540, title }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      overflowY: 'auto',
      background: 'rgba(4,46,20,0.45)', backdropFilter: 'blur(6px)',
      // FIX: responsive padding — tighter on mobile
      padding: 'max(12px, env(safe-area-inset-top, 12px)) 12px max(12px, env(safe-area-inset-bottom, 12px))',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={onClose} />
      <div style={{
        position: 'relative', width: '100%', maxWidth,
        background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)',
        padding: title ? '0' : 'clamp(16px, 4vw, 26px)',
        boxShadow: 'var(--sh-xl)',
        border: '1.5px solid var(--border)',
        animation: 'bounceIn 0.22s ease',
        flexShrink: 0,
        margin: 'auto',
      }}>
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'clamp(14px, 3vw, 18px) clamp(16px, 4vw, 24px)',
            borderBottom: '1.5px solid var(--border)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>{title}</h3>
            <button onClick={onClose} style={{
              color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
              padding: 6, borderRadius: 8, transition: 'all 0.15s',
              background: 'none', border: 'none',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* FIX: responsive inner padding */}
        <div style={{ padding: title ? 'clamp(16px, 4vw, 24px)' : 0 }}>
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
  const [hovered, hoverProps] = useHover();
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ fontSize: '0.71rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      )}
      {/* FIX: hover highlights the row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: hovered ? 'var(--bg-sunken)' : 'var(--bg-overlay)',
        border: `1.5px solid ${hovered ? 'var(--border-mid)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '9px 12px',
        transition: 'background 0.15s, border-color 0.15s',
        cursor: 'text',
      }} {...hoverProps}>
        <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {secret && !visible ? '•'.repeat(20) : value}
        </span>
        {secret && (
          <button onClick={() => setVisible(v => !v)} title={visible ? 'Hide' : 'Reveal'} style={{ color: 'var(--text-muted)', display: 'flex', cursor: 'pointer', flexShrink: 0, padding: 2, background: 'none', border: 'none' }}>
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={copy} title={copied ? 'Copied!' : 'Copy'} style={{
          color: copied ? 'var(--primary)' : 'var(--text-muted)',
          display: 'flex', cursor: 'pointer', flexShrink: 0, padding: 2,
          transition: 'color 0.15s', background: 'none', border: 'none',
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
// FIX: now includes a left icon automatically, matching the type.
export function InfoBanner({ type = 'info', children, style = {}, icon: CustomIcon }) {
  const types = {
    info:    { bg: 'var(--blue-dim)',    border: 'rgba(37,99,235,0.2)',   color: 'var(--blue)',    Icon: Info },
    warning: { bg: 'var(--amber-dim)',   border: 'rgba(217,119,6,0.2)',   color: 'var(--amber)',   Icon: AlertTriangle },
    error:   { bg: 'var(--red-dim)',     border: 'rgba(220,38,38,0.2)',   color: 'var(--red)',     Icon: AlertCircle },
    success: { bg: 'var(--primary-dim)', border: 'var(--border-accent)',  color: 'var(--primary)', Icon: CheckCircle },
  };
  const t = types[type] || types.info;
  const IconComp = CustomIcon || t.Icon;
  return (
    <div style={{
      padding: '11px 14px', borderRadius: 'var(--r-md)',
      background: t.bg, border: `1.5px solid ${t.border}`,
      fontSize: '0.845rem', color: t.color, lineHeight: 1.55,
      display: 'flex', alignItems: 'flex-start', gap: 9,
      ...style,
    }}>
      <IconComp size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
// FIX: removed width:fit-content so tabs flow naturally on mobile.
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '4px',
      background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
      border: '1.5px solid var(--border)',
      flexWrap: 'wrap',       // FIX: wraps on narrow screens instead of clipping
      overflowX: 'auto',
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
            flexShrink: 0,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
      <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => onChange(p => p - 1)}>← Previous</Btn>
      <span style={{
        fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 14px',
        background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
        border: '1.5px solid var(--border)',
      }}>
        Page {page} of {totalPages}
      </span>
      <Btn variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onChange(p => p + 1)}>Next →</Btn>
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────
export function FilterBar({ children, style = {} }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      marginBottom: 16,
      overflowX: 'auto', overflowY: 'visible',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      ...style,
    }}>
      <style>{`.ws-filterbar::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  );
}

// ── Inline select (for filter bars) ──────────────────────────────────────────
export function InlineSelect({ value, onChange, children, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 30px 8px 12px', border: '1.5px solid var(--border-mid)',
        borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.815rem',
        background: 'var(--bg-surface)', cursor: 'pointer', outline: 'none',
        appearance: 'none', color: 'var(--text-primary)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23627065' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        ...style,
      }}
    >
      {children}
    </select>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name = '', size = 36, colorSeed }) {
  const colors = ['var(--primary)', 'var(--blue)', 'var(--purple)', 'var(--teal)', 'var(--amber)'];
  const seed = colorSeed ?? name.charCodeAt(0);
  const color = colors[seed % colors.length];
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '18', border: `2px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, color, fontSize: `${size * 0.35}px`,
    }}>
      {initials}
    </div>
  );
}
