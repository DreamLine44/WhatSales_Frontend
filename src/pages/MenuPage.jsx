import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  UtensilsCrossed, Plus, Pencil, Trash2, ImageOff, X,
  Image as ImageIcon, Search, SlidersHorizontal, PackageCheck,
  PackageX, ArrowUpDown, Eye, EyeOff,
} from 'lucide-react';
import { menu as menuApi } from '../services/api';
import {
  PageHeader, Card, Button, Field, EmptyState, Spinner,
  Modal, Grid, Badge, SectionTitle,
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

/* ─── constants ──────────────────────────────────────────────── */
const BLANK = { name: '', description: '', price: '', category: '', available: true, stock: '' };
const SORT_OPTIONS = [
  { value: 'default',    label: 'Default order' },
  { value: 'name_asc',  label: 'Name A → Z' },
  { value: 'name_desc', label: 'Name Z → A' },
  { value: 'price_asc', label: 'Price low → high' },
  { value: 'price_desc', label: 'Price high → low' },
];

/* ─── helpers ────────────────────────────────────────────────── */
function normaliseCategory(cat) {
  return (cat || '').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Uncategorised';
}

function sortItems(items, sort) {
  const sorted = [...items];
  if (sort === 'name_asc')   return sorted.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'name_desc')  return sorted.sort((a, b) => b.name.localeCompare(a.name));
  if (sort === 'price_asc')  return sorted.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price_desc') return sorted.sort((a, b) => Number(b.price) - Number(a.price));
  return sorted;
}

/* ─── Delete Confirm Modal ───────────────────────────────────── */
function DeleteModal({ item, onConfirm, onCancel, busy }) {
  return (
    <Modal open={!!item} onClose={onCancel} title="Remove item?" width={400}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-primary)' }}>{item?.name}</strong> will be permanently
        removed from your menu and customers won't be able to order it.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button variant="danger" style={{ flex: 1 }} loading={busy} onClick={onConfirm}>Remove</Button>
      </div>
    </Modal>
  );
}

