import { useEffect, useState } from 'react';
import { Wifi, CheckCircle2, AlertCircle, Loader2, RefreshCw, Info, Phone } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { bizApi } from '../api.js';
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

// [FIX-WA-STEP] Derive setup progress from fields visible with a tenant API key.
// ⚠ accessToken / verifyToken are ALWAYS stripped server-side — never check them.
// ⚠ whatsapp.connected is only in the Tenant doc (not BusinessConfig) and is NOT
//   returned by any tenant-accessible endpoint. We infer status from phoneNumberId.
// Priority: live business.phoneNumberId from fresh /business fetch > cached user object.
//
// Step index map:
//   0 = Account Created (always done once logged in)
//   1 = Setup Request Submitted
//   2 = Admin Processing
//   3 = OTP Verification
//   4 = WhatsApp Connected
//   5 = Bot Activated  ← terminal "all done" state
//
// [FIX-2] ACTIVE + phoneNumberId = step 5 (Bot Activated), not step 4 (OTP Verification).
// Previously returned 4 which put the spinner on the OTP step for a live tenant.
// onboardingStep >= 3 (verified) + ACTIVE = also step 5.
//
// [FIX-WA-SELFSERVICE] requestStatus (from GET /api/whatsapp/request/status) is a genuine,
// backend-confirmed signal where available — it's auto-advanced to 'connected' as a side
// effect of a successful Meta verification, independent of the onboardingStep guesswork
// below. Treat it as a FLOOR (Math.max), never a ceiling: it can only push the displayed
// step forward when it confirms more progress than the other heuristics inferred, never
// backward. Most admin-onboarded tenants won't have a request record at all (requestStatus
// null) since credentials are typically entered directly by the admin, not self-submitted —
// that's expected and simply contributes no floor.
function getStepIndex(wa, tenantStatus, onboardingStep, requestStatus) {
  if (!wa) return 0;
  let idx;
  // connected=true is set by AuthContext when onboardingStep≥3 is inferred, or by
  // buildUserFromResponse carrying it forward from a prior session. Treat as terminal.
  if (wa.connected === true) {
    idx = 5;
  } else if (typeof onboardingStep === 'number' && onboardingStep > 1) {
    // Use authoritative onboardingStep when it's a real number (> 1 = admin-managed).
    // Step 3 = verified by Meta; if tenant is also ACTIVE, the bot is live.
    if (onboardingStep >= 3 && tenantStatus === 'ACTIVE') idx = 5;
    else if (onboardingStep >= 3) idx = 4; // verified but not yet activated
    else if (onboardingStep === 2) idx = 2;
    else idx = 1;
  } else if (tenantStatus === 'ACTIVE' && wa.phoneNumberId) {
    // Fallback inference from fields we can actually read.
    // ACTIVE + phoneNumberId = bot is live (step 5), not just OTP pending (step 4).
    idx = 5;
  } else if (wa.phoneNumberId) {
    idx = 2;
  } else {
    idx = 1;
  }

  const requestFloor =
    requestStatus === 'connected'  ? 4 :
    requestStatus === 'connecting' ? 3 :
    (requestStatus === 'contacted' || requestStatus === 'pending') ? 2 : 0;
  return Math.max(idx, requestFloor);
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
  // [FIX-WA-LIVE] Fetch fresh business data to get the latest phoneNumberId.
  // AuthContext synthesises whatsapp from business.phoneNumberId on login/restore,
  // but that snapshot may be stale. A direct GET /business/:id gives the live value.
  const [liveBiz, setLiveBiz] = useState(null);
  const [bizLoading, setBizLoading] = useState(true);
  // [FIX-WA-SELFSERVICE] Poll the tenant's own connection-request status, if one exists.
  // A 404 here just means this tenant never submitted a self-service request (the normal
  // case for admin-onboarded tenants) — not an error, so we swallow it silently.
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    bizApi.get()
      .then(r => setLiveBiz(r.data?.business || r.data || {}))
      .catch(() => setLiveBiz(null))
      .finally(() => setBizLoading(false));
    bizApi.connectionRequestStatus()
      .then(r => setRequestStatus(r.data?.status || r.data?.request?.status || null))
      .catch(() => setRequestStatus(null));
  }, []);

  // Prefer live data over cached user object for WhatsApp fields.
  // [FIX-3] Preserve connected flag — carry it from liveBiz if present, or fall back to
  // user.whatsapp.connected (which AuthContext sets when onboardingStep≥3 is inferred).
  const wa = liveBiz
    ? (liveBiz.phoneNumberId
        ? {
            phoneNumberId: liveBiz.phoneNumberId,
            phone:         liveBiz.phone         || undefined,
            // liveBiz.connected would be set if backend ever exposes it; fall back to cached value
            connected:     liveBiz.connected === true || user?.whatsapp?.connected === true,
          }
        : {})
    : (user?.whatsapp || {});

  const tenantStatus   = user?.status || 'ACTIVE';
  const onboardingStep = user?.onboardingStep ?? null;
  const stepIdx        = getStepIndex(wa, tenantStatus, onboardingStep, requestStatus);
  const isRejected     = requestStatus === 'rejected';

  const handleRefresh = async () => {
    setRefreshing(true);
    setBizLoading(true);
    try {
      await refreshUser();
      const r = await bizApi.get();
      setLiveBiz(r.data?.business || r.data || {});
      bizApi.connectionRequestStatus()
        .then(rr => setRequestStatus(rr.data?.status || rr.data?.request?.status || null))
        .catch(() => setRequestStatus(null));
      toast.success('Status refreshed');
    } catch (err) {
      toast.error(err.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
      setBizLoading(false);
    }
  };

  const isConnected = wa.connected === true || stepIdx >= 5;
  const isConfigured = !!(wa.phoneNumberId);

  return (
    <div className="fade-in">
      <PageHeader
        icon={Wifi}
        title="WhatsApp Connection"
        subtitle="Status of your WhatsApp Business API integration"
        actions={
          <Btn variant="ghost" size="sm" onClick={handleRefresh} loading={refreshing}>
            <RefreshCw size={14} /> Refresh Status
          </Btn>
        }
      />

      {/* Connection status banner */}
      {!bizLoading && (
        <InfoBanner
          type={isRejected ? 'error' : isConnected ? 'success' : isConfigured ? 'warning' : 'info'}
          style={{ marginBottom: 20 }}
        >
          {isRejected
            ? '❌ Your WhatsApp connection request was not approved. Contact support@whatsales.app for details.'
            : isConnected
            ? '✅ Your WhatsApp number is connected and the bot is active.'
            : isConfigured
            ? '⏳ Your WhatsApp credentials are saved. Your account is pending activation by our team.'
            : '📋 WhatsApp setup is managed by our team. Contact your administrator to get started.'}
        </InfoBanner>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Setup progress */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              Setup Progress
            </h2>
            <Badge color={isConnected ? 'green' : isConfigured ? 'amber' : 'gray'}>
              {isConnected ? 'Connected' : isConfigured ? 'In Progress' : 'Not Started'}
            </Badge>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SETUP_STEPS.map((step, i) => {
              const status = i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending';
              return (
                <StepItem
                  key={step.key}
                  step={step}
                  status={status}
                  isLast={i === SETUP_STEPS.length - 1}
                />
              );
            })}
          </div>
        </Card>

        {/* Connection details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Phone number info */}
          <Card>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', marginBottom: 16 }}>
              Connection Details
            </h2>

            {bizLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  {wa.phoneNumberId
                    ? <CopyField label="Phone Number ID" value={wa.phoneNumberId} />
                    : <>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number ID</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-ghost)', fontStyle: 'italic' }}>Not configured yet</div>
                      </>
                  }
                </div>

                {wa.phone && (
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp Number</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} color="var(--primary)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{wa.phone}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bot Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isConnected
                      ? <><CheckCircle2 size={16} color="var(--primary)" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>Bot Active</span></>
                      : isConfigured
                      ? <><AlertCircle size={16} color="var(--amber)" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--amber)' }}>Awaiting Activation</span></>
                      : <><AlertCircle size={16} color="var(--text-muted)" /><span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Not Configured</span></>
                    }
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Help card */}
          <Card style={{ background: 'var(--bg-overlay)', border: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  How WhatsApp setup works
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  WhatsApp Business API connections are set up by our admin team.
                  Once your number is verified with Meta, your bot will be activated automatically.
                  Contact <strong>support@whatsales.app</strong> if setup has not progressed within 24 hours.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
