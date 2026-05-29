/**
 * FAQPage — FAQ / Auto-reply management
 *
 * Backend: GET/POST/PATCH/DELETE /dashboard/:tenantId/faqs
 * Response key: { faq: [...], count }  ← singular "faq" not "faqs"
 */
import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Pencil, Trash2, MessageSquare, Zap } from 'lucide-react';
import { faqs as faqsApi } from '../services/api';
import {
  PageHeader, Card, Button, Field, EmptyState, Spinner, Modal, Badge, ConfirmModal
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const BLANK = { trigger: '', reply: '' };

export default function FAQPage() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, trigger: '', loading: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await faqsApi.list();
      setItems(res.data?.faq || res.data?.faqs || []);
    } catch { toast.error('Failed to load FAQs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const closeModal = () => { setModal(false); setEditing(null); setForm(BLANK); };
  const openNew = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ trigger: item.trigger, reply: item.reply });
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.trigger.trim()) { toast.error('Trigger phrase is required'); return; }
    if (!form.reply.trim())   { toast.error('Reply message is required');  return; }
    setSaving(true);
    try {
      if (editing) {
        await faqsApi.update(editing._id, form);
        toast.success('FAQ updated ✅');
      } else {
        await faqsApi.create(form);
        toast.success('FAQ added ✅');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = (id, trigger) => {
    setDeleteConfirm({ open: true, id, trigger, loading: false });
  };

  const removeConfirmed = async () => {
    setDeleteConfirm(s => ({ ...s, loading: true }));
    try {
      await faqsApi.delete(deleteConfirm.id);
      toast.success('FAQ removed');
      setDeleteConfirm({ open: false, id: null, trigger: '', loading: false });
      load();
    } catch {
      toast.error('Failed to remove');
      setDeleteConfirm(s => ({ ...s, loading: false }));
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="FAQ / Auto-replies"
        subtitle="Keyword triggers that the bot replies to instantly — bypassing the AI"
        action={<Button onClick={openNew}><Plus size={15} /> Add FAQ</Button>}
      />

      {/* Info banner */}
      <Card style={{ marginBottom: 24, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.2)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Zap size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.87rem', color: 'var(--blue)', lineHeight: 1.6 }}>
            <strong>How FAQs work:</strong> When a customer message matches a trigger phrase exactly (case-insensitive),
            the bot replies immediately with your configured reply — no AI or flow processing happens.
            Use this for common questions like "opening hours", "location", "price list", etc.
          </div>
        </div>
      </Card>

      {loading ? <Spinner /> : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={HelpCircle}
            title="No FAQs configured"
            body="Add trigger phrases and replies to handle common customer questions automatically"
            action={<Button onClick={openNew}><Plus size={15} /> Add First FAQ</Button>}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, idx) => (
            <Card key={item._id} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Index badge */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>{idx + 1}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Trigger */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <Badge label="Trigger" color="blue" />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', background: 'var(--bg-overlay)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                      {item.trigger}
                    </div>
                  </div>

                  {/* Reply */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                      <Badge label="Reply" color="green" />
                    </div>
                    <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(37,162,68,0.2)', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxWidth: 560, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '8px solid rgba(37,162,68,0.2)', borderLeft: '8px solid transparent' }} />
                      {item.reply}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(item)}
                    title="Edit"
                    style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', padding: '7px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(item._id, item.trigger)}
                    title="Delete"
                    style={{ background: 'var(--red-dim)', color: 'var(--red)', padding: '7px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid rgba(229,62,62,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit FAQ' : 'Add FAQ'} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field
            label="Trigger phrase"
            required
            hint='The exact phrase (case-insensitive) a customer must send. E.g. "opening hours", "where are you", "price list"'
          >
            <input
              value={form.trigger}
              onChange={e => set('trigger', e.target.value)}
              placeholder="opening hours"
            />
          </Field>

          <Field
            label="Bot reply"
            required
            hint="What the bot sends back when the trigger matches. Emoji are supported."
          >
            <textarea
              value={form.reply}
              onChange={e => set('reply', e.target.value)}
              placeholder="🕐 We're open Monday–Saturday, 9am–9pm. Closed Sundays."
              style={{ minHeight: 100 }}
            />
          </Field>

          {/* Live preview */}
          {form.reply && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Preview</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={14} color="#fff" />
                </div>
                <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(37,162,68,0.2)', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: '0.87rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', flex: 1 }}>
                  {form.reply}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button style={{ flex: 1 }} loading={saving} onClick={save}>
              {editing ? 'Save Changes' : 'Add FAQ'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal — must be inside the root return element */}
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, trigger: '', loading: false })}
        onConfirm={removeConfirmed}
        loading={deleteConfirm.loading}
        title="Remove FAQ"
        message={`Remove FAQ for "${deleteConfirm.trigger}"? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