/* ─── Image Uploader (shared between new + edit) ─────────────── */
function ImageUploader({ preview, onFile, onClear, disabled }) {
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large — max 5 MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { toast.error('Use JPEG, PNG, WebP or GIF'); return; }
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = 'var(--border-strong)';
    handleFile(e.dataTransfer.files?.[0]);
  };

  if (preview) {
    return (
      <div style={{ position: 'relative', width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
        <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button
          onClick={onClear}
          disabled={disabled}
          style={{
            position: 'absolute', top: 7, right: 7,
            background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
            borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Remove image"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onDrop={onDrop}
      style={{
        border: '2px dashed var(--border-strong)', borderRadius: 10,
        padding: '26px 16px', textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        background: 'var(--bg-overlay)',
        transition: 'border-color 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <ImageIcon size={26} color="var(--text-muted)" style={{ marginBottom: 8 }} />
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        Click or drag & drop an image
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
        JPEG, PNG, WebP, GIF — max 5 MB
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

/* ─── Item Card ───────────────────────────────────────────────── */
function MenuItemCard({ item, onEdit, onDelete, onToggle }) {
  const hasImage = item.image?.url;
  const available = item.available !== false;
  const hasStock = item.stock != null && item.stock !== '';
  const stockNum = Number(item.stock);
  const lowStock = hasStock && stockNum > 0 && stockNum <= 5;
  const outOfStock = hasStock && stockNum === 0;

  return (
    <Card style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.18s, transform 0.18s', opacity: available ? 1 : 0.62 }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Image */}
      <div style={{
        width: '100%', height: 140,
        background: 'var(--bg-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {hasImage ? (
          <img src={item.image.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <UtensilsCrossed size={30} color="var(--text-muted)" />
        )}
        {!available && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0,0,0,0.5)', padding: '3px 10px', borderRadius: 99 }}>
              UNAVAILABLE
            </span>
          </div>
        )}
        {outOfStock && available && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'var(--red)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          }}>
            Out of stock
          </div>
        )}
        {lowStock && available && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'var(--amber)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          }}>
            {stockNum} left
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '13px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.94rem', flex: 1, lineHeight: 1.3 }}>
            {item.name}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', fontSize: '0.93rem' }}>
            D {Number(item.price).toLocaleString()}
          </div>
        </div>

        {item.description && (
          <div style={{
            fontSize: '0.79rem', color: 'var(--text-muted)', marginBottom: 10,
            lineHeight: 1.45, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.description}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: item.description ? 0 : 8 }}>
          <Badge
            label={available ? (outOfStock ? 'Out of Stock' : 'Available') : 'Unavailable'}
            color={available ? (outOfStock ? 'red' : 'green') : 'default'}
          />
          <div style={{ display: 'flex', gap: 2 }}>
            <IconBtn
              onClick={() => onToggle(item)}
              title={available ? 'Mark unavailable' : 'Mark available'}
              icon={available ? EyeOff : Eye}
              size={14}
            />
            <IconBtn onClick={() => onEdit(item)} title="Edit item" icon={Pencil} size={14} />
            <IconBtn onClick={() => onDelete(item)} title="Remove item" icon={Trash2} size={14} danger />
          </div>
        </div>
      </div>
    </Card>
  );
}

function IconBtn({ onClick, title, icon: Icon, size, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: danger ? 'var(--red)' : 'var(--text-muted)',
        padding: '5px 7px', borderRadius: 8,
        transition: 'background 0.12s, color 0.12s',
        display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--red-dim)' : 'var(--bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
    >
      <Icon size={size} />
    </button>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
export default function MenuPage() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Image state (works for both new + edit)
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImg, setRemoveImg]       = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Filter / sort
  const [search, setSearch]             = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [filterAvail, setFilterAvail]   = useState('');  // '' | 'available' | 'unavailable'
  const [sort, setSort]                 = useState('default');

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await menuApi.list();
      setItems(res.data?.menuItems || []);
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── derived data ── */
  const allCategories = useMemo(() => {
    const cats = [...new Set(items.map(i => normaliseCategory(i.category)))].sort();
    return cats;
  }, [items]);

  const displayed = useMemo(() => {
    let list = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        normaliseCategory(i.category).toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterCat) {
      list = list.filter(i => normaliseCategory(i.category) === filterCat);
    }

    // Availability filter
    if (filterAvail === 'available')   list = list.filter(i => i.available !== false);
    if (filterAvail === 'unavailable') list = list.filter(i => i.available === false);

    return sortItems(list, sort);
  }, [items, search, filterCat, filterAvail, sort]);

  const grouped = useMemo(() => {
    return displayed.reduce((acc, item) => {
      const cat = normaliseCategory(item.category);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [displayed]);

  /* ── modal helpers ── */
  const resetModal = () => {
    setEditing(null);
    setForm(BLANK);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImg(false);
  };

  const openNew = () => { resetModal(); setModal(true); };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name:        item.name,
      description: item.description || '',
      price:       item.price,
      category:    item.category || '',
      available:   item.available !== false,
      stock:       item.stock != null ? String(item.stock) : '',
    });
    setImageFile(null);
    setImagePreview(item.image?.url || null);
    setRemoveImg(false);
    setModal(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── save ── */
  const save = async () => {
    const name  = form.name?.trim();
    const price = Number(form.price);

    if (!name)          { toast.error('Item name is required'); return; }
    if (!form.price && form.price !== 0) { toast.error('Price is required'); return; }
    if (price < 0)      { toast.error('Price cannot be negative'); return; }

    setSaving(true);
    try {
      const body = {
        name,
        description: form.description,
        price,
        category:    normaliseCategory(form.category),
        available:   Boolean(form.available),
        ...(form.stock !== '' && { stock: Number(form.stock) }),
      };

      let savedItem;

      if (editing) {
        const res = await menuApi.update(editing._id, body);
        savedItem = (res.data?.menuItems || []).find(i => String(i._id) === String(editing._id));
        toast.success('Item updated');
      } else {
        const existingIds = new Set(items.map(i => String(i._id)));
        const res = await menuApi.create(body);
        const newItems = res.data?.menuItems || [];
        savedItem = newItems.find(i => !existingIds.has(String(i._id))) || newItems[newItems.length - 1];
        toast.success('Item added to menu');
      }

      /* Image: upload new or remove existing */
      if (!savedItem && imageFile) {
        toast.error('Item saved but could not get its ID — upload image manually by re-opening it');
      }
      if (savedItem && imageFile) {
        setUploadingImg(true);
        try {
          await menuApi.uploadImage(savedItem._id, imageFile, true);
          toast.success('Image uploaded ✅');
        } catch (imgErr) {
          if (imgErr.response?.status === 503) {
            toast.error('Image upload not configured on server — item saved without image');
          } else {
            toast.error(`Image upload failed: ${imgErr.response?.data?.error || imgErr.message}`);
          }
        } finally {
          setUploadingImg(false);
        }
      } else if (editing && removeImg && editing.image?.url) {
        try {
          await menuApi.removeImage(editing._id);
          toast.success('Image removed');
        } catch {
          toast.error('Failed to remove image');
        }
      }

      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await menuApi.delete(deleteTarget._id);
      toast.success(`"${deleteTarget.name}" removed`);
      setDeleteTarget(null);
      load();
    } catch { toast.error('Failed to remove item'); }
    finally { setDeleting(false); }
  };

  /* ── toggle availability (optimistic with rollback) ── */
  const toggleAvail = async (item) => {
    const next = !item.available;
    // Optimistic update
    setItems(prev => prev.map(i => i._id === item._id ? { ...i, available: next } : i));
    try {
      await menuApi.update(item._id, { available: next });
    } catch {
      // Rollback
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, available: item.available } : i));
      toast.error('Failed to update availability');
    }
  };

  const isBusy = saving || uploadingImg;

  /* ── stats ── */
  const totalAvail    = items.filter(i => i.available !== false).length;
  const totalUnavail  = items.length - totalAvail;

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImg(editing?.image?.url ? true : false);
  };

  /* ─────────────────────────────── RENDER ─────────────────── */
  return (
    <div className="fade-in">
      <PageHeader
        title="Menu & Products"
        subtitle="Items customers can order via WhatsApp"
        action={<Button onClick={openNew}><Plus size={15} /> Add Item</Button>}
      />

      {/* Stats strip */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <StripStat label="Total items" value={items.length} color="var(--primary)" />
          <StripStat label="Available" value={totalAvail} color="var(--green)" />
          <StripStat label="Unavailable" value={totalUnavail} color="var(--text-muted)" />
          <StripStat label="Categories" value={allCategories.length} color="var(--blue)" />
        </div>
      )}

      {/* Filters */}
      {!loading && items.length > 0 && (
        <Card style={{ marginBottom: 24, padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items…"
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Category filter */}
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              style={{ flex: '0 0 auto', width: 'auto', minWidth: 140 }}
            >
              <option value="">All categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Availability filter */}
            <select
              value={filterAvail}
              onChange={e => setFilterAvail(e.target.value)}
              style={{ flex: '0 0 auto', width: 'auto', minWidth: 140 }}
            >
              <option value="">All items</option>
              <option value="available">Available only</option>
              <option value="unavailable">Unavailable only</option>
            </select>

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: '0 0 auto' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ width: 'auto', minWidth: 160 }}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Clear */}
            {(search || filterCat || filterAvail || sort !== 'default') && (
              <button
                onClick={() => { setSearch(''); setFilterCat(''); setFilterAvail(''); setSort('default'); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0 4px' }}
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title="Menu is empty"
            body="Add items so customers can place orders through your WhatsApp bot"
            action={<Button onClick={openNew}><Plus size={15} /> Add First Item</Button>}
          />
        </Card>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="No items match your filters"
            body="Try a different search term or clear your filters"
            action={
              <Button variant="secondary" onClick={() => { setSearch(''); setFilterCat(''); setFilterAvail(''); setSort('default'); }}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <SectionTitle>{category}</SectionTitle>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 9px', marginBottom: 18 }}>
                  {catItems.length}
                </span>
              </div>
              <Grid cols={3} gap={16} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {catItems.map(item => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onToggle={toggleAvail}
                  />
                ))}
              </Grid>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modal}
        onClose={() => { if (!isBusy) { setModal(false); resetModal(); } }}
        title={editing ? 'Edit Menu Item' : 'Add Menu Item'}
        width={540}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name + Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Item name" required>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Grilled Chicken"
                autoFocus
              />
            </Field>
            <Field label="Price (D)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="150"
              />
            </Field>
          </div>

          {/* Category — dropdown from existing + free-type */}
          <Field label="Category" hint="Type a new category or pick an existing one">
            <input
              list="category-list"
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="Mains, Drinks, Snacks…"
            />
            <datalist id="category-list">
              {allCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Short description shown to customers…"
              style={{ minHeight: 66 }}
            />
          </Field>

          {/* Stock */}
          <Field label="Stock quantity" hint="Leave blank to disable stock tracking">
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={e => set('stock', e.target.value)}
              placeholder="e.g. 50 — blank = unlimited"
            />
          </Field>

          {/* Image — available for both new and edit */}
          <Field
            label="Product image"
            hint={
              !editing
                ? 'Image will be uploaded automatically when you save'
                : 'JPEG/PNG/WebP/GIF · max 5 MB · shown to customers by the bot'
            }
          >
            <ImageUploader
              preview={removeImg ? null : imagePreview}
              onFile={(file) => {
                setImageFile(file);
                setRemoveImg(false);
                const reader = new FileReader();
                reader.onload = (ev) => setImagePreview(ev.target.result);
                reader.readAsDataURL(file);
              }}
              onClear={clearImage}
              disabled={isBusy}
            />
            {imageFile && (
              <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <PackageCheck size={13} /> Image ready — will upload when you save
              </div>
            )}
            {removeImg && editing?.image?.url && (
              <div style={{ fontSize: '0.78rem', color: 'var(--amber)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <PackageX size={13} /> Current image will be removed on save
              </div>
            )}
          </Field>

          {/* Available toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.available}
              onChange={e => set('available', e.target.checked)}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Available for ordering</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button
              variant="secondary"
              style={{ flex: '0 0 auto' }}
              onClick={() => { setModal(false); resetModal(); }}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button style={{ flex: 1 }} loading={isBusy} onClick={save}>
              {uploadingImg ? 'Uploading image…' : saving ? 'Saving…' : editing ? 'Save Changes' : 'Add to Menu'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <DeleteModal
        item={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        busy={deleting}
      />
    </div>
  );
}

/* ─── Strip stat ──────────────────────────────────────────────── */
function StripStat({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '8px 16px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
