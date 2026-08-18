import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Copy, Check, Shield, ShieldAlert, ShieldCheck, KeyRound, Lock, AlertTriangle } from 'lucide-react';
import { staffApi, staffAuthApi, bizApi, getTenantId } from '../api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Select, Badge, Modal } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const ROLE_META = {
  OWNER:   { label: 'Owner',   color: 'green', icon: ShieldCheck },
  MANAGER: { label: 'Manager', color: 'blue',  icon: Shield },
  STAFF:   { label: 'Staff',   color: 'gray',  icon: ShieldAlert },
};

function InviteLinkModal({ invite, onClose }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}/accept-invite?token=${invite.inviteToken}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select and copy the link manually');
    }
  };

  return (
    <Modal onClose={onClose} title="Invite created">
      <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          Share this link with <strong>{invite.admin.name}</strong> ({invite.admin.email}) so they can set their
          password. <strong>This link is shown once</strong> — it isn't stored anywhere, so copy it now.
          It expires {new Date(invite.inviteExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '10px 12px', marginBottom: 16,
        }}>
          <code style={{ flex: 1, fontSize: '0.78rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{inviteUrl}</code>
          <Btn size="sm" variant="soft" onClick={copy}>
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </Btn>
        </div>
        <Btn variant="ghost" onClick={onClose} style={{ width: '100%' }}>Done</Btn>
      </div>
    </Modal>
  );
}

function InviteModal({ onClose, onInvited }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'STAFF' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    setSaving(true);
    try {
      const r = await staffApi.invite(getTenantId(), {
        name: form.name.trim(), email: form.email.trim(), role: form.role,
      });
      onInvited(r.data);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} title="Invite Team Member">
      <div style={{ padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Fatou Jallow" />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="fatou@business.com" />
        <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="STAFF">Staff — day-to-day orders &amp; bookings</option>
          <option value="MANAGER">Manager — staff access plus reports</option>
          <option value="OWNER">Owner — full access, can manage the team</option>
        </Select>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn onClick={submit} loading={saving}><Plus size={14} /> Send Invite</Btn>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ClaimOwnerCard({ onClaimed }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) { toast.error('All fields are required'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await staffAuthApi.claimOwner(getTenantId(), {
        name: form.name.trim(), email: form.email.trim(), password: form.password,
      });
      toast.success('Owner account created — you can now sign in with Team Login too');
      onClaimed();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Card style={{ maxWidth: 480 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
        Set up named team accounts
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 16 }}>
        This account still uses a single shared API key. Create your own named Owner login below to start
        inviting individual team members with their own credentials — you can keep using the shared key too,
        nothing changes for it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input label="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Your email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <Input label="Choose a password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" />
        <Btn onClick={submit} loading={saving} style={{ alignSelf: 'flex-start' }}>Create Owner Account</Btn>
      </div>
    </Card>
  );
}

// [NO-SELFSERVE-PASSWORD-1] Backend now supports POST /dashboard/auth/change-password —
// only reachable while signed in with an individual Bearer session (adminSession
// truthy), not the shared legacy API key, which has no individual password at all.
function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const submit = async () => {
    if (!form.currentPassword || !form.newPassword) { toast.error('Both fields are required'); return; }
    if (form.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (form.newPassword !== form.confirm) { toast.error("New password and confirmation don't match"); return; }
    setSaving(true);
    try {
      await staffAuthApi.changePassword(form.currentPassword, form.newPassword);
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setOpen(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Card style={{ maxWidth: 480, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Lock size={16} color="var(--text-muted)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Password</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Change the password for your own account</div>
          </div>
        </div>
        {!open && <Btn size="sm" variant="soft" onClick={() => setOpen(true)}>Change</Btn>}
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <Input label="Current password" type="password" value={form.currentPassword}
            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))} />
          <Input label="New password" type="password" value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="At least 8 characters" />
          <Input label="Confirm new password" type="password" value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={submit} loading={saving}>Save Password</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { setOpen(false); setForm({ currentPassword: '', newPassword: '', confirm: '' }); }}>Cancel</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

// [NO-SELFSERVE-APIKEY-1] Backend now supports POST /dashboard/:tenantId/rotate-key,
// OWNER-gated. Rotating immediately invalidates the previous shared key for every
// other admin/script still using it, so this is a two-step confirm with the new
// key shown exactly once, mirroring InviteLinkModal's own "shown once, copy it now" UX.
function RotateKeyCard() {
  const [confirming, setConfirming] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const rotate = async () => {
    setRotating(true);
    try {
      const r = await bizApi.rotateOwnApiKey();
      setNewKey(r.data.apiKey);
      setConfirming(false);
      toast.success('API key rotated — the old key no longer works');
    } catch (err) { toast.error(err.message); }
    finally { setRotating(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(newKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy — select and copy the key manually'); }
  };

  return (
    <Card style={{ maxWidth: 480, marginBottom: 16, borderColor: confirming ? 'var(--red)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KeyRound size={16} color="var(--text-muted)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Shared API Key</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Used by scripts and the legacy login — rotate it if you suspect it's leaked</div>
          </div>
        </div>
        {!confirming && !newKey && <Btn size="sm" variant="soft" onClick={() => setConfirming(true)}>Rotate</Btn>}
      </div>

      {confirming && (
        <div style={{ marginTop: 16, padding: 12, background: 'var(--red-dim, rgba(220,38,38,0.06))', border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
            <AlertTriangle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
              This immediately invalidates the current key. Any script, integration, or device still signed in with
              the old key (not your Team Login — that's unaffected) will stop working until updated with the new one.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={rotate} loading={rotating} style={{ background: 'var(--red)' }}>Yes, Rotate Key</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {newKey && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 10 }}>
            <strong>This key is shown once</strong> — copy it now and update anywhere it's used.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '10px 12px', marginBottom: 12,
          }}>
            <code style={{ flex: 1, fontSize: '0.76rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{newKey}</code>
            <Btn size="sm" variant="soft" onClick={copy}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
            </Btn>
          </div>
          <Btn size="sm" variant="ghost" onClick={() => setNewKey(null)}>Done</Btn>
        </div>
      )}
    </Card>
  );
}

function AdminRow({ admin, isSelf, isOwner, onChanged }) {
  const [busy, setBusy] = useState(false);
  const meta = ROLE_META[admin.role] || ROLE_META.STAFF;
  // [AUDIT-FIX-STAFF-ROLE-GATE] staffApi.update/remove are OWNER-only server-side
  // (see api.js comments) — a MANAGER/STAFF who lands on /team (the nav item is
  // hidden for them, but the route itself has no role guard) was previously shown
  // fully interactive role dropdowns and Disable/Remove buttons for teammates that
  // would just 403 on click. Not a security hole (backend already enforces this),
  // but a confusing dead-end. Disable the controls here so the UI matches reality.
  const canManage = isOwner && !isSelf;

  const changeRole = async (role) => {
    setBusy(true);
    try {
      const r = await staffApi.update(getTenantId(), admin._id, { role });
      onChanged(r.data.admin);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const toggleStatus = async () => {
    setBusy(true);
    try {
      const r = await staffApi.update(getTenantId(), admin._id, {
        status: admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
      });
      onChanged(r.data.admin);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Remove ${admin.name} from the team? This can't be undone.`)) return;
    setBusy(true);
    try {
      await staffApi.remove(getTenantId(), admin._id);
      onChanged(null, admin._id);
    } catch (err) { toast.error(err.message); setBusy(false); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)',
      padding: '14px 18px', marginBottom: 8,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 'var(--r-bubble)', flexShrink: 0,
        background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem',
      }}>
        {admin.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{admin.name}</span>
          {isSelf && <Badge color="blue">You</Badge>}
          {admin.status !== 'ACTIVE' && <Badge color={admin.status === 'INVITED' ? 'amber' : 'gray'}>{admin.status === 'INVITED' ? 'Invite pending' : 'Disabled'}</Badge>}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{admin.email}</div>
        {admin.lastLoginAt && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', marginTop: 2 }}>
            Last active {new Date(admin.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={admin.role}
          disabled={busy || !canManage}
          onChange={e => changeRole(e.target.value)}
          title={isSelf ? "You can't change your own role" : !isOwner ? 'Only an Owner can change roles' : 'Change role'}
          style={{
            padding: '6px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
            background: 'var(--bg-page)', fontSize: '0.78rem', fontWeight: 700, color: `var(--${meta.color === 'gray' ? 'text-muted' : meta.color})`,
          }}
        >
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="OWNER">Owner</option>
        </select>
        <Btn size="sm" variant="ghost" onClick={toggleStatus} disabled={busy || !canManage}
          title={isSelf ? "You can't disable yourself" : !isOwner ? 'Only an Owner can do this' : undefined}>
          {admin.status === 'ACTIVE' ? 'Disable' : 'Re-enable'}
        </Btn>
        <Btn size="sm" variant="ghost" onClick={remove} disabled={busy || !canManage} style={{ color: 'var(--red)' }}
          title={isSelf ? "You can't remove yourself" : !isOwner ? 'Only an Owner can do this' : 'Remove'}>
          <Trash2 size={13} />
        </Btn>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { adminSession, isOwner } = useAuth();
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [inviting, setInviting] = useState(false);
  const [newInvite, setNewInvite] = useState(null);
  const [needsClaim, setNeedsClaim] = useState(false);

  const load = () => {
    setLoading(true);
    staffApi.list(getTenantId())
      .then(r => {
        const list = r.data?.admins || [];
        setAdmins(list);
        setNeedsClaim(list.length === 0 && adminSession === null);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const handleChanged = (updatedAdmin, removedId) => {
    if (removedId) {
      setAdmins(prev => prev.filter(a => a._id !== removedId));
      toast.success('Removed from team');
    } else if (updatedAdmin) {
      setAdmins(prev => prev.map(a => a._id === updatedAdmin._id ? { ...a, ...updatedAdmin } : a));
      toast.success('Updated');
    }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={Users} title="Team" subtitle={`${admins.length} team member${admins.length !== 1 ? 's' : ''}`}
        actions={isOwner && <Btn size="sm" onClick={() => setInviting(true)}><Plus size={14} /> Invite</Btn>}
      />

      {!isOwner && (
        <div style={{
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.2)',
          borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--amber)', marginBottom: 16,
        }}>
          You're signed in as {ROLE_META[adminSession?.role]?.label || adminSession?.role}. Only an Owner can invite,
          edit, or remove team members.
        </div>
      )}

      {/* [NO-SELFSERVE-PASSWORD-1] / [NO-SELFSERVE-APIKEY-1] — Account & Security.
          Password change needs an individual Bearer session (a legacy shared-key
          login has no password of its own). Key rotation is OWNER-only, matching
          the backend route's requireRole('OWNER') gate. */}
      {adminSession && <ChangePasswordCard />}
      {isOwner && <RotateKeyCard />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : needsClaim ? (
        <ClaimOwnerCard onClaimed={load} />
      ) : admins.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No team members yet"
            description="Invite people to sign in with their own name and role instead of sharing one API key."
            action={isOwner ? <Btn onClick={() => setInviting(true)}><Plus size={14} /> Invite first member</Btn> : null}
          />
        </Card>
      ) : (
        <div>
          {admins.map(a => (
            <AdminRow key={a._id} admin={a} isSelf={adminSession?._id === a._id} isOwner={isOwner} onChanged={handleChanged} />
          ))}
        </div>
      )}

      {inviting && (
        <InviteModal
          onClose={() => setInviting(false)}
          onInvited={(data) => {
            setInviting(false);
            setAdmins(prev => [...prev, { ...data.admin, status: 'INVITED' }]);
            setNewInvite(data);
          }}
        />
      )}
      {newInvite && <InviteLinkModal invite={newInvite} onClose={() => setNewInvite(null)} />}
    </div>
  );
}
