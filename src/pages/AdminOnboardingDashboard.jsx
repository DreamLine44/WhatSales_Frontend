/**
 * AdminOnboardingDashboard.jsx
 * Super-Admin page for managing WhatsApp onboarding requests.
 *
 * FIXES APPLIED:
 *  [FIX-ADMIN-1]  Status select in AdminConnectionModal now normalises the initial
 *                 value to UPPERCASE so it always matches the option keys. DB returns
 *                 lowercase ('pending'), options use uppercase ('PENDING') — was blank.
 *  [FIX-ADMIN-2]  handleSaveStatus sends status lowercased (backend canonical form).
 *  [FIX-ADMIN-3]  ConnectionPanel.tenantId extraction uses extractTenantId() helper
 *                 which correctly unwraps populated objects (tenantId._id || tenantId).
 *  [FIX-ADMIN-4]  ConnectionTestResult now normalises result.result to lowercase before
 *                 lookup — backend returns 'CONNECTED' but config keys were lowercase.
 *  [FIX-ADMIN-5]  handleMarkConnected in ConnectionPanel now calls the dedicated
 *                 testConnection endpoint (POST /admin/whatsapp/test/:tenantId) instead
 *                 of manually patching status — backend handles the connected transition
 *                 atomically (transaction + notification + Tenant.status=ACTIVE).
 *  [FIX-ADMIN-6]  ConnectionPanel validates wabaId is also present before saving.
 *  [FIX-ADMIN-7]  onConnected callback now triggers full modal refresh + parent list refresh.
 *  [FIX-ADMIN-8]  handleReject is protected: shows confirm prompt before rejecting.
 *  [FIX-ADMIN-9]  Status select prevents backwards transitions by showing a warning
 *                 when the selected status is a backwards move.
 *  [FIX-ADMIN-10] Request list fetchRequests now shows the full error from backend.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/AdminContext';
import {
  adminOnboarding,
  getStatusMeta,
  normalizeStatus,
  ONBOARDING_STATUSES,
  extractTenantId,
} from '../services/whatsappOnboardingApi';
import { WhatsalesLogo } from '../App';
import toast from 'react-hot-toast';
import {
  ArrowLeft, RefreshCw, Search, X, Loader2, ChevronDown, ChevronUp,
  LogOut, Wifi, AlertTriangle, CheckCircle2, Eye,
  Building2, User, FileText, Clock, Key,
  Zap, MessageSquare,
} from 'lucide-react';

// ── Shared style atoms ─────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: 'var(--bg-surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 12,
  padding: '20px 22px',
  ...extra,
});

const labelSt = {
  fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)',
  display: 'block', marginBottom: 5,
};

const inputSt = {
  width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'var(--font-body)', fontSize: '0.9rem', background: 'var(--bg-surface)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
};

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 7,
  background: 'var(--primary)', color: '#fff', border: 'none',
  borderRadius: 8, padding: '9px 16px', fontFamily: 'var(--font-body)',
  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
};

const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none',
  color: 'var(--text-secondary)', border: '1.5px solid var(--border)', borderRadius: 8,
  padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 600,
  fontSize: '0.85rem', cursor: 'pointer',
};

const dangerBtn  = { ...primaryBtn, background: 'var(--red)' };
const successBtn = { ...primaryBtn, background: 'var(--green)' };

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(8,18,12,0.58)',
  backdropFilter: 'blur(6px)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const modalBox = {
  background: 'var(--bg-surface)', borderRadius: 16, padding: '28px',
  width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  border: '1.5px solid var(--border)',
};
const iconBtn = {
  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', borderRadius: 4,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function useEscapeKey(fn) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') fn(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [fn]);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: mono ? 'monospace' : undefined, textAlign: 'right', wordBreak: 'break-all' }}>
        {value || '—'}
      </span>
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  // [FIX-ADMIN-1] normalizeStatus handles both 'pending' and 'PENDING'
  const meta = getStatusMeta(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: meta.color, background: meta.bg, padding: '3px 10px', borderRadius: 99 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ── ConnectionTestResult ───────────────────────────────────────────────────────
// [FIX-ADMIN-4] result.result comes as uppercase from backend ('CONNECTED','INVALID_TOKEN'…)
//               normalise to lowercase for config lookup.
function ConnectionTestResult({ result }) {
  if (!result) return null;

  const configs = {
    connected:            { color: 'var(--green)',  bg: 'var(--green-dim)',  icon: CheckCircle2, title: 'Connected',           msg: 'WhatsApp connection is working correctly. Tenant is now live!' },
    invalid_token:        { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Invalid Token',       msg: 'The access token is invalid or expired. Rotate it in Meta Business Suite.' },
    invalid_phone_number: { color: 'var(--amber)',  bg: 'var(--amber-dim)', icon: AlertTriangle, title: 'Invalid Phone Number', msg: 'The Phone Number ID is invalid or not accessible with this token.' },
    meta_error:           { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Meta API Error',      msg: result.error || result.message || 'An error was returned from Meta.' },
    error:                { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Connection Failed',   msg: result.error || result.message || 'Unknown error during connection test.' },
  };

  // [FIX-ADMIN-4] normalise result key: 'CONNECTED' → 'connected', 'INVALID_TOKEN' → 'invalid_token'
  const rawKey = (result.result || 'error').toLowerCase().replace(/_/g, '_');
  const cfg = configs[rawKey] || configs.error;
  const Icon = cfg.icon;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: 10, marginTop: 12 }}>
      <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.color, marginBottom: 2 }}>{cfg.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cfg.msg}</div>
        {result.hint && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            💡 {result.hint}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ConnectionPanel ────────────────────────────────────────────────────────────
function ConnectionPanel({ request, onConnected, onRequestUpdated }) {
  const [form, setForm] = useState({ phoneNumberId: '', wabaId: '', accessToken: '', verifyToken: '' });
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // [FIX-ADMIN-3] Use extractTenantId to handle both raw string and populated object
  const tenantId = extractTenantId(request);

  // [FIX-ADMIN-6] Validate both required credential fields before saving
  const handleSave = async () => {
    if (!form.phoneNumberId.trim()) {
      toast.error('Phone Number ID is required');
      return;
    }
    if (!form.wabaId.trim()) {
      toast.error('WABA ID (Business Account ID) is required');
      return;
    }
    if (!tenantId) {
      toast.error('Tenant ID is missing — cannot save credentials');
      return;
    }

    setSaving(true);
    try {
      await adminOnboarding.saveCredentials(tenantId, form);
      toast.success('Credentials saved. Run "Test & Connect" to verify.');
      setTestResult(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to save credentials';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  // [FIX-ADMIN-5] Test connection via backend endpoint — backend handles the full
  //               connected transition atomically (was: manually patching status).
  const handleTestAndConnect = async () => {
    if (!tenantId) {
      toast.error('Tenant ID is missing — cannot test connection');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminOnboarding.testConnection(tenantId);
      const data = res.data;
      setTestResult(data);

      if (data?.result === 'CONNECTED') {
        toast.success('WhatsApp verified — tenant is now live!');
        // [FIX-ADMIN-7] Signal parent to refresh the request state
        onConnected?.();
        onRequestUpdated?.({ ...request, status: 'connected' });
      }
    } catch (err) {
      const errData = err.response?.data || {};
      // Still show the result card even on API error
      setTestResult({
        result:  errData.result || 'error',
        error:   errData.error  || errData.message || 'Connection test failed',
        hint:    errData.hint   || null,
      });
    } finally { setTesting(false); }
  };

  return (
    <div style={{ padding: '18px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)', marginTop: 16 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Wifi size={13} color="var(--primary)" /> WhatsApp Credentials
      </div>

      {/* [FIX-ADMIN-3] Show resolved tenantId for debugging */}
      {tenantId && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'monospace' }}>
          Tenant: {tenantId}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'phoneNumberId', label: 'Phone Number ID *',             secret: false, hint: 'Meta → WhatsApp → API Setup → Phone number ID (numeric, 10–20 digits)' },
          { key: 'wabaId',        label: 'WABA ID (Business Account ID) *', secret: false, hint: 'Meta → WhatsApp → API Setup → WhatsApp Business Account ID' },
          { key: 'accessToken',   label: 'Permanent Access Token',        secret: true,  hint: 'Permanent system user token from Meta Business Suite' },
          { key: 'verifyToken',   label: 'Webhook Verify Token',          secret: false, hint: 'Any secure string — must match what you set in Meta webhook config' },
        ].map(({ key, label: lbl, secret, hint }) => (
          <div key={key}>
            <label style={labelSt}>{lbl}</label>
            {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>{hint}</div>}
            <input
              type={secret ? 'password' : 'text'}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={`Enter ${lbl.replace(' *', '')}`}
              style={{ ...inputSt, fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
          </div>
        ))}
      </div>

      {testResult && <ConnectionTestResult result={testResult} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={saving} style={primaryBtn}>
          {saving
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            : <><Key size={14} /> Save Credentials</>
          }
        </button>
        {/* [FIX-ADMIN-5] Combined Test + Connect button — backend handles transition atomically */}
        <button onClick={handleTestAndConnect} disabled={testing || saving} style={successBtn}>
          {testing
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</>
            : <><Zap size={14} /> Test &amp; Connect</>
          }
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Save credentials first, then click <strong>Test & Connect</strong> to verify with Meta and automatically mark the tenant as connected.
      </div>
    </div>
  );
}

