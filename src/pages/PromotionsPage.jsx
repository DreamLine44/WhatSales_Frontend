import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { promotionsApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Select, Toggle, Badge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Promotions / Discount Codes — /dashboard/:tenantId/promotions CRUD.
// GET    → { promotions, count }
// POST   → 201 { promotions }  body: { code, type: 'PERCENT'|'FIXED', value,
//           active?, minOrderValue?, maxUses?, expiresAt?, description? }
// PATCH  /:promoId → { promotions }  — code cannot be changed after creation
// DELETE /:promoId → { ok: true }
// usedCount is read-only, incremented server-side on redemption.

function formatValue(promo) {
  return promo.type === 'PERCENT' ? `${promo.value}% off` : `D ${promo.value} off`;
}

function PromoRow({ promo, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    type:          promo.type,
    value:         promo.value,
    active:        promo.active !== false,
    minOrderValue: promo.minOrderValue ?? '',
    maxUses:       promo.maxUses ?? '',
    expiresAt:     promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
    description:   promo.description || '',
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const save = async () => {
    if (form.type === 'PERCENT' && Number(form.value) > 100) {
      toast.error('Percent discounts cannot exceed 100%');
      return;
    }
    setSaving(true);
    try {
      const r = await promotionsApi.update(promo._id, {
        type:          form.type,
        value:         Number(form.value) || 0,
        active:        form.active,
        minOrderValue: form.minOrderValue === '' ? undefined : Number(form.minOrderValue),
        maxUses:       form.maxUses === '' ? null : Number(form.maxUses),
        expiresAt:     form.expiresAt || undefined,
        description:   form.description || undefined,
      });
      const newList = r.data?.promotions || null;
      onUpdate(newList, newList?.find(p => p._id === promo._id));
      setEditing(false);
      toast.success('Promotion updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // Quick active/inactive toggle without opening the full edit form
  const quickToggleActive = async () => {
    setToggling(true);
    try {
      const r = await promotionsApi.update(promo._id, { active: !promo.active });
      const newList = r.data?.promotions || null;
      onUpdate(newList, newList?.find(p => p._id === promo._id));
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await promotionsApi.remove(promo._id);
      onDelete(promo._id);
      toast.success('Promotion deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const isExpired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
  const usesUp = promo.maxUses != null && promo.usedCount >= promo.maxUses;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="PERCENT">Percent off</option>
              <option value="FIXED">Fixed amount off</option>
            </Select>
            <Input label={form.type === 'PERCENT' ? 'Percent (0-100)' : 'Amount (D)'} type="number"
              value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Min order value (optional)" type="number" value={form.minOrderValue}
              onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} placeholder="No minimum" />
            <Input label="Max uses (optional)" type="number" value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
          </div>
          <Input label="Expires (optional)" type="date" value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          <Input label="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Launch week special" />
          <Toggle checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} label="Active" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 'var(--r-bubble)', flexShrink: 0,
            background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Tag size={16} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{promo.code}</span>
              <Badge color="green">{formatValue(promo)}</Badge>
              {!promo.active && <Badge color="gray">Inactive</Badge>}
              {isExpired && <Badge color="red">Expired</Badge>}
              {usesUp && <Badge color="amber">Uses exhausted</Badge>}
            </div>
            {promo.description && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>{promo.description}</div>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-ghost)' }}>
              <span>{promo.usedCount || 0} used{promo.maxUses != null ? ` / ${promo.maxUses}` : ''}</span>
              {promo.minOrderValue != null && <span>Min order D {promo.minOrderValue}</span>}
              {promo.expiresAt && <span>Expires {new Date(promo.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <Toggle checked={promo.active !== false} onChange={quickToggleActive} disabled={toggling} />
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }}>
              <Trash2 size={13} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(false);
  const [form, setForm] = useState({ code: '', type: 'PERCENT', value: '', minOrderValue: '', maxUses: '', expiresAt: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    promotionsApi.list()
      .then(r => setPromotions(r.data?.promotions || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (newList, updatedItem) => {
    if (newList) {
      setPromotions(newList);
    } else if (updatedItem) {
      setPromotions(prev => prev.map(p => p._id === updatedItem._id ? updatedItem : p));
    }
  };

  const handleDelete = (deletedId) => {
    setPromotions(prev => prev.filter(p => p._id !== deletedId));
  };

  const add = async () => {
    if (!form.code.trim()) { toast.error('A code is required'); return; }
    if (!form.value) { toast.error('A discount value is required'); return; }
    if (form.type === 'PERCENT' && Number(form.value) > 100) { toast.error('Percent discounts cannot exceed 100%'); return; }
    setSaving(true);
    try {
      // Code is auto-uppercased and must be unique per tenant server-side (409 if duplicate)
      const r = await promotionsApi.add({
        code:          form.code.trim(),
        type:          form.type,
        value:         Number(form.value),
        minOrderValue: form.minOrderValue === '' ? undefined : Number(form.minOrderValue),
        maxUses:       form.maxUses === '' ? undefined : Number(form.maxUses),
        expiresAt:     form.expiresAt || undefined,
        description:   form.description || undefined,
      });
      setPromotions(r.data?.promotions || promotions);
      setForm({ code: '', type: 'PERCENT', value: '', minOrderValue: '', maxUses: '', expiresAt: '', description: '' });
      setAdding(false);
      toast.success('Promotion created');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={Tag} title="Promotions" subtitle={`${promotions.length} discount code${promotions.length !== 1 ? 's' : ''}`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Code</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Discount Code</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Code *" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="LAUNCH20" hint="Auto-uppercased — must be unique" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="PERCENT">Percent off</option>
                <option value="FIXED">Fixed amount off</option>
              </Select>
              <Input label={form.type === 'PERCENT' ? 'Percent (0-100) *' : 'Amount (D) *'} type="number"
                value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'PERCENT' ? '20' : '50'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Min order value (optional)" type="number" value={form.minOrderValue}
                onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} placeholder="No minimum" />
              <Input label="Max uses (optional)" type="number" value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
            </div>
            <Input label="Expires (optional)" type="date" value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            <Input label="Description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Launch week special" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Create Code</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : promotions.length === 0 ? (
        <Card>
          <EmptyState icon={Tag} title="No discount codes yet"
            description="Create a promo code your bot can apply automatically when customers mention it during checkout."
            action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first code</Btn>}
          />
        </Card>
      ) : (
        <div>
          {promotions.map((p) => (
            <PromoRow key={p._id} promo={p} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
