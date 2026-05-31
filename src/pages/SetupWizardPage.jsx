/**
 * SetupWizardPage — one-stop onboarding for new tenants.
 * Walks through: Business Info → Add Menu/Services → Go Live checklist
 * 
 * Accessible via /setup/wizard from the sidebar.
 * Shows when a tenant is newly created and guides them step by step.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, ArrowRight, Building2, Package, Wifi,
  Clock, MessageSquare, Zap, ChevronRight, Star, Shield,
  Phone, Copy, ExternalLink,
} from 'lucide-react';
import { business as businessApi } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { getBizConfig, BUSINESS_MODES } from '../utils/businessConfig';
import toast from 'react-hot-toast';

export default function SetupWizardPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    businessApi.get()
      .then(res => setBiz(res.data?.business || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 1800);
    toast.success('Copied!');
  };

  if (loading) return null;

  const mode = biz?.businessMode || tenant?.businessMode || 'GENERIC';
  const cfg = getBizConfig(mode);
  const selectedMode = BUSINESS_MODES.find(m => m.value === mode);
  const bizName = biz?.name || '';
  const isConnected = !!(biz?.phoneNumberId || biz?.whatsapp?.phoneNumberId);
  const hasMenuItems = false; // We don't load count here — link to the page
  const tid = localStorage.getItem('ws_tenant_id') || '';

  // Derive setup checklist dynamically
  const steps = [
    {
      id: 'business',
      title: 'Business Profile',
      desc: 'Set your business name, phone number, and type',
      done: !!(biz?.name && biz?.adminPhone && biz?.businessMode),
      icon: Building2,
      cta: 'Update Business Info',
      route: '/setup/business',
      detail: biz?.name ? `${biz.name} · ${biz.businessMode}` : 'Not configured',
    },
    {
      id: 'catalog',
      title: cfg.tier === 'full' ? `Add Your ${cfg.catalog.pageTitle}` : 'Add Products',
      desc: cfg.catalog.emptyBody,
      done: false,
      icon: cfg.catalog.icon,
      cta: `Go to ${cfg.catalog.navLabel}`,
      route: cfg.catalog.isServiceBased ? '/services' : '/menu',
      detail: `Add at least one ${cfg.catalog.itemLabel} so the bot can show customers what you offer`,
    },
    {
      id: 'hours',
      title: 'Opening Hours',
      desc: 'Set when your business is open so the bot handles off-hours correctly',
      done: !!(biz?.hours?.enabled),
      icon: Clock,
      cta: 'Set Opening Hours',
      route: '/setup/hours',
      detail: biz?.hours?.enabled ? 'Hours configured' : 'Not configured — bot may reply at any time',
    },
    {
      id: 'bot',
      title: 'Bot Messages',
      desc: 'Customise the greeting, away message, and order confirmation texts',
      done: !!(biz?.customMessages?.welcome),
      icon: MessageSquare,
      cta: 'Customise Bot Messages',
      route: '/setup/bot',
      detail: biz?.customMessages?.welcome ? 'Custom messages configured' : 'Using default messages',
    },
    {
      id: 'whatsapp',
      title: 'Connect WhatsApp',
      desc: 'Link your WhatsApp Business number — this is what makes the bot work',
      done: isConnected,
      icon: Wifi,
      cta: 'View Connection Status',
      route: '/setup/whatsapp',
      detail: isConnected ? '✅ Connected — bot is live!' : '⏳ Pending — contact your WhatSales admin',
      important: true,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {allDone ? '🎉 You\'re all set!' : `Set Up ${bizName || 'Your Business'}`}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {allDone
                ? 'Your bot is configured and ready to serve customers.'
                : `${doneCount} of ${steps.length} steps complete — finish setup to go live.`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, height: 8, borderRadius: 99, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: allDone ? 'var(--green)' : 'var(--primary)', borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          {pct}% complete
        </div>
      </div>

      {/* Mode badge */}
      {selectedMode && (
        <div style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--primary-dim)', border: '1px solid var(--border-accent)', borderRadius: 99, fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
          <span>{cfg.emoji}</span>
          <span>{selectedMode.label}</span>
          <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', borderRadius: 99, padding: '1px 7px' }}>
            {cfg.tier === 'full' ? 'Full AI' : 'Basic'}
          </span>
        </div>
      )}

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              style={{
                background: 'var(--bg-surface)',
                border: `1.5px solid ${step.done ? 'rgba(25,163,72,0.2)' : step.important && !step.done ? 'rgba(184,109,0,0.25)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => navigate(step.route)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = step.done ? 'rgba(25,163,72,0.2)' : step.important && !step.done ? 'rgba(184,109,0,0.25)' : 'var(--border)'}
            >
              {/* Status icon */}
              <div style={{ width: 40, height: 40, borderRadius: 10, background: step.done ? 'var(--green-dim)' : step.important && !step.done ? 'var(--amber-dim)' : 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {step.done
                  ? <CheckCircle2 size={18} color="var(--green)" />
                  : <Icon size={18} color={step.important ? 'var(--amber)' : 'var(--text-muted)'} />
                }
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</span>
                  {step.important && !step.done && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--amber-dim)', color: 'var(--amber)', letterSpacing: '0.05em' }}>
                      REQUIRED
                    </span>
                  )}
                  {step.done && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--green-dim)', color: 'var(--green)', letterSpacing: '0.05em' }}>
                      DONE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: step.done ? 'var(--green)' : 'var(--text-muted)', lineHeight: 1.4 }}>
                  {step.detail}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      {/* Tenant ID card */}
      <div style={{ padding: '16px 18px', background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 14, marginBottom: 20 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={12} /> Your Tenant ID
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <code style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.83rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{tid || '—'}</code>
          {tid && (
            <button onClick={() => copy(tid, 'tid')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === 'tid' ? 'var(--green)' : 'var(--text-muted)', padding: 4, flexShrink: 0, display: 'flex' }}>
              {copied === 'tid' ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            </button>
          )}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
          Keep this safe — you need it to log in. Share with your WhatSales admin when requesting WhatsApp setup.
        </div>
      </div>

      {/* Go live tip */}
      {!isConnected && (
        <div style={{ padding: '16px 18px', background: 'var(--amber-dim)', border: '1.5px solid rgba(184,109,0,0.2)', borderRadius: 14 }}>
          <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.88rem', marginBottom: 6 }}>
            ⏳ Waiting for WhatsApp Connection
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            Your bot is ready but won't reply to customers until your WhatSales admin connects your WhatsApp Business number.
            Share your Tenant ID with them and ask to configure your WhatsApp credentials.
          </div>
          <button
            onClick={() => navigate('/setup/whatsapp')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            View Connection Details <ArrowRight size={13} />
          </button>
        </div>
      )}

      {allDone && (
        <div style={{ padding: '20px 22px', background: 'linear-gradient(135deg, var(--green-dim) 0%, var(--primary-dim) 100%)', border: '1.5px solid rgba(25,163,72,0.25)', borderRadius: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🚀</div>
          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            Your bot is live!
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            Share your WhatsApp number with customers. Orders, bookings and sessions will appear in your dashboard in real time.
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
            Go to Dashboard <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