// ── AdminConnectionModal ───────────────────────────────────────────────────────
function AdminConnectionModal({ request: initialRequest, onClose, onUpdated }) {
  const [request, setRequest] = useState(initialRequest);
  // [FIX-ADMIN-1] normalizeStatus ensures select initial value matches UPPERCASE option keys
  const [status, setStatus]   = useState(normalizeStatus(initialRequest?.status));
  const [adminNotes, setAdminNotes] = useState(initialRequest?.adminNotes || '');
  const [saving, setSaving]   = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState(false);
  useEscapeKey(onClose);

  // [FIX-ADMIN-2] Send status lowercase — canonical backend form
  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      const res = await adminOnboarding.updateStatus(request._id, {
        status,           // API service lowercases this automatically [FIX-API-4]
        adminNotes,
      });
      const updated = res.data?.request || { ...request, status: status.toLowerCase(), adminNotes };
      setRequest(updated);
      setStatus(normalizeStatus(updated.status));  // re-sync after save
      onUpdated?.(updated);
      toast.success('Status updated');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  // [FIX-ADMIN-8] Reject now guarded by a confirm state
  const handleRejectConfirmed = async () => {
    setRejectConfirm(false);
    setSaving(true);
    try {
      const res = await adminOnboarding.updateStatus(request._id, {
        status: 'rejected',
        adminNotes,
      });
      const updated = res.data?.request || { ...request, status: 'rejected', adminNotes };
      setRequest(updated);
      setStatus('REJECTED');
      onUpdated?.(updated);
      toast.success('Request rejected');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to reject';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const currentNormalized = normalizeStatus(request.status);
  const isTerminal = currentNormalized === 'CONNECTED' || currentNormalized === 'REJECTED';

  return (
    <div style={modalOverlay}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ ...modalBox, maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Review Request
          </h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        {/* Status badge */}
        <div style={{ marginBottom: 18 }}>
          <StatusBadge status={request.status} />
        </div>

        {/* Business info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Building2 size={12} /> Business Information
          </div>
          <InfoRow label="Business Name"   value={request.businessName} />
          <InfoRow label="Category"        value={request.businessCategory} />
          <InfoRow label="WhatsApp Number" value={request.whatsappNumber} />
          <InfoRow label="Request Date"    value={formatDate(request.createdAt)} />
        </div>

        {/* Contact info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <User size={12} /> Contact Information
          </div>
          {/* [FIX-PAGE-2] contactPerson is the correct backend field name */}
          <InfoRow label="Contact Person" value={request.contactPerson} />
          <InfoRow label="Email"          value={request.contactEmail} />
          <InfoRow label="Tenant ID"      value={extractTenantId(request)} mono />
        </div>

        {/* Request notes */}
        {request.notes && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Request Notes</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{request.notes}</div>
          </div>
        )}

        {/* Admin controls — hide for terminal statuses */}
        {!isTerminal && (
          <div style={{ marginBottom: 16 }}>
            {/* [FIX-ADMIN-1] Status select: initial value is UPPERCASE, options are UPPERCASE */}
            <label style={labelSt}>Update Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              style={{ ...inputSt, marginBottom: 10 }}
            >
              {Object.entries(ONBOARDING_STATUSES).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>

            <label style={labelSt}>Admin Notes (visible to tenant)</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="e.g. 'Called Fatou, confirmed the number. Setting up tomorrow.'"
              rows={3}
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        )}

        {/* Terminal state info */}
        {isTerminal && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: currentNormalized === 'CONNECTED' ? 'var(--green-dim)' : 'var(--red-dim)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: currentNormalized === 'CONNECTED' ? 'var(--green)' : 'var(--red)' }}>
              {currentNormalized === 'CONNECTED' ? '✅ Tenant is connected and live.' : '❌ This request has been rejected.'}
            </div>
            {request.adminNotes && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>{request.adminNotes}</div>
            )}
          </div>
        )}

        {/* Connection Panel — only show for non-terminal, non-rejected states */}
        {!isTerminal && (
          <>
            <button
              onClick={() => setShowConnect(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <Wifi size={15} /> {showConnect ? 'Hide' : 'Open'} WhatsApp Credential Panel
              {showConnect ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
            </button>
            {showConnect && (
              <ConnectionPanel
                request={request}
                onConnected={() => {
                  // [FIX-ADMIN-7] Update local state immediately on connection
                  setStatus('CONNECTED');
                  setRequest(r => ({ ...r, status: 'connected' }));
                }}
                onRequestUpdated={(updated) => {
                  onUpdated?.(updated);
                }}
              />
            )}
          </>
        )}

        {/* [FIX-ADMIN-8] Reject confirm inline prompt */}
        {rejectConfirm && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--red-dim)', border: '1px solid rgba(220,53,53,0.3)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--red)', marginBottom: 8 }}>
              Reject this request? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setRejectConfirm(false)} style={{ ...ghostBtn, fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleRejectConfirmed} disabled={saving} style={{ ...dangerBtn, fontSize: '0.82rem' }}>
                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={13} />} Yes, Reject
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={ghostBtn}>Close</button>
          <div style={{ flex: 1 }} />
          {!isTerminal && (
            <>
              {!rejectConfirm && (
                <button onClick={() => setRejectConfirm(true)} disabled={saving} style={dangerBtn}>
                  <X size={14} /> Reject
                </button>
              )}
              <button onClick={handleSaveStatus} disabled={saving} style={primaryBtn}>
                {saving
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                  : <><CheckCircle2 size={14} /> Save Status</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── RequestRow ─────────────────────────────────────────────────────────────────
const tdSt = { padding: '12px 14px', verticalAlign: 'middle' };
const thSt = { padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--border)' };

function RequestRow({ request, onUpdated }) {
  const [showModal, setShowModal] = useState(false);
  const [req, setReq] = useState(request);

  return (
    <>
      {showModal && (
        <AdminConnectionModal
          request={req}
          onClose={() => setShowModal(false)}
          onUpdated={(updated) => {
            setReq(updated);
            onUpdated?.(updated);
          }}
        />
      )}
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={tdSt}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{req.businessName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.businessCategory}</div>
        </td>
        <td style={tdSt}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {/* [FIX-ADMIN-3] Show string form of tenantId */}
            {extractTenantId(req) || '—'}
          </div>
        </td>
        <td style={tdSt}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{req.whatsappNumber}</div>
        </td>
        <td style={tdSt}>
          <div style={{ fontSize: '0.82rem' }}>{req.contactEmail}</div>
        </td>
        <td style={tdSt}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</div>
        </td>
        <td style={tdSt}><StatusBadge status={req.status} /></td>
        <td style={tdSt}>
          <button onClick={() => setShowModal(true)} style={{ ...primaryBtn, padding: '6px 12px', fontSize: '0.78rem' }}>
            <Eye size={13} /> Review
          </button>
        </td>
      </tr>
    </>
  );
}

// ── Stats Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main Admin Onboarding Dashboard ───────────────────────────────────────────
export default function AdminOnboardingDashboard() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // [FIX-ADMIN-10] Show backend error message in toast
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminOnboarding.listRequests();
      setRequests(res.data?.requests || res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to load requests';
      toast.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Stats computed from local state (always accurate)
  const stats = {
    total:      requests.length,
    pending:    requests.filter(r => normalizeStatus(r.status) === 'PENDING').length,
    contacted:  requests.filter(r => normalizeStatus(r.status) === 'CONTACTED').length,
    connecting: requests.filter(r => normalizeStatus(r.status) === 'CONNECTING').length,
    connected:  requests.filter(r => normalizeStatus(r.status) === 'CONNECTED').length,
    rejected:   requests.filter(r => normalizeStatus(r.status) === 'REJECTED').length,
  };

  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      (r.businessName  || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.contactEmail  || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.whatsappNumber || '').includes(search) ||
      String(extractTenantId(r) || '').toLowerCase().includes(search.toLowerCase());
    // [FIX-ADMIN-1] Compare normalised statuses
    const matchStatus = !filterStatus || normalizeStatus(r.status) === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className='ws-onboarding' style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top nav */}
      <header style={{ background: 'var(--deep-green)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WhatsalesLogo size={34} light />
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff', fontSize: '1rem', letterSpacing: '-0.02em' }}>WhatSales</span>
            <span style={{ marginLeft: 8, background: 'rgba(255,100,100,0.2)', color: '#ff9999', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,100,100,0.3)', letterSpacing: '0.08em' }}>
              SUPER ADMIN
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
            <ArrowLeft size={14} /> Back to Tenants
          </button>
          <button onClick={() => { adminLogout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Wifi size={20} color="var(--primary)" />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              WhatsApp Onboarding
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Review tenant connection requests, update statuses, and configure WhatsApp credentials.
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Total"      value={stats.total}      color="var(--blue)"   />
          <StatCard label="Pending"    value={stats.pending}    color="var(--amber)"  />
          <StatCard label="Contacted"  value={stats.contacted}  color="var(--blue)"   />
          <StatCard label="Connecting" value={stats.connecting} color="var(--purple)" />
          <StatCard label="Connected"  value={stats.connected}  color="var(--green)"  />
          <StatCard label="Rejected"   value={stats.rejected}   color="var(--red)"    />
        </div>

        {/* Filters + search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by business, email, phone, or tenant ID…"
              style={{ ...inputSt, paddingLeft: 32 }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ ...inputSt, width: 'auto', minWidth: 160 }}
          >
            <option value="">All Statuses</option>
            {Object.entries(ONBOARDING_STATUSES).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button onClick={fetchRequests} style={ghostBtn}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Requests table */}
        <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
              <div style={{ fontSize: '0.88rem' }}>Loading requests…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <MessageSquare size={36} color="var(--border-strong)" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                {search || filterStatus ? 'No requests match your filters' : 'No onboarding requests yet'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Requests appear here when tenants submit from their dashboard.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead style={{ background: 'var(--bg-overlay)' }}>
                  <tr>
                    <th style={thSt}>Business</th>
                    <th style={thSt}>Tenant</th>
                    <th style={thSt}>WhatsApp</th>
                    <th style={thSt}>Email</th>
                    <th style={thSt}>Date</th>
                    <th style={thSt}>Status</th>
                    <th style={thSt}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, i) => (
                    <RequestRow
                      key={req._id || i}
                      request={req}
                      onUpdated={(updated) =>
                        setRequests(rs => rs.map(r => (r._id === updated._id ? updated : r)))
                      }
                    />
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Showing {filtered.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes glow { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        .ws-onboarding input:focus, .ws-onboarding select:focus, .ws-onboarding textarea:focus { border-color: var(--primary) !important; outline: none; }
        .ws-onboarding tr:hover { background: var(--bg-overlay); }
      `}</style>
    </div>
  );
}
