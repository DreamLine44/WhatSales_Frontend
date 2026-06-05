import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Textarea } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Per the spec, FAQs live inside the business config document.
// They are read via GET /business/:id and written via PUT /business/:id { faq: [...] }.
// There are no separate /faqs CRUD endpoints in the spec.
// Each faq item: { trigger: string, reply: string }
// The _id field (if present) is ignored by the backend — the whole faq array is replaced.

function FaqRow({ faq, allFaqs, onFaqsUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [trigger, setTrigger]   = useState(faq.trigger);
  const [reply, setReply]       = useState(faq.reply);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!trigger.trim() || !reply.trim()) return;
    setSaving(true);
    try {
      // Update this item's trigger/reply in the array, then PUT the whole faq array
      const updated = allFaqs.map(f =>
        (f === faq || f._id === faq._id)
          ? { trigger: trigger.trim(), reply: reply.trim() }
          : { trigger: f.trigger, reply: f.reply }
      );
      const r = await bizApi.update({ faq: updated });
      const saved = r.data?.business?.faq || r.data?.faq || updated;
      onFaqsUpdate(saved);
      setEditing(false);
      toast.success('Auto-reply updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      // Remove this item, then PUT the remaining faq array
      const updated = allFaqs
        .filter(f => f !== faq && f._id !== faq._id)
        .map(f => ({ trigger: f.trigger, reply: f.reply }));
      const r = await bizApi.update({ faq: updated });
      const saved = r.data?.business?.faq || r.data?.faq || updated;
      onFaqsUpdate(saved);
      toast.success('Auto-reply deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  if (editing) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-accent)', borderRadius: 'var(--r-lg)', padding: '18px', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Trigger keyword" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder='e.g. "hours", "price"' />
          <Textarea label="Reply" value={reply} onChange={e => setReply(e.target.value)} rows={3} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '16px 18px', marginBottom: 8,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-sm)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)',
            background: 'var(--primary-dim)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--r-sm)', padding: '2px 8px', marginBottom: 7,
            letterSpacing: '0.03em', fontFamily: 'var(--font-mono)',
          }}>
            "{faq.trigger}"
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{faq.reply}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }}><Trash2 size={13} /></Btn>
        </div>
      </div>
    </div>
  );
}

export default function AutoRepliesPage() {
  const [faqs, setFaqs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newReply, setNewReply]     = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    // Step 6: GET /business/:id — faq array lives inside the business document
    bizApi.get()
      .then(r => {
        const biz = r.data.business || r.data || {};
        setFaqs(biz.faq || []);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addFaq = async () => {
    if (!newTrigger.trim() || !newReply.trim()) { toast.error('Both trigger and reply are required'); return; }
    setSaving(true);
    try {
      // Append to existing faq array, then PUT /business/:id { faq: [...] }
      const updated = [
        ...faqs.map(f => ({ trigger: f.trigger, reply: f.reply })),
        { trigger: newTrigger.trim(), reply: newReply.trim() },
      ];
      const r = await bizApi.update({ faq: updated });
      const saved = r.data?.business?.faq || r.data?.faq || updated;
      setFaqs(saved);
      setNewTrigger(''); setNewReply(''); setAdding(false);
      toast.success('Auto-reply added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={HelpCircle} title="Auto Replies"
        subtitle={`${faqs.length} keyword${faqs.length !== 1 ? 's' : ''} configured`}
        actions={
          <Btn size="sm" onClick={() => setAdding(v => !v)}>
            {adding ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Reply</>}
          </Btn>
        }
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 14, letterSpacing: '-0.02em' }}>New Auto-Reply</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Trigger keyword"
              value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
              placeholder='e.g. "price", "hours", "location"'
              hint="When a customer sends this keyword, the bot replies automatically"
            />
            <Textarea
              label="Reply message"
              value={newReply} onChange={e => setNewReply(e.target.value)} rows={3}
              placeholder="We are open Mon–Sat 8am–10pm…"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={addFaq} loading={saving}><Check size={14} /> Add Reply</Btn>
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
            description="Add keyword triggers to let your bot automatically answer common questions — prices, hours, location, and more."
            action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add your first reply</Btn>}
          />
        </Card>
      ) : (
        <div className="stagger">
          {faqs.map((f, i) => (
            <FaqRow key={f._id || i} faq={f} allFaqs={faqs} onFaqsUpdate={setFaqs} />
          ))}
        </div>
      )}
    </div>
  );
}
