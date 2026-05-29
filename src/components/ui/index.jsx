/* ─── WhatSales UI v4 — Premium Design System ─── */
import { Loader2, X, TrendingUp, TrendingDown } from 'lucide-react';
import * as React from 'react';

/* ── Page Header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.55rem', fontWeight:800, letterSpacing:'-0.03em', color:'var(--text-primary)', lineHeight:1.15 }}>{title}</h1>
        {subtitle && <p style={{ marginTop:5, color:'var(--text-muted)', fontSize:'0.875rem', lineHeight:1.5 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
    </div>
  );
}

/* ── Card ── */
export function Card({ children, style, className, padding='22px', onClick, hover }) {
  const [hov, setHov] = React.useState(false);
  const base = {
    background: 'var(--bg-surface)',
    border: `1.5px solid ${hov && hover ? 'var(--border-accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)',
    padding,
    boxShadow: hov && hover ? 'var(--shadow-md)' : 'var(--shadow-card)',
    transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
    transform: hov && hover ? 'translateY(-2px)' : 'none',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  };
  return (
    <div
      style={base}
      className={className}
      onClick={onClick}
      onMouseEnter={() => (onClick || hover) && setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </div>
  );
}

/* ── Stat Card ── */
export function StatCard({ label, value, sub, icon: Icon, color='var(--primary)', trend }) {
  return (
    <Card style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:`${color}0a`, pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', gap:14, position:'relative' }}>
        <div style={{ width:44, height:44, borderRadius:'var(--radius-md)', background:`${color}10`, border:`1.5px solid ${color}1a`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {Icon && <Icon size={19} color={color} />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'0.71rem', fontWeight:700, color:'var(--text-muted)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.85rem', fontWeight:800, letterSpacing:'-0.04em', color:'var(--text-primary)', lineHeight:1.05 }}>{value ?? '—'}</div>
          {sub && (
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}>
              {trend==='up'   && <TrendingUp size={11} color="var(--green)" />}
              {trend==='down' && <TrendingDown size={11} color="var(--red)" />}
              <span style={{ color: trend==='up' ? 'var(--green)' : trend==='down' ? 'var(--red)' : 'inherit' }}>{sub}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ── Button ── */
export function Button({ children, onClick, variant='primary', size='md', disabled, loading, type='button', style }) {
  const [hov, setHov] = React.useState(false);
  const sizes = {
    sm: { fontSize:'0.78rem', padding:'7px 13px', gap:5 },
    md: { fontSize:'0.865rem', padding:'10px 18px', gap:6 },
    lg: { fontSize:'0.93rem', padding:'13px 26px', gap:7 },
  };
  const variants = {
    primary:   { background: hov ? 'var(--primary-hover)' : 'var(--primary)', color:'#fff', boxShadow: hov ? 'var(--shadow-primary)' : '0 2px 8px rgba(30,138,66,0.18)' },
    secondary: { background: hov ? 'var(--bg-hover)' : 'var(--bg-elevated)', color:'var(--text-primary)', border:'1.5px solid var(--border-strong)' },
    ghost:     { background: hov ? 'var(--bg-overlay)' : 'transparent', color:'var(--text-secondary)' },
    danger:    { background: hov ? 'rgba(220,53,53,0.14)' : 'var(--red-dim)', color:'var(--red)', border:'1.5px solid rgba(220,53,53,0.2)' },
    success:   { background: hov ? 'rgba(25,163,72,0.14)' : 'var(--green-dim)', color:'var(--green)', border:'1.5px solid rgba(25,163,72,0.2)' },
    mint:      { background: hov ? 'rgba(159,224,180,0.4)' : 'var(--mint-dim)', color:'var(--deep-green)', border:'1.5px solid rgba(159,224,180,0.42)', fontWeight:700 },
  };
  const sz = sizes[size] || sizes.md;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        gap: sz.gap,
        fontFamily:'var(--font-body)', fontWeight:600,
        cursor:disabled||loading ? 'not-allowed' : 'pointer',
        border:'none', transition:'all 0.14s ease',
        borderRadius:'var(--radius-md)', whiteSpace:'nowrap',
        opacity:disabled||loading ? 0.55 : 1,
        fontSize: sz.fontSize, padding: sz.padding,
        ...variants[variant], ...style,
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} /> : null}
      {children}
    </button>
  );
}

/* ── Badge ── */
export function Badge({ label, color='default', dot }) {
  const colors = {
    default: { bg:'var(--bg-overlay)',  text:'var(--text-secondary)', border:'var(--border-strong)' },
    green:   { bg:'var(--green-dim)',   text:'var(--green)',          border:'rgba(25,163,72,0.16)'  },
    red:     { bg:'var(--red-dim)',     text:'var(--red)',            border:'rgba(220,53,53,0.16)'  },
    amber:   { bg:'var(--amber-dim)',   text:'var(--amber)',          border:'rgba(184,109,0,0.16)'  },
    blue:    { bg:'var(--blue-dim)',    text:'var(--blue)',           border:'rgba(29,88,224,0.16)'  },
    purple:  { bg:'var(--purple-dim)',  text:'var(--purple)',         border:'rgba(112,48,224,0.16)' },
    mint:    { bg:'var(--mint-dim)',    text:'var(--deep-green)',     border:'rgba(78,203,130,0.3)'  },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:99, fontSize:'0.72rem', fontWeight:600, background:c.bg, color:c.text, border:`1.5px solid ${c.border}`, whiteSpace:'nowrap', letterSpacing:'0.01em' }}>
      {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:c.text, flexShrink:0 }} />}
      {label}
    </span>
  );
}

/* ── Status Badges ── */
export function OrderStatusBadge({ status, paymentStatus }) {
  if (status==='completed')                                return <Badge dot label="Completed"       color="green"  />;
  if (status==='confirmed' || paymentStatus==='confirmed') return <Badge dot label="Confirmed"       color="green"  />;
  if (status==='rejected')                                 return <Badge dot label="Rejected"        color="red"    />;
  if (status==='payment_failed')                           return <Badge dot label="Payment Failed"  color="red"    />;
  if (status==='cancelled' || paymentStatus==='cancelled') return <Badge dot label="Cancelled"       color="red"    />;
  if (paymentStatus==='proof_received')                    return <Badge dot label="Proof Received"  color="blue"   />;
  if (paymentStatus==='unpaid')                            return <Badge dot label="Awaiting Payment" color="amber" />;
  return <Badge dot label={status || 'Pending'} color="amber" />;
}

export function BookingStatusBadge({ status }) {
  if (status==='confirmed') return <Badge dot label="Confirmed" color="green" />;
  if (status==='completed') return <Badge dot label="Completed" color="green" />;
  if (status==='cancelled') return <Badge dot label="Declined"  color="red"   />;
  return <Badge dot label="Pending" color="amber" />;
}

/* ── Field ── */
export function Field({ label, hint, error, children, required }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && (
        <label style={{ fontSize:'0.83rem', fontWeight:600, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}>
          {label}{required && <span style={{ color:'var(--primary)' }}>*</span>}
        </label>
      )}
      {children}
      {hint  && !error && <span style={{ fontSize:'0.76rem', color:'var(--text-muted)', lineHeight:1.4 }}>{hint}</span>}
      {error && <span style={{ fontSize:'0.76rem', color:'var(--red)', fontWeight:500 }}>{error}</span>}
    </div>
  );
}

/* ── Section Title ── */
export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{children}</h2>
      {sub && <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:3, lineHeight:1.45 }}>{sub}</p>}
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 20px' }}>
      {Icon && (
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:58, height:58, borderRadius:'50%', background:'var(--primary-dim)', border:'2px solid var(--border-accent)', marginBottom:16 }}>
          <Icon size={24} color="var(--primary)" />
        </div>
      )}
      <div style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{title}</div>
      {body && <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginBottom:20, lineHeight:1.55, maxWidth:340, margin:'0 auto 20px' }}>{body}</p>}
      {action}
    </div>
  );
}

/* ── Table ── */
export function Table({ headers, children }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'var(--bg-elevated)' }}>
            {headers.map(h => (
              <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-muted)', borderBottom:'1.5px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <tr
      onClick={onClick}
      style={{ borderBottom:'1px solid var(--border)', transition:'background var(--t-fast)', cursor:onClick ? 'pointer' : 'default', background:hov && onClick ? 'var(--bg-elevated)' : 'transparent' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </tr>
  );
}

export function Td({ children, style }) {
  return (
    <td style={{ padding:'13px 16px', fontSize:'0.875rem', color:'var(--text-primary)', verticalAlign:'middle', ...style }}>
      {children}
    </td>
  );
}

/* ── Spinner ── */
export function Spinner({ size=24 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60 }}>
      <div style={{ position:'relative', width:size*1.5, height:size*1.5 }}>
        <Loader2 size={size} color="var(--primary)" style={{ animation:'spin 0.8s linear infinite' }} />
      </div>
    </div>
  );
}

/* ── Grid ── */
export function Grid({ cols=3, gap=18, children, style, minColWidth }) {
  // Always use auto-fill with a sensible minimum so grids reflow on mobile
  // rather than creating tiny fixed-width cells.
  const minW = minColWidth || (cols >= 3 ? 200 : cols >= 2 ? 260 : 300);
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minW}px, 1fr))`,
      gap, ...style,
    }}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ minColWidth=220, gap=18, children, style }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${minColWidth}px, 1fr))`, gap, ...style }}>
      {children}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, width=500 }) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key==='Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(8,18,12,0.55)', backdropFilter:'blur(6px)' }} onClick={onClose} />
      <div style={{
        position:'relative', width:'100%', maxWidth:width,
        background:'var(--bg-surface)', border:'1.5px solid var(--border)',
        borderRadius:'var(--radius-xl)', padding:'28px 28px 24px',
        boxShadow:'var(--shadow-lg)',
        animation:'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)',
        maxHeight:'90vh', overflowY:'auto',
      }}>
        {title && (
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>{title}</h3>
            <button onClick={onClose} style={{ background:'var(--bg-overlay)', border:'1px solid var(--border)', color:'var(--text-muted)', cursor:'pointer', padding:'4px 5px', display:'flex', borderRadius:7, transition:'all var(--t-fast)', marginLeft:12, flexShrink:0 }}
              onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-primary)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='var(--bg-overlay)'; e.currentTarget.style.color='var(--text-muted)'; }}
            ><X size={15} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Toggle ── */
export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => (e.key===' '||e.key==='Enter') && onChange(!checked)}
        style={{
          width:40, height:22, borderRadius:99,
          background: checked ? 'var(--primary)' : 'var(--bg-hover)',
          border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
          position:'relative', transition:'background 0.18s, border-color 0.18s',
          flexShrink:0,
          boxShadow: checked ? '0 0 0 3px var(--primary-glow)' : 'none',
          outline:'none',
        }}
      >
        <div style={{ width:15, height:15, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:checked ? 20 : 2, transition:'left 0.18s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 1px 3px rgba(0,0,0,0.16)' }} />
      </div>
      {label && <span style={{ fontSize:'0.875rem', color:'var(--text-primary)', userSelect:'none' }}>{label}</span>}
    </label>
  );
}

/* ── Divider ── */
export function Divider({ style }) {
  return <hr style={{ border:'none', borderTop:'1px solid var(--border)', ...style }} />;
}

/* ── InfoBanner ── */
export function InfoBanner({ children, color='blue', icon: Icon }) {
  const map = {
    blue:  { bg:'var(--blue-dim)',  border:'rgba(29,88,224,0.16)',  text:'var(--blue)'  },
    amber: { bg:'var(--amber-dim)', border:'rgba(184,109,0,0.16)',  text:'var(--amber)' },
    green: { bg:'var(--green-dim)', border:'rgba(25,163,72,0.16)',  text:'var(--green)' },
    red:   { bg:'var(--red-dim)',   border:'rgba(220,53,53,0.16)',  text:'var(--red)'   },
  };
  const s = map[color] || map.blue;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:'var(--radius-md)', padding:'12px 16px', display:'flex', gap:10, alignItems:'flex-start' }}>
      {Icon && <Icon size={15} color={s.text} style={{ flexShrink:0, marginTop:1 }} />}
      <div style={{ fontSize:'0.85rem', color:s.text, lineHeight:1.55 }}>{children}</div>
    </div>
  );
}

/* ── Detail Row ── */
export function DetailRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:'0.84rem', color:'var(--text-muted)', fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)', textAlign:'right', maxWidth:'65%' }}>{value}</span>
    </div>
  );
}

/* ── Filter Tabs ── */
export function FilterTabs({ filters, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {filters.map(f => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            style={{
              padding:'6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize:'0.8rem',
              fontWeight: isActive ? 700 : 500,
              fontFamily:'var(--font-body)',
              cursor:'pointer',
              border: isActive ? '1.5px solid var(--border-accent)' : '1.5px solid var(--border-strong)',
              background: isActive ? 'var(--primary-dim)' : 'var(--bg-surface)',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition:'all 0.14s ease',
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Search Input ── */
export function SearchInput({ value, onChange, placeholder='Search…' }) {
  return (
    <div style={{ position:'relative', flex:1, maxWidth:280 }}>
      <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft:34, fontSize:'0.86rem', height:36, borderRadius:'var(--radius-pill)' }}
      />
    </div>
  );
}

/* ── ConfirmModal — replaces window.confirm() throughout the app ── */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger', loading = false }) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !loading) onClose?.(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose, loading]);

  if (!open) return null;

  const variantColor = variant === 'danger' ? 'var(--red)' : variant === 'amber' ? 'var(--amber)' : 'var(--primary)';
  const variantBg    = variant === 'danger' ? 'var(--red-dim)' : variant === 'amber' ? 'var(--amber-dim)' : 'var(--primary-dim)';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(8,18,12,0.55)', backdropFilter:'blur(6px)' }} onClick={() => { if (!loading) onClose?.(); }} />
      <div style={{
        position:'relative', width:'100%', maxWidth:400,
        background:'var(--bg-surface)', border:'1.5px solid var(--border)',
        borderRadius:'var(--radius-xl)', padding:'28px 28px 24px',
        boxShadow:'var(--shadow-lg)',
        animation:'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width:44, height:44, borderRadius:12, background:variantBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={variantColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{title}</h3>
        {message && <p style={{ fontSize:'0.88rem', color:'var(--text-secondary)', lineHeight:1.6, marginBottom:22 }}>{message}</p>}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={() => { if (!loading) onClose?.(); }}
            disabled={loading}
            style={{ flex:1, padding:'10px 16px', borderRadius:'var(--radius-md)', border:'1.5px solid var(--border-strong)', background:'var(--bg-overlay)', color:'var(--text-secondary)', fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.5:1, transition:'all var(--t-fast)' }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex:1, padding:'10px 16px', borderRadius:'var(--radius-md)', border:'none', background:variantColor, color:'#fff', fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, transition:'all var(--t-fast)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
          >
            {loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
