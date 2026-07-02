import { useEffect, useState } from 'react';
import { Wifi, CheckCircle2, AlertCircle, Loader2, RefreshCw, Info, Phone } from 'lucide-react';
import { useAuth } from '../store/AuthContext.jsx';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, CopyField, Badge, InfoBanner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ───────────────────────────────────────────────────────────────
// The previous version of this page showed a fixed 6-step tracker (Account
// Created → Setup Request Submitted → Admin Processing → OTP Verification →
// WhatsApp Connected → Bot Activated) for every tenant. Two of those steps
// were fabricated:
//   • "Setup Request Submitted" / "Admin Processing" — for tenants onboarded
//     directly by an admin (the normal path), no request record exists at
//     all. The checkmark was purely a default, not evidence anything happened.
//   • "OTP Verification" — there is no OTP anywhere in the backend. Credential
//     verification (POST /admin/tenants/:id/verify-whatsapp) calls Meta's
//     Graph API directly with the stored access token.
// It also had a rendering bug: the final ("Bot Activated") step could only
// ever render as "active" (a permanently spinning loader), never "done" —
// there was no index past the last step for a fully-completed tenant to land
// on — so a genuinely live bot still looked like it was stuck loading.
//
// This version only shows states the backend actually tracks, and branches
// on which of the two real onboarding paths applies to this tenant:
//
//   1. Self-service request (GET /api/whatsapp/request/status returns a
//      record) — a genuinely tracked WhatsAppConnectionRequest with real
//      stages: pending → contacted → connecting → connected (or rejected).
//   2. Admin-onboarded (no request record — the normal path per current
//      operating practice) — only three real Tenant-level checkpoints exist:
//      credentials saved (phoneNumberId), verified with Meta (connected),
//      and activated (tenant.status === 'ACTIVE', set separately by an
//      admin — see AdminTenantsPage's activation guard). Nothing in between
//      is tracked, so nothing in between is shown.
//
// [IMPORTANT] "Connected" and "Active" are NOT the same thing. Verifying
// credentials with Meta sets whatsapp.connected = true, but the tenant still
// starts life as status: 'PENDING' ("Bot will not respond" — see
// AdminTenantsPage STATUS_META) and only becomes ACTIVE via a separate,
// explicit admin action. A tenant can be genuinely connected/verified and
// still not live. Treat both as required for "the bot is actually live".

const REQUEST_ORDER = ['pending', 'contacted', 'connecting', 'connected'];
const REQUEST_STEPS = [
  { key: 'pending',    label: 'Request Submitted', desc: 'Your connection request was received' },
  { key: 'contacted',  label: 'Contacted',         desc: 'Our team has reviewed your request' },
  { key: 'connecting', label: 'Connecting',        desc: 'Your WhatsApp number is being configured' },
  { key: 'connected',  label: 'Connected',         desc: 'Your bot is live and ready' },
];

const ADMIN_STEPS = [
  { key: 'credentials', label: 'Credentials Configured', desc: 'Your WhatsApp Business API details have been entered by our team' },
  { key: 'verified',    label: 'Verified with Meta',     desc: 'Your credentials were confirmed working' },
  { key: 'active',      label: 'Bot Activated',          desc: 'Your AI assistant is live and responding' },
];

