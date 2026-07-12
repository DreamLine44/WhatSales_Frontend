import { useEffect, useState } from 'react';
import { Bell, Send, Inbox, Radio, Check, MessageSquarePlus } from 'lucide-react';
import { adminApi, adminNotificationsApi } from '../../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Select, Textarea, Badge, Tabs, Pagination, Modal, InfoBanner } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ─────────────────────────────────────────────────────────────
// Mirrors the tenant-side NotificationsPage but for the super admin: read
// TO_ADMIN messages from any tenant (the "support inbox"), and send/broadcast
// TO_TENANT announcements. Uses adminHttp (SUPER_ADMIN_API_KEY) via
// adminNotificationsApi — same /admin/notifications endpoints, but
// unrestricted by tenantId server-side since req.isSuperAdmin is true.

const SEVERITY_META = {
  info:    { color: 'blue',  label: 'Info' },
  warning: { color: 'amber', label: 'Warning' },
  urgent:  { color: 'red',   label: 'Urgent' },
};

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MessageCard({ n, tenantName, onMarkRead }) {
  const [marking, setMarking] = useState(false);
  const isInbox = n.direction === 'TO_ADMIN';

  const markRead = async () => {
    setMarking(true);
    try {
      await adminNotificationsApi.markRead(n._id);
      onMarkRead(n._id);
    } catch (err) { toast.error(err.message); }
    finally { setMarking(false); }
  };

  return (
    <Card style={{ marginBottom: 10, borderColor: (isInbox && !n.read) ? 'var(--border-accent)' : 'var(--border)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {isInbox
            ? <Inbox size={16} color={!n.read ? 'var(--primary)' : 'var(--text-muted)'} />
            : n.broadcastId ? <Radio size={16} color="var(--text-muted)" /> : <Send size={16} color="var(--text-muted)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{n.subject}</span>
            <Badge color={SEVERITY_META[n.severity]?.color || 'gray'}>{SEVERITY_META[n.severity]?.label || n.severity}</Badge>
            {n.broadcastId && <Badge color="purple">Broadcast</Badge>}
            {isInbox && !n.read && <Badge color="green" dot>New</Badge>}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.55, marginBottom: 6 }}>
            {n.body}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-ghost)' }}>
            {isInbox ? `From ${n.fromLabel || 'Tenant admin'}` : `To ${tenantName || n.tenantId}`}
            {' · '}{fmtDate(n.createdAt)}
          </div>
        </div>
        {isInbox && !n.read && (
          <Btn variant="ghost" size="sm" onClick={markRead} loading={marking} style={{ flexShrink: 0 }}>
            <Check size={13} /> Mark read
          </Btn>
        )}
      </div>
    </Card>
  );
}

export default function AdminMessagesPage() {
  const [tab, setTab]         = useState('inbox'); // inbox | sent
  const [items, setItems]     = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', severity: 'info', target: 'BROADCAST' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    adminApi.listTenants()
      .then(r => setTenants(r.data?.tenants || r.data || []))
      .catch(() => {});
  }, []);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const r = await adminNotificationsApi.list({
        page: p, limit: 20,
        direction: tab === 'inbox' ? 'TO_ADMIN' : 'TO_TENANT',
      });
      setItems(r.data?.notifications || []);
      setPages(r.data?.pages || 1);
      setUnreadCount(r.data?.unreadCount || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(1); setPage(1); }, [tab]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(page); }, [page]);

  const tenantName = (id) => tenants.find(t => String(t._id) === String(id))?.name;

  const send = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Subject and message are both required');
      return;
    }
    if (form.target !== 'BROADCAST' && !form.target) {
      toast.error('Choose a tenant to message, or select Broadcast to all');
      return;
    }
    setSending(true);
    try {
      const body = {
        subject:  form.subject.trim(),
        body:     form.body.trim(),
        severity: form.severity,
        ...(form.target === 'BROADCAST' ? { broadcast: true } : { tenantId: form.target }),
      };
      const r = await adminNotificationsApi.send(body);
      toast.success(form.target === 'BROADCAST'
        ? `Broadcast sent to ${r.data?.sentTo || 0} tenant(s)`
        : 'Message sent');
      setForm({ subject: '', body: '', severity: 'info', target: 'BROADCAST' });
      setComposeOpen(false);
      setTab('sent');
      load(1); setPage(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = (id) => {
    setItems(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <div className="fade-in">
      <PageHeader
        icon={Bell}
        title="Messages"
        subtitle={unreadCount > 0 ? `${unreadCount} unread from tenants` : 'Support inbox & tenant announcements'}
        actions={<Btn size="sm" onClick={() => setComposeOpen(true)}><MessageSquarePlus size={14} /> New Message</Btn>}
      />

      <Tabs
        tabs={[
          { value: 'inbox', label: `Inbox${unreadCount ? ` (${unreadCount})` : ''}` },
          { value: 'sent',  label: 'Sent / Broadcasts' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon={tab === 'inbox' ? Inbox : Send}
              title={tab === 'inbox' ? 'No tenant messages yet' : "You haven't sent anything yet"}
              description={tab === 'inbox'
                ? 'Support requests and questions from tenants will show up here.'
                : 'Announcements and direct messages you send to tenants will show up here.'}
              action={tab === 'sent' ? <Btn onClick={() => setComposeOpen(true)}><MessageSquarePlus size={14} /> Send a message</Btn> : undefined}
            />
          </Card>
        ) : (
          <>
            {items.map(n => <MessageCard key={n._id} n={n} tenantName={tenantName(n.tenantId)} onMarkRead={handleMarkRead} />)}
            <Pagination page={page} total={pages * 20} limit={20} onChange={fn => setPage(fn)} />
          </>
        )}
      </div>

      {composeOpen && (
        <Modal title="Message Tenants" onClose={() => setComposeOpen(false)} maxWidth={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Select
              label="Send to"
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
            >
              <option value="BROADCAST">📢 Broadcast to all active tenants</option>
              {tenants.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
            {form.target === 'BROADCAST' && (
              <InfoBanner type="warning">This will message every non-suspended tenant on the platform.</InfoBanner>
            )}
            <Input
              label="Subject"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Scheduled maintenance tonight"
            />
            <Textarea
              label="Message"
              rows={5}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Write your announcement…"
            />
            <Select
              label="Priority"
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="info">Normal</option>
              <option value="warning">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Btn>
              <Btn onClick={send} loading={sending}><Send size={14} /> Send</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
