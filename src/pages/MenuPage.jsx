import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { menuApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Menu uses the dedicated /dashboard/:tenantId/menu CRUD endpoints.
// GET    /menu              → { menuItems, count }
// POST   /menu              → 201 { menuItems }
// PATCH  /menu/:itemId      → { menuItems }   ← edit by _id, NOT by name
// DELETE /menu/:itemId      → { ok: true }    ← delete by _id, NOT by name
// ⚠ price must be a Number, not a string
// ⚠ always use _id for update/delete — never item name

function ItemRow({ item, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [form, setForm] = useState({
    name:        item.name,
    price:       item.price,
    description: item.description || '',
    available:   item.available !== false,
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // PATCH /menu/:itemId — edit by _id (not name)
  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      const r = await menuApi.update(item._id, {
        name:        form.name.trim(),
        price:       Number(form.price) || 0,  // ⚠ must be number
        description: form.description || '',
        available:   form.available,
      });
      const newList = r.data?.menuItems || null;
      const updated = newList?.find(i => i._id === item._id) || { ...item, ...form, price: Number(form.price) || 0 };
      onUpdate(newList, updated);
      setEditing(false);
      toast.success('Item updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  // DELETE /menu/:itemId — by _id
  const del = async () => {
    setDeleting(true);
    try {
      await menuApi.remove(item._id);
      onDelete(item._id);
      toast.success('Item deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  // PATCH /menu/:itemId — toggle available
  const toggleAvail = async () => {
    setToggling(true);
    try {
      const r = await menuApi.update(item._id, { available: !item.available });
      const newList = r.data?.menuItems || null;
      const updated = newList?.find(i => i._id === item._id) || { ...item, available: !item.available };
      onUpdate(newList, updated);
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
              {!item.available && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', fontWeight: 600 }}>UNAVAILABLE</span>
              )}
              {item.tags?.length > 0 && item.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.67rem', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>{tag}</span>
              ))}
            </div>
            {item.description && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>{item.description}</div>
            )}
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
              D {Number(item.price).toFixed(2)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            <button onClick={toggleAvail} disabled={toggling}
              title={item.available ? 'Mark unavailable' : 'Mark available'}
              style={{ color: item.available ? 'var(--primary)' : 'var(--text-ghost)', display: 'flex', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}>
              {item.available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
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

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    menuApi.list()
      .then(r => setMenuItems(r.data?.menuItems || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (newList, updatedItem) => {
    if (newList) {
      setMenuItems(newList);
    } else {
      setMenuItems(prev => prev.map(i => i._id === updatedItem._id ? updatedItem : i));
    }
  };

  const handleDelete = (deletedId) => {
    setMenuItems(prev => prev.filter(i => i._id !== deletedId));
  };

  const add = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await menuApi.add({
        name:        form.name.trim(),
        price:       Number(form.price) || 0,  // ⚠ must be number
        description: form.description || '',
      });
      setMenuItems(r.data?.menuItems || menuItems);
      setForm({ name: '', price: '', description: '' });
      setAdding(false);
      toast.success('Item added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={UtensilsCrossed} title="Menu" subtitle={`${menuItems.length} item${menuItems.length !== 1 ? 's' : ''}`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Item</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Menu Item</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Item name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jollof Rice" />
              <Input label="Price (D)" type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
            </div>
            <Input label="Description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Savoury rice cooked in tomato sauce" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Add Item</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : menuItems.length === 0 ? (
        <Card>
          <EmptyState icon={UtensilsCrossed} title="No menu items yet"
            description="Add items so customers can browse and order via WhatsApp."
            action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first item</Btn>}
          />
        </Card>
      ) : (
        <div>
          {menuItems.map((item) => (
            <ItemRow key={item._id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
