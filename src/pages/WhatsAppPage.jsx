import { useEffect, useState } from 'react';
import { Wifi, CheckCircle2, Clock, AlertCircle, Loader2, CopyCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, CopyField, Badge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Steps in the onboarding flow
const SETUP_STEPS = [
  { key: 'account',   label: 'Account Created',          desc: 'Your WhatSales account is ready' },
  { key: 'requested', label: 'Setup Request Submitted',   desc: 'Your request was sent to our team' },
  { key: 'admin',     label: 'Admin Processing',          desc: 'Our team is setting up your WhatsApp connection' },
  { key: 'otp',       label: 'OTP Verification',          desc: 'Meta sends a code to your WhatsApp number' },
  { key: 'connected', label: 'WhatsApp Connected',        desc: 'Your number is linked to the platform' },
  { key: 'active',    label: 'Bot Activated',             desc: 'Your AI assistant is live and responding' },
];

function getStepIndex(whatsapp) {
  if (!whatsapp) return 0;
  if (whatsapp.connected) return 5;
  if (whatsapp.phoneNumberId && whatsapp.accessToken) return 4;
  if (whatsapp.phoneNumberId) return 2;
  return 1;
}

function StepItem({ step, status }) {
  const colors = {
    done:    { bg: 'var(--primary-dim)', border: 'var(--primary)', icon: 'var(--primary)' },
    active:  { bg: 'var(--amber-dim)',   border: 'var(--amber)',   icon: 'var(--amber)'   },
    pending: { bg: 'var(--bg-overlay)',  border: 'var(--border)',  icon: 'var(--text-ghost)' },
  };
  const c = colors[status];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.bg, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {status === 'done' && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>✓</span>}
        {status === 'active' && <Loader2 size={12} color="var(--amber)" style={{ animation: 'spin 1s linear infinite' }} />}
        {status === 'pending' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-mid)', display: 'block' }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: 18 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: status === 'pending' ? 400 : 600, color: status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)', marginBottom: 2 }}>
          {step.label}
        </div>
        {status !== 'pending' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{step.desc}</div>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const wa = user?.whatsapp || {};
  const connected = !!(wa.connected || (wa.phoneNumberId && wa.accessToken));
  const stepIndex = getStepIndex(wa);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshUser(); toast.success('Status refreshed'); }
    catch (err) { toast.error(err.message); }
    finally { setRefreshing(false); }
  };

  // Construct webhook URL from env
  const apiBase = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';
  const webhookUrl = `${apiBase}/webhook`;

  return (
    <div className="fade-in">
      <PageHeader
        icon={Wifi}
        title="WhatsApp"
        subtitle="Your WhatsApp Business connection"
        actions={
          <Btn variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={13} /> Refresh Status
          </Btn>
        }
      />

      {/* Status card */}
      <Card style={{ marginBottom: 20, borderColor: connected ? 'var(--border-accent)' : 'var(--border)', background: connected ? 'var(--green-50)' : 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-xl)', background: connected ? 'rgba(15,123,69,0.12)' : 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {connected
              ? <CheckCircle2 size={26} color="var(--primary)" />
              : <AlertCircle size={26} color="var(--text-muted)" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
              {connected ? 'WhatsApp Connected' : 'WhatsApp Not Connected'}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {connected
                ? `Your bot is live on ${wa.phone || 'your WhatsApp number'}. Customers can start chatting right now.`
                : 'Your WhatsApp number has not been connected yet. Contact your administrator to start the setup process.'}
            </div>
          </div>
          <Badge color={connected ? 'green' : 'amber'} dot>
            {connected ? 'Active' : 'Pending Setup'}
          </Badge>
        </div>

        {connected && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {wa.phone && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Business Number</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{wa.phone}</div>
              </div>
            )}
            {user?.name && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Business Name</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</div>
              </div>
            )}
            {wa.apiVersion && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>API Version</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{wa.apiVersion}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Setup progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, color: 'var(--text-primary)' }}>Setup Progress</h3>
          <div>
            {SETUP_STEPS.map((step, i) => {
              let status = 'pending';
              if (i < stepIndex) status = 'done';
              else if (i === stepIndex) status = 'active';
              return (
                <div key={step.key} style={{ position: 'relative' }}>
                  {i < SETUP_STEPS.length - 1 && (
                    <div style={{ position: 'absolute', left: 13, top: 30, bottom: 0, width: 2, background: i < stepIndex ? 'var(--primary)' : 'var(--border)', borderRadius: 1 }} />
                  )}
                  <StepItem step={step} status={status} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Your tenant credentials */}
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, color: 'var(--text-primary)' }}>Your Account Details</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
            Share these details with your administrator to set up your WhatsApp connection.
          </p>

          <CopyField label="Tenant ID" value={user?.tenantId || '—'} />
          {wa.phoneNumberId && <CopyField label="Phone Number ID" value={wa.phoneNumberId} />}

          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>HOW TO CONNECT</div>
            <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
              <li>Contact your WhatSales administrator</li>
              <li>Provide your Tenant ID above</li>
              <li>Admin will configure Meta WhatsApp credentials</li>
              <li>You'll receive an OTP on your WhatsApp number</li>
              <li>Share the OTP with your admin to complete setup</li>
            </ol>
          </div>
        </Card>
      </div>

      {/* Webhook info (collapsed, for reference) */}
      <Card>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', userSelect: 'none', padding: '2px 0' }}>
            Webhook Information (for admin reference)
          </summary>
          <div style={{ marginTop: 16 }}>
            <CopyField label="Webhook URL" value={webhookUrl} />
            {wa.verifyToken && <CopyField label="Verify Token" value={wa.verifyToken} secret />}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
              Configure these in your Meta for Developers app under WhatsApp → Configuration → Webhooks. Subscribe to <strong>messages</strong> events.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
}
