/**
 * WhatsAppPage — redesigned with clear UX for connection status.
 * 
 * Architecture:
 * - WhatsApp credentials (phoneNumberId, accessToken) are SET by super-admin only.
 * - Tenants can see their connection status and the webhook URL.
 * - If NOT configured: shows a clear "Request Setup" flow with pre-filled info
 *   the admin needs, and explains exactly what to ask for.
 * - If configured: shows active status and webhook info.
 * 
 * "Why can't I set it here?" — answered clearly with a friendly explanation
 * and a copy-ready request message for the tenant to send to admin.
 */
import { useEffect, useState } from 'react';
import {
  Copy, CheckCircle, ExternalLink, Info, AlertTriangle, Wifi,
  MessageSquare, ArrowRight, CheckCircle2, Clock, Zap, Phone,
  Hash, Key, Shield, ChevronDown, ChevronUp, Send,
} from 'lucide-react';
import { business as businessApi } from '../services/api';
import { PageHeader, Card, SectionTitle, Spinner, Badge } from '../components/ui/index.jsx';
import { useAuth } from '../store/AuthContext';
import toast from 'react-hot-toast';

const WEBHOOK_URL = `${import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app'}/webhook`;

export default function WhatsAppPage() {
  const { tenant } = useAuth();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    businessApi.get()
      .then(res => setBiz(res.data?.business || {}))
      .catch(() => toast.error('Failed to load business config'))
      .finally(() => setLoading(false));
  }, []);

  const copy = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copied!');
  };

  if (loading) return <Spinner />;

  const isConnected = !!(biz?.phoneNumberId || biz?.whatsapp?.phoneNumberId);
  const tenantId = tenant?.tenantId || localStorage.getItem('ws_tenant_id') || '';
  const bizName = biz?.name || '';
  const adminPhone = biz?.adminPhone || '';
  const bizMode = biz?.businessMode || '';

  // Pre-filled request message for tenant to send to admin
  const requestMessage = `Hi, I need my WhatsApp bot configured for my WhatSales account.

Business: ${bizName}
Tenant ID: ${tenantId}
Phone: ${adminPhone}
Mode: ${bizMode}

Please configure my WhatsApp Business credentials so my bot starts working. Thanks!`;

  return (
    <div className="fade-in">
      <PageHeader
        title="WhatsApp Connection"
        subtitle="Connect your WhatsApp Business number so the bot can start replying to customers"
      />

      {/* ── STATUS BANNER ── */}
      {isConnected ? (
        <ConnectedBanner onCopy={copy} copied={copied} webhookUrl={WEBHOOK_URL} />
      ) : (
        <NotConfiguredSection
          bizName={bizName}
          tenantId={tenantId}
          adminPhone={adminPhone}
          bizMode={bizMode}
          requestMessage={requestMessage}
          onCopy={copy}
          copied={copied}
        />
      )}

      {/* ── CONNECTION DETAILS ── */}
      <Card style={{ marginTop: 20 }}>
        <SectionTitle sub="Your business profile details — used to identify your account">
          Connection Details
        </SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <InfoRow label="Business name" value={biz?.name || '—'} />
          <InfoRow label="Admin phone" value={biz?.adminPhone || '—'} />
          <InfoRow label="Business mode" value={biz?.businessMode || '—'} />
          <InfoRow label="Account status" value={
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px',
              borderRadius: 20,
              background: biz?.status === 'ACTIVE' ? 'var(--green-dim)' : 'var(--amber-dim)',
              color: biz?.status === 'ACTIVE' ? 'var(--green)' : 'var(--amber)',
            }}>
              {biz?.status || 'UNKNOWN'}
            </span>
          } last />
        </div>
      </Card>

      {/* ── WEBHOOK URL ── */}
      <Card style={{ marginTop: 20 }}>
        <SectionTitle sub="The URL your admin pastes into Meta Developer Console → WhatsApp → Webhook">
          Webhook URL
        </SectionTitle>
        <CopyField
          label="Callback URL"
          value={WEBHOOK_URL}
          copied={copied === 'webhook'}
          onCopy={() => copy(WEBHOOK_URL, 'webhook')}
        />
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Your Tenant ID: <code style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{tenantId || '—'}</code>
          {tenantId && (
            <button onClick={() => copy(tenantId, 'tid')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, color: copied === 'tid' ? 'var(--green)' : 'var(--text-muted)' }}>
              {copied === 'tid' ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            </button>
          )}
        </div>
      </Card>

      {/* ── HOW IT WORKS ── */}
      <Card style={{ marginTop: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowHowItWorks(v => !v)}
          style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <SectionTitle style={{ marginBottom: 0 }}>How message routing works</SectionTitle>
          {showHowItWorks ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </button>
        {showHowItWorks && (
          <ol style={{ marginLeft: 18, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {[
              'A customer messages your WhatsApp Business number.',
              'Meta forwards the message to the webhook URL above.',
              `The bot identifies your business by Phone Number ID.`,
              'If your account is ACTIVE, the bot processes the message and replies.',
              `Orders, bookings, and live sessions appear in your dashboard in real time.`,
            ].map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

/* ── Connected Banner ── */
function ConnectedBanner({ webhookUrl, onCopy, copied }) {
  return (
    <Card style={{ background: 'linear-gradient(135deg, var(--green-dim) 0%, rgba(25,163,72,0.04) 100%)', border: '1.5px solid rgba(25,163,72,0.22)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(25,163,72,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Wifi size={22} color="var(--green)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1rem', fontFamily: 'var(--font-display)' }}>
            🎉 Bot is connected and active
          </div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: 3 }}>
            Your WhatsApp Business number is linked. The bot is replying to customers.
          </div>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(25,163,72,0.2)', flexShrink: 0 }}>
          ACTIVE
        </span>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(25,163,72,0.12)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Webhook URL (configured)</div>
        <CopyField value={webhookUrl} copied={copied === 'webhook'} onCopy={() => onCopy(webhookUrl, 'webhook')} />
      </div>
    </Card>
  );
}

/* ── Not Configured Section — the KEY redesign ── */
function NotConfiguredSection({ bizName, tenantId, adminPhone, bizMode, requestMessage, onCopy, copied }) {
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Main status card */}
      <Card style={{ background: 'linear-gradient(135deg, rgba(184,109,0,0.06) 0%, rgba(184,109,0,0.02) 100%)', border: '1.5px solid rgba(184,109,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(184,109,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Clock size={22} color="var(--amber)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--amber)', fontSize: '1rem', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              WhatsApp not yet connected
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your bot is ready to go — it just needs to be linked to your WhatsApp Business number.
              This is done by your <strong>WhatSales administrator</strong> for security reasons.
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(184,109,0,0.18)', flexShrink: 0 }}>
            PENDING
          </span>
        </div>
      </Card>

      {/* What the admin needs — visual checklist */}
      <Card>
        <SectionTitle sub="What your admin needs to connect your bot">
          Setup Checklist
        </SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: Hash, label: 'Your Tenant ID', value: tenantId, copyKey: 'tid_check', done: !!tenantId },
            { icon: Phone, label: 'WhatsApp Business Phone Number ID', value: 'From Meta Developer Console → WhatsApp → API Setup', done: false, meta: true },
            { icon: Key, label: 'Permanent Access Token', value: 'From Meta Business Suite → System Users', done: false, meta: true },
            { icon: Shield, label: 'Webhook Verify Token', value: 'Admin sets this — any secure string', done: false, meta: true },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
              background: item.done ? 'var(--green-dim)' : 'var(--bg-overlay)',
              border: `1px solid ${item.done ? 'rgba(25,163,72,0.18)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: item.done ? 'rgba(25,163,72,0.12)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.done ? <CheckCircle2 size={15} color="var(--green)" /> : <item.icon size={15} color="var(--text-muted)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: item.meta ? undefined : 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.value || '—'}
                </div>
              </div>
              {item.copyKey && item.value && (
                <button onClick={() => onCopy(item.value, item.copyKey)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === item.copyKey ? 'var(--green)' : 'var(--text-muted)', padding: 4, flexShrink: 0 }}>
                  {copied === item.copyKey ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              )}
              {item.meta && (
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', padding: 4, flexShrink: 0, display: 'flex' }}>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Request message — copy to send to admin */}
      <Card style={{ border: '1.5px solid var(--border-accent)', background: 'var(--primary-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionTitle style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={15} color="var(--primary)" />
              Request Setup From Admin
            </div>
          </SectionTitle>
          <button
            onClick={() => setShowRequest(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}
          >
            {showRequest ? 'Hide' : 'Show'} {showRequest ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: showRequest ? 12 : 0 }}>
          Copy this pre-filled message and send it to your WhatSales administrator to get your bot connected quickly.
        </div>
        {showRequest && (
          <>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginTop: 12 }}>
              {requestMessage}
            </div>
            <button
              onClick={() => onCopy(requestMessage, 'request')}
              style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 7,
                background: copied === 'request' ? 'var(--green)' : 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              {copied === 'request' ? <><CheckCircle2 size={15} /> Copied!</> : <><Copy size={15} /> Copy Request Message</>}
            </button>
          </>
        )}
      </Card>

      {/* Why admin-only */}
      <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={15} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Why can't I enter these myself?</strong>{' '}
            WhatsApp access tokens give full control over your business number. Keeping them in the admin panel
            prevents accidental exposure and ensures only verified credentials are used.
            Your admin can update them anytime via the WhatSales admin panel.
          </div>
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function CopyField({ label, value, copied, onCopy }) {
  return (
    <div>
      {label && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
        <code style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</code>
        <button onClick={onCopy} style={{ background: 'none', border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex' }}>
          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
