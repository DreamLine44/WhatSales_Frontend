import { useEffect, useState } from 'react';
import { UtensilsCrossed, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Image as ImageIcon, Upload } from 'lucide-react';
import { menuApi, bizApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Menu uses the dedicated /dashboard/:tenantId/menu CRUD endpoints.
// GET    /menu              → { menuItems, count }
// POST   /menu              → 201 { menuItems }
// PATCH  /menu/:itemId      → { menuItems }   ← edit by _id, NOT by name
// DELETE /menu/:itemId      → { ok: true }    ← delete by _id, NOT by name
// ⚠ price must be a Number, not a string
// ⚠ always use _id for update/delete — never item name

function ItemRow({ item, onUpdate, onDelete, cloudinaryEnabled }) {
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
  const [uploading, setUploading] = useState(false);

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

  // POST /menu/:itemId/image — multipart image upload
  const uploadImage = async (file) => {
    if (!file) return;
    if (!cloudinaryEnabled) {
      toast.error('Image uploads aren\'t enabled for this platform yet. Ask your administrator to configure image storage.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await menuApi.uploadImage(item._id, fd);
      const newList = r.data?.menuItems || null;
      const updated = newList?.find(i => i._id === item._id) || { ...item, image: r.data?.image };
      onUpdate(newList, updated);
      toast.success('Image uploaded');
    } catch (err) {
      // 503 = Cloudinary not configured on this environment — a graceful, human message
      const msg = err.message?.toLowerCase().includes('cloudinary') || err.message?.includes('503')
        ? 'Image uploads aren\'t set up for this business yet.'
        : err.message;
      toast.error(msg);
    } finally { setUploading(false); }
  };

  const removeImage = async () => {
    setUploading(true);
    try {
      await menuApi.removeImage(item._id);
      onUpdate(null, { ...item, image: null });
      toast.success('Image removed');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
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
          {/* Image thumbnail / upload control */}
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <label
              title={cloudinaryEnabled ? (item.image ? 'Change image' : 'Add image') : 'Image uploads not enabled'}
              style={{
                width: 52, height: 52, borderRadius: 'var(--r-md)', overflow: 'hidden',
                border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'var(--bg-overlay)',
                cursor: cloudinaryEnabled ? 'pointer' : 'not-allowed', flexShrink: 0,
              }}
            >
              {uploading ? (
                <Spinner size={16} />
              ) : item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                cloudinaryEnabled ? <Upload size={16} color="var(--text-ghost)" /> : <ImageIcon size={16} color="var(--text-ghost)" />
              )}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                disabled={!cloudinaryEnabled || uploading}
                onChange={e => uploadImage(e.target.files?.[0])}
              />
            </label>
            {item.image && cloudinaryEnabled && (
              <button onClick={removeImage} disabled={uploading} title="Remove image"
                style={{
                  position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff', border: '2px solid var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
                }}>
                <X size={10} />
              </button>
            )}
          </div>
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
  // [FIX-MENU-IMAGES] Check whether image storage is configured on this
  // environment before offering an upload control — avoids a confusing
  // "upload failed" the first time someone tries, per Appendix C spec.
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);

  useEffect(() => {
    menuApi.list()
      .then(r => setMenuItems(r.data?.menuItems || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
    bizApi.cloudinaryStatus()
      .then(r => setCloudinaryEnabled(!!r.data?.cloudinaryEnabled))
      .catch(() => setCloudinaryEnabled(false));
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

      {!loading && !cloudinaryEnabled && menuItems.length > 0 && (
        <div style={{
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)',
          borderRadius: 'var(--r-md)', padding: '9px 14px', marginBottom: 12,
          fontSize: '0.8rem', color: 'var(--amber)',
        }}>
          Photo uploads aren't turned on for this business yet — items will show as text-only to customers. Contact your administrator to enable this.
        </div>
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
            <ItemRow key={item._id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} cloudinaryEnabled={cloudinaryEnabled} />
          ))}
        </div>
      )}
    </div>
  );
}
