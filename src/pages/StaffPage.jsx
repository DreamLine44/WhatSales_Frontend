import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Copy, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { staffApi, staffAuthApi } from '../api.js';
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
      const r = await staffApi.invite(localStorage.getItem('ws_tenant_id'), {
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
      await staffAuthApi.claimOwner(localStorage.getItem('ws_tenant_id'), {
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

function AdminRow({ admin, isSelf, onChanged }) {
  const [busy, setBusy] = useState(false);
  const meta = ROLE_META[admin.role] || ROLE_META.STAFF;

  const changeRole = async (role) => {
    setBusy(true);
    try {
      const r = await staffApi.update(localStorage.getItem('ws_tenant_id'), admin._id, { role });
      onChanged(r.data.admin);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const toggleStatus = async () => {
    setBusy(true);
    try {
      const r = await staffApi.update(localStorage.getItem('ws_tenant_id'), admin._id, {
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
      await staffApi.remove(localStorage.getItem('ws_tenant_id'), admin._id);
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
          disabled={busy || isSelf}
          onChange={e => changeRole(e.target.value)}
          title={isSelf ? "You can't change your own role" : 'Change role'}
          style={{
            padding: '6px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border)',
            background: 'var(--bg-page)', fontSize: '0.78rem', fontWeight: 700, color: `var(--${meta.color === 'gray' ? 'text-muted' : meta.color})`,
          }}
        >
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="OWNER">Owner</option>
        </select>
        <Btn size="sm" variant="ghost" onClick={toggleStatus} disabled={busy || isSelf}
          title={isSelf ? "You can't disable yourself" : undefined}>
          {admin.status === 'ACTIVE' ? 'Disable' : 'Re-enable'}
        </Btn>
        <Btn size="sm" variant="ghost" onClick={remove} disabled={busy || isSelf} style={{ color: 'var(--red)' }}
          title={isSelf ? "You can't remove yourself" : 'Remove'}>
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
    staffApi.list(localStorage.getItem('ws_tenant_id'))
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
            <AdminRow key={a._id} admin={a} isSelf={adminSession?._id === a._id} onChanged={handleChanged} />
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
