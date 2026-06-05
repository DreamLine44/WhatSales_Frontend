import { useEffect, useState } from 'react';
import { Wifi, CheckCircle2, AlertCircle, Loader2, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, CopyField, Badge, InfoBanner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const SETUP_STEPS = [
  { key: 'account',   label: 'Account Created',        desc: 'Your WhatSales account is ready' },
  { key: 'requested', label: 'Setup Request Submitted', desc: 'Your request was sent to our team' },
  { key: 'admin',     label: 'Admin Processing',        desc: 'Our team is setting up your WhatsApp connection' },
  { key: 'otp',       label: 'OTP Verification',        desc: 'Meta sends a code to your WhatsApp number' },
  { key: 'connected', label: 'WhatsApp Connected',      desc: 'Your number is linked and bot is initialising' },
  { key: 'active',    label: 'Bot Activated',           desc: 'Your AI assistant is live and responding' },
];

// [FIX-WA-STEP] Access tokens are hashed on the server and never returned to the frontend.
// Previously step 3 (accessToken check) always showed "pending" even when fully configured.
// Now we derive progress purely from visible, non-sensitive fields:
//   0 = account created only
//   1 = setup submitted (no phoneNumberId yet)
//   2 = admin has phoneNumberId but no verifyToken — partially configured
//   3 = phoneNumberId + verifyToken set — waiting for OTP / webhook verification
//   4 = phoneNumberId + verifyToken + NOT yet connected — credentials complete
//   5 = connected flag is true — fully live
// [FIX] step 5 = fully live, step 4 = credentials complete awaiting OTP/session,
// step 3 = phoneNumberId+verifyToken present, step 2 = phoneNumberId only,
// step 1 = account exists no creds yet, step 0 = just created.
// Also treat ACTIVE+credentials as step 4 so users don't stay stuck at "pending".
function getStepIndex(whatsapp, tenantStatus) {
  if (!whatsapp) return 0;
  if (whatsapp.connected) return 5;
  // Admin set ACTIVE + credentials saved → treat as step 4 (provisioning / live)
  if (tenantStatus === 'ACTIVE' && whatsapp.phoneNumberId) return 4;
  if (whatsapp.phoneNumberId && whatsapp.verifyToken) return 4;
  if (whatsapp.phoneNumberId) return 2;
  return 1;
}

function StepItem({ step, status, isLast }) {
  const styles = {
    done:    { circle: 'var(--primary)', border: 'var(--primary)',       text: 'var(--primary)', label: 'var(--text-primary)' },
    active:  { circle: 'var(--amber-dim)', border: 'var(--amber)',       text: 'var(--amber)',   label: 'var(--text-primary)' },
    pending: { circle: 'var(--bg-overlay)', border: 'var(--border-mid)', text: 'var(--text-ghost)', label: 'var(--text-muted)' },
  };
  const s = styles[status];

  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {!isLast && (
        <div style={{
          position: 'absolute', left: 13, top: 28, bottom: -4, width: 2,
          background: status === 'done' ? 'var(--primary)' : 'var(--border)',
          borderRadius: 1,
        }} />
      )}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: s.circle, border: `2px solid ${s.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
      }}>
        {status === 'done'   && <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fff' }}>✓</span>}
        {status === 'active' && <Loader2 size={12} color="var(--amber)" style={{ animation: 'spin 1s linear infinite' }} />}
        {status === 'pending'&& <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-mid)', display: 'block' }} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: status === 'pending' ? 500 : 700, color: s.label, letterSpacing: '-0.01em' }}>
          {step.label}
        </div>
        {status !== 'pending' && (
          <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 2 }}>{step.desc}</div>
        )}
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const wa = user?.whatsapp || {};
  const connected = !!(wa.connected || (user?.status === 'ACTIVE' && wa.phoneNumberId));
  const stepIndex = getStepIndex(wa, user?.status);

  // [FIX-POLL] When ACTIVE+configured but not yet showing as fully live,
  // auto-refresh every 15s so the UI updates once the bot initialises.
  useEffect(() => {
    if (wa.connected) return; // already live, no need to poll
    if (user?.status !== 'ACTIVE') return; // not activated yet
    const timer = setInterval(() => {
      refreshUser().catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [wa.connected, user?.status, refreshUser]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshUser(); toast.success('Status refreshed'); }
    catch (err) { toast.error(err.message); }
    finally { setRefreshing(false); }
  };

  const apiBase    = import.meta.env.VITE_API_URL || 'https://web-production-32cc.up.railway.app';
  // [FIX-WA-WEBHOOK] Webhook URL must include the tenant ID so the backend can route messages correctly
  const webhookUrl = user?.tenantId
    ? `${apiBase}/webhook/${user.tenantId}`
    : `${apiBase}/webhook`;

  return (
    <div className="fade-in">
      <PageHeader
        icon={Wifi} title="WhatsApp" subtitle="Your WhatsApp Business connection"
        actions={
          <Btn variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={13} /> Refresh Status
          </Btn>
        }
      />

      {/* [FIX] Status card — green if connected OR provisioned (ACTIVE+creds) */}
      <Card style={{
        marginBottom: 20,
        borderColor: connected ? 'var(--border-accent)' : 'var(--border)',
        background: connected ? 'var(--green-50)' : 'var(--bg-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 'var(--r-xl)',
            background: connected ? 'rgba(10,122,60,0.12)' : 'var(--bg-overlay)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {connected
              ? <CheckCircle2 size={28} color="var(--primary)" />
              : wa.phoneNumberId && user?.status === 'ACTIVE'
                ? <Wifi size={28} color="var(--primary)" />
                : <AlertCircle size={28} color="var(--text-muted)" />}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.025em', marginBottom: 4 }}>
              {connected ? 'WhatsApp Connected' : 'WhatsApp Not Connected'}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {connected
                ? `Your bot is live on ${wa.phone || 'your WhatsApp number'}. Customers can start chatting right now.`
                : wa.phoneNumberId
                  ? (user?.status === 'ACTIVE'
                      ? 'Your bot is provisioned and going live. Messages will be handled shortly.'
                      : 'Credentials are configured. Waiting for webhook verification or OTP to complete setup.')
                  : 'Your WhatsApp number has not been connected yet. Contact your administrator to start setup.'}
            </div>
          </div>
          <Badge color={connected ? 'green' : wa.phoneNumberId ? 'blue' : 'amber'} dot>
            {connected ? 'Active' : wa.phoneNumberId ? (user?.status === 'ACTIVE' ? 'Live' : 'Configuring') : 'Pending Setup'}
          </Badge>
        </div>

        {connected && (
          <div style={{
            marginTop: 16, paddingTop: 16, borderTop: '1.5px solid var(--border)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14,
          }}>
            {wa.phone && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Business Number</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{wa.phone}</div>
              </div>
            )}
            {user?.name && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Business Name</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{user.name}</div>
              </div>
            )}
            {wa.apiVersion && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>API Version</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{wa.apiVersion}</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Setup progress */}
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 20, letterSpacing: '-0.02em' }}>Setup Progress</h3>
          <div>
            {SETUP_STEPS.map((step, i) => {
              let status = 'pending';
              if (i < stepIndex) status = 'done';
              else if (i === stepIndex) status = 'active';
              return <StepItem key={step.key} step={step} status={status} isLast={i === SETUP_STEPS.length - 1} />;
            })}
          </div>
        </Card>

        {/* Account details */}
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, letterSpacing: '-0.02em' }}>Your Account Details</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.55 }}>
            Share these with your administrator to set up your WhatsApp connection.
          </p>
          <CopyField label="Tenant ID" value={user?.tenantId || '—'} />
          {wa.phoneNumberId && <CopyField label="Phone Number ID" value={wa.phoneNumberId} />}
          {wa.phone         && <CopyField label="WhatsApp Number"  value={wa.phone} />}

          <InfoBanner type="warning" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 6, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>HOW TO CONNECT</div>
            <ol style={{ paddingLeft: 16, lineHeight: 1.9, margin: 0, fontSize: '0.8rem' }}>
              <li>Contact your WhatSales administrator</li>
              <li>Provide your Tenant ID above</li>
              <li>Admin will configure Meta WhatsApp credentials</li>
              <li>You'll receive an OTP on your WhatsApp number</li>
              <li>Share the OTP with your admin to complete setup</li>
            </ol>
          </InfoBanner>
        </Card>
      </div>

      {/* Webhook info */}
      <Card>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', userSelect: 'none', padding: '2px 0', letterSpacing: '-0.01em' }}>
            Webhook Information (for admin reference)
          </summary>
          <div style={{ marginTop: 16 }}>
            <CopyField label="Webhook URL" value={webhookUrl} />
            {wa.verifyToken && <CopyField label="Verify Token" value={wa.verifyToken} secret />}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>
              Configure in your Meta for Developers app under WhatsApp → Configuration → Webhooks. Subscribe to <strong>messages</strong> events.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
}
