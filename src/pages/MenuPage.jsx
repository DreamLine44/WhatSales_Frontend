import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { bizApi } from '../api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import { needsMenu } from '../api.js';
import toast from 'react-hot-toast';

function ItemRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: item.name, price: item.price, description: item.description || '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('price', form.price || 0);
      fd.append('description', form.description || '');
      await bizApi.updateMenuItem(item._id, fd);
      onUpdate({ ...item, ...form });
      setEditing(false);
      toast.success('Item updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await bizApi.deleteMenuItem(item._id);
      onDelete(item._id);
      toast.success('Item deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const toggleAvail = async () => {
    setToggling(true);
    try {
      const fd = new FormData();
      fd.append('available', !item.available);
      await bizApi.updateMenuItem(item._id, fd);
      onUpdate({ ...item, available: !item.available });
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Price (D)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
              {!item.available && <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', fontWeight: 600 }}>UNAVAILABLE</span>}
            </div>
            {item.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>{item.description}</div>}
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>D {Number(item.price).toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <button onClick={toggleAvail} disabled={toggling} title={item.available ? 'Mark unavailable' : 'Mark available'}
              style={{ color: item.available ? 'var(--primary)' : 'var(--text-ghost)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
              {item.available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }}><Trash2 size={13} /></Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [saving, setSaving] = useState(false);
  const mode = user?.businessMode || 'RESTAURANT';
  const label = ['SALON','BARBERSHOP'].includes(mode) ? 'Products' : ['RESTAURANT','BAKERY'].includes(mode) ? 'Menu Items' : 'Products';

  useEffect(() => {
    bizApi.getMenu()
      .then(r => setItems(r.data.menuItems || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('price', form.price || 0);
      fd.append('description', form.description || '');
      const r = await bizApi.addMenuItem(fd);
      setItems(r.data.menuItems || []);
      setForm({ name: '', price: '', description: '' });
      setAdding(false);
      toast.success('Item added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={UtensilsCrossed} title={label} subtitle={`${items.length} items`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Item</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Item</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jollof Rice" />
              <Input label="Price (D)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
            </div>
            <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Add Item</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={UtensilsCrossed} title={`No ${label.toLowerCase()} yet`}
          description="Add items so your bot can take orders from customers."
          action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first item</Btn>}
        /></Card>
      ) : (
        <div>{items.map(item => (
          <ItemRow key={item._id} item={item}
            onDelete={id => setItems(xs => xs.filter(x => x._id !== id))}
            onUpdate={u => setItems(xs => xs.map(x => x._id === u._id ? u : x))}
          />
        ))}</div>
      )}
    </div>
  );
}
