import { useEffect, useState } from 'react';
import { Bell, Send, Inbox, ArrowUpRight, Check, MessageSquarePlus } from 'lucide-react';
import { notificationsApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Select, Textarea, Badge, Tabs, Pagination, Modal } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ─────────────────────────────────────────────────────────────
// Backend has a full two-way admin↔tenant messaging system (adminRoutes.js
// [ADMIN-NOTIFY-1]) — a tenant can message platform support, the platform can
// message/broadcast to tenants, with severity + read state + WhatsApp ping on
// the platform→tenant side — with no frontend surface at all before this page.
// GET /admin/notifications (tenant key, no ?direction) returns BOTH directions
// scoped to this tenant, so one call drives both the Inbox and Sent tabs.

const SEVERITY_META = {
  info:    { color: 'blue',  label: 'Info' },
  warning: { color: 'amber', label: 'Warning' },
  urgent:  { color: 'red',   label: 'Urgent' },
};

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function MessageCard({ n, onMarkRead }) {
  const received = n.direction === 'TO_TENANT';
  const [marking, setMarking] = useState(false);

  const markRead = async () => {
    setMarking(true);
    try {
      await notificationsApi.markRead(n._id);
      onMarkRead(n._id);
    } catch (err) { toast.error(err.message); }
    finally { setMarking(false); }
  };

  return (
    <Card style={{ marginBottom: 10, borderColor: (received && !n.read) ? 'var(--border-accent)' : 'var(--border)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {received
            ? <Inbox size={16} color={!n.read ? 'var(--primary)' : 'var(--text-muted)'} />
            : <ArrowUpRight size={16} color="var(--text-muted)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{n.subject}</span>
            <Badge color={SEVERITY_META[n.severity]?.color || 'gray'}>{SEVERITY_META[n.severity]?.label || n.severity}</Badge>
            {received && !n.read && <Badge color="green" dot>New</Badge>}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.55, marginBottom: 6 }}>
            {n.body}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-ghost)' }}>
            {received ? `From ${n.fromLabel || 'Platform Team'}` : 'Sent by you'} · {fmtDate(n.createdAt)}
          </div>
        </div>
        {received && !n.read && (
          <Btn variant="ghost" size="sm" onClick={markRead} loading={marking} style={{ flexShrink: 0 }}>
            <Check size={13} /> Mark read
          </Btn>
        )}
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const [tab, setTab]           = useState('inbox'); // inbox | sent
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm]         = useState({ subject: '', body: '', severity: 'info' });
  const [sending, setSending]   = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const r = await notificationsApi.list({ page: p, limit: 20 });
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

  const filtered = items.filter(n => tab === 'inbox' ? n.direction === 'TO_TENANT' : n.direction === 'TO_ADMIN');

  const send = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Subject and message are both required');
      return;
    }
    setSending(true);
    try {
      await notificationsApi.send({
        subject:  form.subject.trim(),
        body:     form.body.trim(),
        severity: form.severity,
      });
      toast.success('Message sent to support');
      setForm({ subject: '', body: '', severity: 'info' });
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
        subtitle={unreadCount > 0 ? `${unreadCount} unread from support` : 'Talk to WhatSales support'}
        actions={<Btn size="sm" onClick={() => setComposeOpen(true)}><MessageSquarePlus size={14} /> New Message</Btn>}
      />

      <Tabs
        tabs={[
          { value: 'inbox', label: `Inbox${unreadCount ? ` (${unreadCount})` : ''}` },
          { value: 'sent',  label: 'Sent' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={tab === 'inbox' ? Inbox : Send}
              title={tab === 'inbox' ? 'No messages yet' : "You haven't sent anything yet"}
              description={tab === 'inbox'
                ? 'Announcements and replies from WhatSales support will show up here.'
                : 'Questions or issues you send to support will show up here.'}
              action={tab === 'sent' ? <Btn onClick={() => setComposeOpen(true)}><MessageSquarePlus size={14} /> Message Support</Btn> : undefined}
            />
          </Card>
        ) : (
          <>
            {filtered.map(n => <MessageCard key={n._id} n={n} onMarkRead={handleMarkRead} />)}
            <Pagination page={page} total={pages * 20} limit={20} onChange={fn => setPage(fn)} />
          </>
        )}
      </div>

      {composeOpen && (
        <Modal title="Message Support" onClose={() => setComposeOpen(false)} maxWidth={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Subject"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Question about my catalog sync"
            />
            <Textarea
              label="Message"
              rows={5}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Describe what you need help with…"
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
