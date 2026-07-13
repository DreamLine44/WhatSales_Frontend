import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { faqsApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// FAQs use the dedicated /dashboard/:tenantId/faqs CRUD endpoints.
// Each operation is atomic — no full-array replacement needed.
// GET    /faqs           → { faq, count }
// POST   /faqs           → 201 { faq }   body: { trigger: string, reply: string }
// PATCH  /faqs/:faqId    → { faq }
// DELETE /faqs/:faqId    → { ok: true }

function FaqRow({ faq, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [trigger, setTrigger]   = useState(faq.trigger);
  const [reply, setReply]       = useState(faq.reply);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!trigger.trim() || !reply.trim()) return;
    setSaving(true);
    try {
      const r = await faqsApi.update(faq._id, {
        trigger: trigger.trim(),
        reply:   reply.trim(),
      });
      // Response: { faq: [...] } — find the updated item
      const newList = r.data?.faq || null;
      const updated = newList?.find(f => f._id === faq._id) || { ...faq, trigger: trigger.trim(), reply: reply.trim() };
      onUpdate(newList, updated);
      setEditing(false);
      toast.success('Auto-reply updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await faqsApi.remove(faq._id);
      onDelete(faq._id);
      toast.success('Auto-reply deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input label="Trigger keyword / phrase" value={trigger}
            onChange={e => setTrigger(e.target.value)} placeholder="e.g. hours, location, price" />
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Reply message</label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: '0.875rem',
                fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14 }}>
          <HelpCircle size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{faq.trigger}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{faq.reply}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)} title="Edit"><Pencil size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }} title="Delete">
              <Trash2 size={13} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AutoRepliesPage() {
  const [faqs, setFaqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [form, setForm] = useState({ trigger: '', reply: '' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    faqsApi.list()
      .then(r => setFaqs(r.data?.faq || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (newList, updatedItem) => {
    if (newList) {
      setFaqs(newList);
    } else {
      setFaqs(prev => prev.map(f => f._id === updatedItem._id ? updatedItem : f));
    }
  };

  const handleDelete = (deletedId) => {
    setFaqs(prev => prev.filter(f => f._id !== deletedId));
  };

  const add = async () => {
    if (!form.trigger.trim() || !form.reply.trim()) {
      toast.error('Both trigger and reply are required');
      return;
    }
    setSaving(true);
    try {
      const r = await faqsApi.add({ trigger: form.trigger.trim(), reply: form.reply.trim() });
      setFaqs(r.data?.faq || faqs);
      setForm({ trigger: '', reply: '' });
      setAdding(false);
      toast.success('Auto-reply added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={HelpCircle} title="Auto-Replies" subtitle={`${faqs.length} auto-repl${faqs.length !== 1 ? 'ies' : 'y'}`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Auto-Reply</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Auto-Reply</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Trigger keyword / phrase *" value={form.trigger}
              onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))}
              placeholder="e.g. hours, price, location"
              hint="When a customer message contains this, the bot replies automatically" />
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Reply message *
              </label>
              <textarea
                value={form.reply}
                onChange={e => setForm(f => ({ ...f, reply: e.target.value }))}
                rows={4}
                placeholder="We're open Mon–Sat, 9am–6pm"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 12px', borderRadius: 'var(--r-md)',
                  border: '1.5px solid var(--border)', background: 'var(--bg-surface)',
                  color: 'var(--text-primary)', fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Add Auto-Reply</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : faqs.length === 0 ? (
        <Card>
          <EmptyState icon={HelpCircle} title="No auto-replies yet"
            description="Add keyword-triggered replies so your bot can answer common questions automatically."
            action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first auto-reply</Btn>}
          />
        </Card>
      ) : (
        <div>
          {faqs.map((f) => (
            <FaqRow key={f._id} faq={f} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
