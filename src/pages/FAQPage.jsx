/**
 * FAQPage — FAQ / Auto-reply management
 *
 * FAQs are exact-match trigger→reply pairs.
 * When a customer message matches a trigger, the bot replies instantly,
 * bypassing the AI entirely.
 *
 * This page also supports bulk-importing the default FAQ set for the
 * tenant's business mode via one click.
 */
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { faqs as faqsApi } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { getDefaultFlow } from '../data/defaultFlows';
import { getBizConfig } from '../utils/businessConfig';
import {
  PageHeader, Card, Button, Field, EmptyState, Spinner,
  Modal, Table, Tr, Td, Badge, ConfirmModal
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const BLANK = { trigger: '', reply: '' };

export default function FAQPage() {
  const { tenant } = useAuth();
  const businessMode = tenant?.businessMode || 'GENERIC';
  const cfg = getBizConfig(businessMode);

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, trigger: '', loading: false });
  const [importConfirm, setImportConfirm] = useState(false);

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
  const openNew    = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit   = (item) => { setEditing(item); setForm({ trigger: item.trigger, reply: item.reply }); setModal(true); };
  const set        = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.trigger.trim()) { toast.error('Trigger phrase is required'); return; }
    if (!form.reply.trim())   { toast.error('Reply message is required');  return; }
    setSaving(true);
    try {
      if (editing) {
        await faqsApi.update(editing._id, form);
        toast.success('FAQ updated');
      } else {
        await faqsApi.create(form);
        toast.success('FAQ added');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const remove = (id, trigger) => setDeleteConfirm({ open: true, id, trigger, loading: false });
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

  // Bulk import default FAQs — skips any triggers already in the list
  const importDefaults = async () => {
    setImportConfirm(false);
    setImporting(true);
    const flow = getDefaultFlow(businessMode);
    const existing = new Set(items.map(i => i.trigger.toLowerCase().trim()));
    const toAdd = flow.faqs.filter(f => !existing.has(f.trigger.toLowerCase()));

    if (toAdd.length === 0) {
      toast('All default FAQs are already in your list! ✅');
      setImporting(false);
      return;
    }

    let added = 0;
    let failed = 0;
    for (const faq of toAdd) {
      try {
        await faqsApi.create(faq);
        added++;
      } catch {
        failed++;
      }
    }

    if (added > 0) toast.success(`Added ${added} default FAQ${added > 1 ? 's' : ''} ✅${failed > 0 ? ` (${failed} failed)` : ''}`);
    else toast.error('Import failed — please try again');
    setImporting(false);
    load();
  };

  const flow = getDefaultFlow(businessMode);
  const existingTriggers = new Set(items.map(i => i.trigger.toLowerCase().trim()));
  const newDefaultCount = flow.faqs.filter(f => !existingTriggers.has(f.trigger.toLowerCase())).length;

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Auto-Replies (FAQs)"
        subtitle="Trigger phrases the bot instantly replies to — no AI needed"
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {newDefaultCount > 0 && (
              <Button variant="secondary" loading={importing} onClick={() => setImportConfirm(true)}>
                <Sparkles size={14} /> {cfg.faq.importLabel} ({newDefaultCount} new)
              </Button>
            )}
            <Button onClick={openNew}><Plus size={15} /> Add FAQ</Button>
          </div>
        }
      />

      {/* First-time empty state with template CTA */}
      {items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: 'var(--primary-dim)', border: '1.5px solid rgba(30,138,66,0.25)', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤖</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)', marginBottom: 8 }}>
              No auto-replies yet
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 20px' }}>
              Import <strong>{flow.faqs.length} ready-made {flow.label} replies</strong> — {cfg.faq.importHint}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button loading={importing} onClick={() => importDefaults()}>
                <Sparkles size={14} /> {cfg.faq.importLabel}
              </Button>
              <Button variant="secondary" onClick={openNew}>
                <Plus size={14} /> Add manually
              </Button>
            </div>
          </Card>

          {/* Preview of what will be imported */}
          <Card>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
              Preview — {flow.faqs.length} auto-replies included in the {flow.label} template:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {flow.faqs.map(f => (
                <span key={f.trigger} style={{
                  padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                  background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                  fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-secondary)',
                }}>
                  {f.trigger}
                </span>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Has items — show list */}
          <Card padding="0">
            <Table headers={['Trigger', 'Reply preview', 'Actions']}>
              {items.map(item => (
                <Tr key={item._id}>
                  <Td>
                    <code style={{
                      background: 'var(--bg-overlay)', padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)', fontFamily: 'monospace',
                      fontSize: '0.83rem', color: 'var(--primary)',
                      border: '1px solid var(--border)',
                    }}>
                      {item.trigger}
                    </code>
                  </Td>
                  <Td style={{ maxWidth: 280 }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.reply}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(item._id, item.trigger)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </>
      )}

      {/* Add / Edit modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Auto-Reply' : 'Add Auto-Reply'} width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field
            label="Trigger phrase"
            required
            hint="When a customer sends this exact word or phrase, the bot replies instantly. E.g: 'menu', 'price', 'hi', 'location'"
          >
            <input
              value={form.trigger}
              onChange={e => set('trigger', e.target.value)}
              placeholder="e.g. menu"
              style={{ fontFamily: 'monospace' }}
              onKeyDown={e => { if (e.key === 'Enter') save(); }}
            />
          </Field>
          <Field label="Bot reply" required hint="What the bot sends back when this trigger is matched.">
            <textarea
              value={form.reply}
              onChange={e => set('reply', e.target.value)}
              placeholder="e.g. 🍽️ Here's our menu! Type *order* to place an order..."
              style={{ minHeight: 110 }}
            />
          </Field>
          {form.reply && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Preview</div>
              <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: '0.87rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxWidth: 380 }}>
                {form.reply}
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

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, trigger: '', loading: false })}
        onConfirm={removeConfirmed}
        loading={deleteConfirm.loading}
        title="Remove Auto-Reply"
        message={`Remove the auto-reply for "${deleteConfirm.trigger}"?`}
        confirmLabel="Remove"
        variant="danger"
      />

      {/* Import confirm */}
      <ConfirmModal
        open={importConfirm}
        onClose={() => setImportConfirm(false)}
        onConfirm={importDefaults}
        loading={importing}
        title={`Import ${flow.label} Defaults`}
        message={`This will add ${newDefaultCount} default auto-repl${newDefaultCount === 1 ? 'y' : 'ies'} for a ${flow.label} business. Existing FAQs won't be changed.`}
        confirmLabel="Import"
        variant="primary"
      />
    </div>
  );
}
