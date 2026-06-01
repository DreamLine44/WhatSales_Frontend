/**
 * AdminOnboardingDashboard.jsx
 * Super-Admin page for managing WhatsApp onboarding requests.
 *
 * NEW FILE — does not modify AdminDashboardPage.jsx.
 * Accessible via: /admin/onboarding  (linked from AdminDashboardPage button)
 *
 * Sections:
 *  - Stats (Total, Pending, Contacted, Connecting, Connected, Rejected)
 *  - Requests Table with search + filter
 *  - Review Modal (view details, update status, admin notes)
 *  - Connection Panel (save credentials, test connection, mark connected)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/AdminContext';
import { adminOnboarding, getStatusMeta, ONBOARDING_STATUSES } from '../services/whatsappOnboardingApi';
import { WhatsalesLogo } from '../App';
import toast from 'react-hot-toast';
import {
  ArrowLeft, RefreshCw, Search, X, Loader2, ChevronDown, ChevronUp,
  LogOut, Wifi, AlertTriangle, CheckCircle2, Eye,
  Building2, User, Key,
  Zap, MessageSquare,
} from 'lucide-react';

// ── Shared style atoms ────────────────────────────────────────────────────────
const card = (extra = {}) => ({
  background: 'var(--bg-surface)',
  border: '1.5px solid var(--border)',
  borderRadius: 12,
  padding: '20px 22px',
  ...extra,
});

const labelSt = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 };

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

const dangerBtn = { ...primaryBtn, background: 'var(--red)' };

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

const iconBtn = { background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', borderRadius: 4 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function useEscapeKey(fn) {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') fnRef.current(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []); // empty deps — handler is stable via ref
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

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: meta.color, background: meta.bg, padding: '3px 10px', borderRadius: 99 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
      {meta.label}
    </span>
  );
}

// ── ConnectionTestResult ──────────────────────────────────────────────────────
function ConnectionTestResult({ result }) {
  if (!result) return null;

  const configs = {
    connected:     { color: 'var(--green)',  bg: 'var(--green-dim)',  icon: CheckCircle2, title: 'Connected', msg: 'WhatsApp connection is working correctly.' },
    invalid_token: { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Invalid Token', msg: 'The access token is invalid or expired.' },
    invalid_phone: { color: 'var(--amber)',  bg: 'var(--amber-dim)', icon: AlertTriangle, title: 'Invalid Phone Number', msg: 'The Phone Number ID is invalid or not found.' },
    meta_error:    { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Meta API Error', msg: result.message || 'An error was returned from Meta.' },
    error:         { color: 'var(--red)',    bg: 'var(--red-dim)',    icon: AlertTriangle, title: 'Connection Failed', msg: result.message || 'Unknown error during connection test.' },
  };

  const cfg = configs[result.status] || configs.error;
  const Icon = cfg.icon;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: 10, marginTop: 12 }}>
      <Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: cfg.color, marginBottom: 2 }}>{cfg.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cfg.msg}</div>
      </div>
    </div>
  );
}

// ── ConnectionPanel ───────────────────────────────────────────────────────────
function ConnectionPanel({ request, adminNotes, onConnected }) {
  const [form, setForm] = useState({ phoneNumberId: '', wabaId: '', accessToken: '', verifyToken: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [marking, setMarking] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const tenantId = request?.tenantId;

  const handleSave = async () => {
    if (!form.phoneNumberId || !form.accessToken) {
      toast.error('Phone Number ID and Access Token are required');
      return;
    }
    setSaving(true);
    try {
      await adminOnboarding.saveCredentials(tenantId, form);
      toast.success('Credentials saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save credentials');
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminOnboarding.testConnection(tenantId);
      setTestResult(res.data || { status: 'connected' });
    } catch (err) {
      setTestResult({ status: err.response?.data?.status || 'error', message: err.response?.data?.message || 'Connection test failed' });
    } finally { setTesting(false); }
  };

  const handleMarkConnected = async () => {
    setMarking(true);
    try {
      await adminOnboarding.updateStatus(request._id, {
        status: 'CONNECTED',
        adminNotes: adminNotes || 'WhatsApp successfully connected.',
      });
      toast.success('Marked as Connected');
      onConnected?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setMarking(false); }
  };

  return (
    <div style={{ padding: '18px', background: 'var(--bg-overlay)', borderRadius: 10, border: '1px solid var(--border)', marginTop: 16 }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Wifi size={13} color="var(--primary)" /> WhatsApp Credentials
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['phoneNumberId', 'Phone Number ID', false, 'From Meta → WhatsApp → API Setup'],
          ['wabaId', 'WABA ID (Business Account ID)', false, 'Meta WhatsApp Business Account ID'],
          ['accessToken', 'Permanent Access Token', true, 'Permanent token from Meta'],
          ['verifyToken', 'Webhook Verify Token', false, 'Any secure string — must match Meta webhook config'],
        ].map(([key, lbl, secret, hint]) => (
          <div key={key}>
            <label style={labelSt}>{lbl}</label>
            {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>{hint}</div>}
            <input
              type={secret ? 'password' : 'text'}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={`Enter ${lbl}`}
              style={{ ...inputSt, fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
          </div>
        ))}
      </div>

      {testResult && <ConnectionTestResult result={testResult} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn }}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Key size={14} /> Save Credentials</>}
        </button>
        <button onClick={handleTest} disabled={testing} style={ghostBtn}>
          {testing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</> : <><Zap size={14} /> Test Connection</>}
        </button>
        <button onClick={handleMarkConnected} disabled={marking} style={{ ...primaryBtn, background: 'var(--green)' }}>
          {marking ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Marking…</> : <><CheckCircle2 size={14} /> Mark Connected</>}
        </button>
      </div>
    </div>
  );
}

// ── AdminConnectionModal (Review + Connection Panel) ──────────────────────────
function AdminConnectionModal({ request: initialRequest, onClose, onUpdated }) {
  const [request, setRequest]   = useState(initialRequest);
  const [status, setStatus]     = useState(initialRequest?.status || 'PENDING');
  const [adminNotes, setAdminNotes] = useState(initialRequest?.adminNotes || '');
  const [saving, setSaving]     = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  useEscapeKey(onClose);

  // Bug 4 fix: re-sync status & notes if the request prop changes externally
  // (e.g. after ConnectionPanel calls onConnected and the parent updates the row)
  useEffect(() => {
    setRequest(initialRequest);
    setStatus(initialRequest?.status || 'PENDING');
    setAdminNotes(initialRequest?.adminNotes || '');
  }, [initialRequest]);

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      const res = await adminOnboarding.updateStatus(request._id, { status, adminNotes });
      const updated = res.data?.request || { ...request, status, adminNotes };
      setRequest(updated);
      onUpdated?.(updated);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setSaving(false); }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const res = await adminOnboarding.updateStatus(request._id, { status: 'REJECTED', adminNotes });
      const updated = res.data?.request || { ...request, status: 'REJECTED', adminNotes };
      setRequest(updated);
      onUpdated?.(updated);
      toast.success('Request rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally { setRejecting(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <div style={{ ...modalBox, maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Review Request
          </h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        {/* Status badge */}
        <div style={{ marginBottom: 18 }}><StatusBadge status={request.status} /></div>

        {/* Business info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Building2 size={12} /> Business Information
          </div>
          <InfoRow label="Business Name" value={request.businessName} />
          <InfoRow label="Category" value={request.businessCategory} />
          <InfoRow label="WhatsApp Number" value={request.whatsappNumber} />
          <InfoRow label="Request Date" value={formatDate(request.createdAt)} />
        </div>

        {/* Contact info */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <User size={12} /> Contact Information
          </div>
          <InfoRow label="Contact Person" value={request.contactPersonName} />
          <InfoRow label="Email" value={request.contactEmail} />
          <InfoRow label="Tenant" value={request.tenantId} mono />
        </div>

        {/* Request notes */}
        {request.additionalNotes && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Request Notes</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{request.additionalNotes}</div>
          </div>
        )}

        {/* Admin controls */}
        <div style={{ marginBottom: 16 }}>
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

          <label style={labelSt}>Admin Notes</label>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="Internal notes visible to the tenant (e.g. 'Waiting for Meta approval')…"
            rows={3}
            style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Connection Panel toggle */}
        <button
          onClick={() => setShowConnect(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: '1.5px dashed var(--border-strong)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Wifi size={15} /> {showConnect ? 'Hide' : 'Show'} Connection Panel
          {showConnect ? <ChevronUp size={14} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={14} style={{ marginLeft: 'auto' }} />}
        </button>
        {showConnect && (
          <ConnectionPanel
            request={request}
            adminNotes={adminNotes}
            onConnected={() => {
              setStatus('CONNECTED');
              setRequest(r => ({ ...r, status: 'CONNECTED' }));
              onUpdated?.({ ...request, status: 'CONNECTED', adminNotes });
            }}
          />
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={ghostBtn}>Close</button>
          <div style={{ flex: 1 }} />
          <button onClick={handleReject} disabled={rejecting} style={dangerBtn}>
            {rejecting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />} Reject
          </button>
          <button onClick={handleSaveStatus} disabled={saving} style={primaryBtn}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><CheckCircle2 size={14} /> Save Status</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RequestRow ────────────────────────────────────────────────────────────────
function RequestRow({ request, onUpdated }) {
  const [showModal, setShowModal] = useState(false);
  const [req, setReq] = useState(request);

  // Bug 7 fix: keep local req in sync when the parent array is updated
  useEffect(() => { setReq(request); }, [request]);

  return (
    <>
      {showModal && (
        <AdminConnectionModal
          request={req}
          onClose={() => setShowModal(false)}
          onUpdated={(updated) => { setReq(updated); onUpdated?.(updated); }}
        />
      )}
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={tdSt}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{req.businessName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.businessCategory}</div>
        </td>
        <td style={tdSt}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {req.tenantId}
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

const tdSt = { padding: '12px 14px', verticalAlign: 'middle' };
const thSt = { padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid var(--border)' };

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color, fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main Admin Onboarding Dashboard ──────────────────────────────────────────
export default function AdminOnboardingDashboard() {
  const { adminLogout } = useAdmin();
  const navigate = useNavigate();
  const [requests, setRequests]  = useState([]);
  const [loading, setLoading]    = useState(true);
  const [search, setSearch]      = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminOnboarding.listRequests();
      setRequests(res.data?.requests || res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const stats = {
    total:      requests.length,
    pending:    requests.filter(r => r.status === 'PENDING').length,
    contacted:  requests.filter(r => r.status === 'CONTACTED').length,
    connecting: requests.filter(r => r.status === 'CONNECTING').length,
    connected:  requests.filter(r => r.status === 'CONNECTED').length,
    rejected:   requests.filter(r => r.status === 'REJECTED').length,
  };

  const filtered = requests.filter(r => {
    const matchSearch = !search ||
      (r.businessName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.tenantId || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.contactEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.whatsappNumber || '').includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
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
          <StatCard label="Total Requests" value={stats.total} color="var(--blue)" />
          <StatCard label="Pending"        value={stats.pending} color="var(--amber)" />
          <StatCard label="Contacted"      value={stats.contacted} color="var(--blue)" />
          <StatCard label="Connecting"     value={stats.connecting} color="var(--purple)" />
          <StatCard label="Connected"      value={stats.connected} color="var(--green)" />
          <StatCard label="Rejected"       value={stats.rejected} color="var(--red)" />
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

        {/* Table */}
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
                    <th style={thSt}>Business Name</th>
                    <th style={thSt}>Tenant</th>
                    <th style={thSt}>Phone Number</th>
                    <th style={thSt}>Email</th>
                    <th style={thSt}>Request Date</th>
                    <th style={thSt}>Status</th>
                    <th style={thSt}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, i) => (
                    <RequestRow
                      key={req._id || i}
                      request={req}
                      onUpdated={(updated) => setRequests(rs => rs.map(r => (r._id === updated._id ? updated : r)))}
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
        input:focus, select:focus, textarea:focus { border-color: var(--primary) !important; outline: none; }
        tr:hover { background: var(--bg-overlay); }
      `}</style>
    </div>
  );
}
