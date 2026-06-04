import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function FaqRow({ faq, onDelete, onUpdate }) {
  const [editing, setEditing]   = useState(false);
  const [trigger, setTrigger]   = useState(faq.trigger);
  const [reply, setReply]       = useState(faq.reply);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!trigger.trim() || !reply.trim()) return;
    setSaving(true);
    try {
      await bizApi.updateFaq(faq._id, { trigger, reply });
      onUpdate({ ...faq, trigger, reply });
      setEditing(false);
      toast.success('Auto-reply updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await bizApi.deleteFaq(faq._id);
      onDelete(faq._id);
      toast.success('Auto-reply deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  if (editing) {
    return (
      <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border-accent)', borderRadius: 'var(--r-lg)', padding: '18px', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Trigger keyword" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder='e.g. "hours", "price"' />
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Reply</label>
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
          </div>
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
    bizApi.getFaqs()
      .then(r => setFaqs(r.data.faq || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addFaq = async () => {
    if (!newTrigger.trim() || !newReply.trim()) { toast.error('Both trigger and reply are required'); return; }
    setSaving(true);
    try {
      const r = await bizApi.addFaq({ trigger: newTrigger.trim(), reply: newReply.trim() });
      setFaqs(r.data.faq || []);
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
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Reply message</label>
              <textarea value={newReply} onChange={e => setNewReply(e.target.value)} rows={3}
                placeholder="We are open Mon–Sat 8am–10pm…"
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
            </div>
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
          {faqs.map(f => (
            <FaqRow key={f._id} faq={f}
              onDelete={id => setFaqs(fs => fs.filter(x => x._id !== id))}
              onUpdate={updated => setFaqs(fs => fs.map(x => x._id === updated._id ? updated : x))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