// Returns { steps, completedCount } — completedCount === steps.length means
// every step is genuinely done (terminal state, no spinner shown anywhere).
function getProgress({ hasRequest, requestStatus, wa, isActive }) {
  if (hasRequest) {
    const idx = REQUEST_ORDER.indexOf(requestStatus);
    // Unknown/rejected status is handled separately by the caller — this
    // function is only reached for the four real, ordered stages.
    return { steps: REQUEST_STEPS, completedCount: idx < 0 ? 0 : idx + 1 };
  }
  let completedCount = 0;
  if (wa.phoneNumberId) completedCount = 1;
  if (wa.connected) completedCount = 2;
  if (wa.connected && isActive) completedCount = 3;
  return { steps: ADMIN_STEPS, completedCount };
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
  // Fetch fresh business + tenantStatus — AuthContext's `user` snapshot may be
  // a little stale between refreshes.
  const [liveTenantStatus, setLiveTenantStatus] = useState(null);
  const [liveBizPhoneId, setLiveBizPhoneId] = useState(null);
  const [bizLoading, setBizLoading] = useState(true);
  // Poll the tenant's own connection-request status, if one exists. A 404
  // here just means this tenant never submitted a self-service request (the
  // normal case for admin-onboarded tenants) — not an error.
  const [requestStatus, setRequestStatus] = useState(null);

  useEffect(() => {
    bizApi.get()
      .then(r => {
        setLiveTenantStatus(r.data?.tenantStatus || null);
        setLiveBizPhoneId(r.data?.business?.phoneNumberId || null);
      })
      .catch(() => setLiveTenantStatus(null))
      .finally(() => setBizLoading(false));
    bizApi.connectionRequestStatus()
      .then(r => setRequestStatus(r.data?.status || r.data?.request?.status || null))
      .catch(() => setRequestStatus(null));
  }, []);

  // Prefer the live tenantStatus fetch (authoritative, real Tenant fields)
  // over the cached user object from AuthContext, falling back to `user`
  // while the live fetch is in flight.
  const ts = liveTenantStatus || {
    status:         user?.status,
    onboardingStep: user?.onboardingStep,
    whatsapp:       user?.whatsapp,
  };

  const wa = {
    phoneNumberId: ts.whatsapp?.phoneNumberId || liveBizPhoneId || undefined,
    phone:         ts.whatsapp?.phone || undefined,
    connected:     ts.whatsapp?.connected === true,
  };

  const tenantStatusValue = ts.status || 'PENDING';
  // The bot only actually responds when BOTH are true — verifying credentials
  // and activating the tenant are two separate, real admin actions.
  const isActive    = tenantStatusValue === 'ACTIVE';
  const isConnected = wa.connected === true;
  const isLive       = isConnected && isActive;
  const isConfigured = !!wa.phoneNumberId;

  const hasRequest = requestStatus != null;
  const isRejected = requestStatus === 'rejected';

  const { steps, completedCount } = getProgress({ hasRequest, requestStatus, wa, isActive });

  const handleRefresh = async () => {
    setRefreshing(true);
    setBizLoading(true);
    try {
      await refreshUser();
      const r = await bizApi.get();
      setLiveTenantStatus(r.data?.tenantStatus || null);
      setLiveBizPhoneId(r.data?.business?.phoneNumberId || null);
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
          type={isRejected ? 'error' : isLive ? 'success' : isConnected ? 'warning' : isConfigured ? 'warning' : 'info'}
          style={{ marginBottom: 20 }}
        >
          {isRejected
            ? '❌ Your WhatsApp connection request was not approved. Contact alhassantrawally1@gmail.com or +220 3532423 for details.'
            : isLive
            ? '✅ Your WhatsApp number is connected and the bot is active.'
            : isConnected
            ? '⏳ Your WhatsApp number is verified with Meta. Waiting for our team to activate your account.'
            : isConfigured
            ? '⏳ Your WhatsApp credentials are saved. Waiting for our team to verify them with Meta.'
            : hasRequest
            ? '📋 Your connection request is being processed by our team.'
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
            {!isRejected && (
              <Badge color={completedCount >= steps.length ? 'green' : completedCount > 0 ? 'amber' : 'gray'}>
                {completedCount >= steps.length ? 'Connected' : completedCount > 0 ? 'In Progress' : 'Not Started'}
              </Badge>
            )}
          </div>

          {isRejected ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This request was not approved. Please contact <strong>alhassantrawally1@gmail.com</strong> or <strong>+220 3532423</strong> for details or to resubmit.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((step, i) => {
                // A step below completedCount is done. The step AT completedCount
                // is "active" (in progress) UNLESS completedCount has reached the
                // end of the list, in which case every step — including the last
                // one — is genuinely done and none should show a spinner.
                const allDone = completedCount >= steps.length;
                const status = i < completedCount || allDone ? 'done' : i === completedCount ? 'active' : 'pending';
                return (
                  <StepItem
                    key={step.key}
                    step={step}
                    status={status}
                    isLast={i === steps.length - 1}
                  />
                );
              })}
            </div>
          )}
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
                    {isLive
                      ? <><CheckCircle2 size={16} color="var(--primary)" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>Bot Active</span></>
                      : isConnected
                      ? <><AlertCircle size={16} color="var(--amber)" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--amber)' }}>Verified — Awaiting Activation</span></>
                      : isConfigured
                      ? <><AlertCircle size={16} color="var(--amber)" /><span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--amber)' }}>Awaiting Verification</span></>
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
                  Once your credentials are verified with Meta and your account is activated,
                  your bot will start responding automatically.
                  Contact <strong>alhassantrawally1@gmail.com</strong> or <strong>+220 3532423</strong> if setup has not progressed within 24 hours.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
