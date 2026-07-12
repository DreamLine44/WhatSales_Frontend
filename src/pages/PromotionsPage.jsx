import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Pencil, Check, X, Percent, Coins, Calendar, Users2 } from 'lucide-react';
import { promotionsApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Select, Toggle, Badge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ─────────────────────────────────────────────────────────────
// Full promo-code CRUD existed server-side (dashboardController.js [PROMO-1])
// with zero frontend surface — no page, no nav link, nothing in api.js. This
// is a config-only feature: the bot never writes here, a promo is only ever
// resolved and applied inside orderService.saveOrder() when a customer's
// order carries a code. usedCount is server-managed — this page only ever
// displays it, never sends it.

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function isExpired(d) { return d && new Date(d) < new Date(); }

// yyyy-mm-dd for <input type="date"> ⇄ ISO string round-trip
function toDateInput(iso) { return iso ? new Date(iso).toISOString().slice(0, 10) : ''; }

function PromoForm({ initial, onCancel, onSubmit, submitting }) {
  const [form, setForm] = useState({
    code:          initial?.code || '',
    type:          initial?.type || 'PERCENT',
    value:         initial?.value ?? '',
    minOrderValue: initial?.minOrderValue ?? '',
    maxUses:       initial?.maxUses ?? '',
    expiresAt:     toDateInput(initial?.expiresAt),
    description:   initial?.description || '',
    active:        initial?.active !== false,
  });

  const submit = () => {
    if (!form.code.trim()) { toast.error('Code is required'); return; }
    const value = Number(form.value);
    if (Number.isNaN(value) || value < 0) { toast.error('Value must be a non-negative number'); return; }
    if (form.type === 'PERCENT' && value > 100) { toast.error('Percent value cannot exceed 100'); return; }
    onSubmit({
      code:          form.code.trim().toUpperCase(),
      type:          form.type,
      value,
      minOrderValue: form.minOrderValue === '' ? 0 : Number(form.minOrderValue),
      maxUses:       form.maxUses === '' ? null : Number(form.maxUses),
      expiresAt:     form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      description:   form.description,
      active:        form.active,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Input label="Code *" value={form.code} placeholder="WELCOME10"
          onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          style={{ textTransform: 'uppercase' }} disabled={!!initial} />
        <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed amount off</option>
        </Select>
        <Input label={form.type === 'PERCENT' ? 'Value (%)' : 'Value (D)'} type="number" min={0} max={form.type === 'PERCENT' ? 100 : undefined}
          value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'PERCENT' ? '10' : '50'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Input label="Min. order value" type="number" min={0} value={form.minOrderValue}
          onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} placeholder="0" />
        <Input label="Max uses" type="number" min={1} value={form.maxUses}
          onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
        <Input label="Expires" type="date" value={form.expiresAt}
          onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
      </div>
      <Input label="Description (optional)" value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. New customer welcome offer" />
      <Toggle checked={form.active} onChange={v => setForm(f => ({ ...f, active: v }))} label="Active" hint="Inactive codes are rejected at checkout" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" onClick={submit} loading={submitting}><Check size={13} /> {initial ? 'Save' : 'Create Code'}</Btn>
        <Btn size="sm" variant="ghost" onClick={onCancel}><X size={13} /> Cancel</Btn>
      </div>
    </div>
  );
}

function PromoCard({ promo, onUpdated, onDeleted }) {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const save = async (body) => {
    setSaving(true);
    try {
      const r = await promotionsApi.update(promo._id, body);
      const updated = (r.data?.promotions || []).find(p => p._id === promo._id);
      onUpdated(r.data?.promotions || null, updated);
      setEditing(false);
      toast.success('Promotion updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async () => {
    setToggling(true);
    try {
      const r = await promotionsApi.update(promo._id, { active: !promo.active });
      onUpdated(r.data?.promotions || null, { ...promo, active: !promo.active });
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  const remove = async () => {
    if (!confirm(`Delete promo code "${promo.code}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await promotionsApi.remove(promo._id);
      onDeleted(promo._id);
      toast.success('Promotion deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const expired = isExpired(promo.expiresAt);
  const usageLimited = promo.maxUses != null;
  const usedUp = usageLimited && promo.usedCount >= promo.maxUses;

  if (editing) {
    return (
      <Card style={{ marginBottom: 10, borderColor: 'var(--border-accent)' }}>
        <PromoForm initial={promo} submitting={saving} onCancel={() => setEditing(false)} onSubmit={save} />
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 10, opacity: (!promo.active || expired || usedUp) ? 0.65 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-bubble)', flexShrink: 0,
          background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--border-accent)',
        }}>
          {promo.type === 'PERCENT' ? <Percent size={16} color="var(--primary)" /> : <Coins size={16} color="var(--primary)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}>{promo.code}</span>
            <Badge color={promo.active ? 'green' : 'gray'}>{promo.active ? 'Active' : 'Inactive'}</Badge>
            {expired && <Badge color="red">Expired</Badge>}
            {usedUp && <Badge color="amber">Limit reached</Badge>}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {promo.type === 'PERCENT' ? `${promo.value}% off` : `D${promo.value} off`}
            {promo.minOrderValue > 0 ? ` orders over D${promo.minOrderValue}` : ' any order'}
          </div>
          {promo.description && (
            <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)', marginBottom: 6 }}>{promo.description}</div>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--text-ghost)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users2 size={11} /> {promo.usedCount || 0}{usageLimited ? ` / ${promo.maxUses}` : ''} used
            </span>
            {promo.expiresAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} /> {expired ? 'Expired' : 'Expires'} {fmtDate(promo.expiresAt)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
          <Toggle checked={promo.active} onChange={toggleActive} disabled={toggling} />
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
          <Btn variant="ghost" size="sm" onClick={remove} loading={deleting}><Trash2 size={13} color="var(--red)" /></Btn>
        </div>
      </div>
    </Card>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [adding, setAdding]         = useState(false);
  const [saving, setSaving]         = useState(false);

  const load = () => {
    setLoading(true);
    promotionsApi.list()
      .then(r => setPromotions(r.data?.promotions || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const create = async (body) => {
    setSaving(true);
    try {
      const r = await promotionsApi.add(body);
      setPromotions(r.data?.promotions || []);
      setAdding(false);
      toast.success('Promo code created');
    } catch (err) {
      // Duplicate-code 409, invalid type/value 400 — surfaced verbatim
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = promotions.filter(p => p.active && !isExpired(p.expiresAt)).length;

  return (
    <div className="fade-in">
      <PageHeader
        icon={Tag}
        title="Promotions"
        subtitle={`${promotions.length} code${promotions.length !== 1 ? 's' : ''} · ${activeCount} currently active`}
        actions={!adding && <Btn size="sm" onClick={() => setAdding(true)}><Plus size={14} /> New Code</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Promo Code</h3>
          <PromoForm submitting={saving} onCancel={() => setAdding(false)} onSubmit={create} />
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : promotions.length === 0 ? (
        <Card>
          <EmptyState icon={Tag} title="No promo codes yet"
            description="Create a discount code — customers can apply it during checkout on WhatsApp."
            action={!adding ? <Btn onClick={() => setAdding(true)}><Plus size={14} /> New Code</Btn> : undefined} />
        </Card>
      ) : (
        <div className="stagger">
          {promotions.map(p => (
            <PromoCard
              key={p._id}
              promo={p}
              onUpdated={(list, updated) => setPromotions(prev => list || prev.map(x => x._id === updated?._id ? updated : x))}
              onDeleted={id => setPromotions(prev => prev.filter(x => x._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
