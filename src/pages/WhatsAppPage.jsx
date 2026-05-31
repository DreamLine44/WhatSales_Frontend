/**
 * WhatsAppPage — read-only WhatsApp connection status.
 *
 * Tenants cannot update their own WhatsApp credentials via the API.
 * Credentials (phoneNumberId, accessToken) are set by a super-admin via
 * PATCH /admin/tenants/:id. This page shows the current connection info
 * and the webhook URL the admin needs to configure in Meta Developer Console.
 */
import { useEffect, useState } from 'react';
import { Copy, CheckCircle, ExternalLink, Info, AlertTriangle, Wifi } from 'lucide-react';
import { business as businessApi } from '../services/api';
import {
  PageHeader, Card, SectionTitle, Spinner, Badge
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function WhatsAppPage() {
  const [biz, setBiz]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState('');

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
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      // Clipboard API unavailable (non-HTTPS or blocked) — fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(key);
        setTimeout(() => setCopied(''), 2000);
      } catch {
        toast.error('Could not copy — please copy the URL manually');
      }
    }
  };

  const webhookUrl = `${import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app'}/webhook`;

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="WhatsApp Connection"
        subtitle="Connection status and webhook configuration for your WhatsApp bot"
      />

      {/* Status banner — uses webhookConfigured as the real signal.
          adminPhone is the admin's notification number, unrelated to bot credentials.
          If the backend returns a webhookUrl (set when credentials are configured by admin),
          we treat the bot as connected. Otherwise show "not yet configured". */}
      {(biz?.status === 'ACTIVE' || biz?.phoneNumberId) ? (
        <Card style={{
          marginBottom: 24,
          background: 'var(--green-dim)',
          border: '1px solid rgba(37,162,68,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,162,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wifi size={17} color="var(--green)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>
                Bot is configured and active
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Your WhatsApp credentials are managed by your WhatSales administrator.
              </div>
            </div>
            <Badge label="ACTIVE" color="green" />
          </div>
        </Card>
      ) : (
        <Card style={{
          marginBottom: 24,
          background: 'var(--amber-dim)',
          border: '1px solid rgba(217,119,6,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(217,119,6,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={17} color="var(--amber)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: '0.95rem' }}>
                WhatsApp not yet configured
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Contact your WhatSales administrator to set up your WhatsApp Business credentials.
              </div>
            </div>
            <Badge label="PENDING" color="amber" />
          </div>
        </Card>
      )}

      {/* Admin-only notice */}
      <Card style={{ marginBottom: 20, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--blue)', lineHeight: 1.6 }}>
            <strong>To update WhatsApp credentials</strong> (Phone Number ID, Access Token, or Verify Token),
            contact your WhatSales administrator. These settings are changed via the super-admin panel
            and cannot be edited here for security reasons.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Business info */}
        <Card>
          <SectionTitle sub="Current configuration sourced from your business profile">
            Connection Details
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <InfoRow label="Business name"    value={biz?.name          || '—'} />
            <InfoRow label="Admin phone"      value={biz?.adminPhone    || '—'} />
            <InfoRow label="Business mode"    value={biz?.businessMode  || '—'} />
          </div>
        </Card>

        {/* Webhook URL — the one thing they need to see */}
        <Card>
          <SectionTitle sub="Paste this into Meta Developer Console → WhatsApp → Configuration → Webhook">
            Webhook URL
          </SectionTitle>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            In your{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              Meta Developer Console <ExternalLink size={12} />
            </a>
            , go to <strong>WhatsApp → Configuration → Webhook</strong> and set the callback URL below.
            Subscribe to the <strong>messages</strong> webhook field.
          </div>
          <CopyField
            label="Callback URL"
            value={webhookUrl}
            copied={copied === 'url'}
            onCopy={() => copy(webhookUrl, 'url')}
          />
          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                The <strong>Verify Token</strong> is set by your administrator. Ask them for the value
                if you need to re-configure the webhook subscription in Meta.
              </div>
            </div>
          </div>
        </Card>

        {/* How it works */}
        <Card style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
          <SectionTitle>How message routing works</SectionTitle>
          <ol style={{ marginLeft: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>A customer messages your WhatsApp Business number.</li>
            <li>Meta forwards the message to the webhook URL above.</li>
            <li>The bot looks up your tenant by <code>metadata.phone_number_id</code>.</li>
            <li>If your tenant is <strong>ACTIVE</strong>, the message is processed and the bot replies.</li>
            <li>Orders, bookings, and sessions appear in this dashboard in real time.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function CopyField({ label, value, copied, onCopy }) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
          {label}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--bg-overlay)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px',
      }}>
        <code style={{ flex: 1, fontSize: '0.83rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {value}
        </code>
        <button
          onClick={onCopy}
          title="Copy to clipboard"
          style={{ background: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0, border: 'none', display: 'flex' }}
        >
          {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
