import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, Trash2, Pencil, Check, X, ToggleLeft, ToggleRight, Image as ImageIcon, Upload, ChevronDown, ChevronUp, ClipboardList, AlertTriangle, Loader2 } from 'lucide-react';
import { menuApi, bizApi, formatMoney } from '../api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input, Toggle } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Menu uses the dedicated /dashboard/:tenantId/menu CRUD endpoints.
// GET    /menu              → { menuItems, count }
// POST   /menu              → 201 { menuItems }
// PATCH  /menu/:itemId      → { menuItems }   ← edit by _id, NOT by name
// DELETE /menu/:itemId      → { ok: true }    ← delete by _id, NOT by name
// ⚠ price must be a Number, not a string
// ⚠ always use _id for update/delete — never item name
//
// [MENU-FIELDS-1] BusinessConfig's menuItemSchema supports several fields this
// page never exposed: stockCount (per-item inventory — auto-decrements on
// order, flips available:false at 0), category (drives the salon flow's
// services-vs-products split), currency (per-item override), duration/prep
// (salon-style appointment items), tags, variants (sizes/options), and
// showImageOnSelect. All are optional — tucked behind an "Advanced options"
// disclosure so the common case (name/price/description) stays uncluttered.

// Comma-separated string ⇄ array helpers for tags/variants text inputs.
const toCsv   = (arr) => (arr || []).map(v => (typeof v === 'string' ? v : v?.name || '')).filter(Boolean).join(', ');
const fromCsv = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

// [BULK-ADD-1] Parses a pasted, multi-line block of text into menu-item rows.
// Format is one item per line: "Name, Price, Description (optional)".
// Only the first comma splits name/price — everything after the second
// comma is treated as the description, so descriptions may contain commas
// of their own (e.g. "Jollof Rice, 150, Rice with tomato, onion, and spice").
// Blank lines and lines starting with # (comments) are ignored.
const BULK_EXAMPLE = `Jollof Rice, 150, Savoury rice cooked in tomato sauce
Benachin (Chicken), 175, Jollof-style rice with chicken
Grilled Fish, 200
Bissap Juice, 50, Hibiscus drink, served chilled`;

function parseBulkMenuText(text) {
  const lines = (text || '').split('\n');
  const rows = [];
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const parts = line.split(',');
    const name = (parts[0] || '').trim();
    const priceRaw = (parts[1] || '').trim();
    const description = parts.slice(2).join(',').trim();
    const errors = [];
    if (!name) errors.push('Missing item name');
    let price = 0;
    if (priceRaw === '') {
      // price optional — defaults to 0, same as the single-item form
    } else if (Number.isNaN(Number(priceRaw))) {
      errors.push(`Price "${priceRaw}" isn't a number`);
    } else {
      price = Number(priceRaw);
    }
    rows.push({ line: idx + 1, raw: line, name, price, priceRaw, description, errors });
  });
  return rows;
}

function AdvancedFields({ form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input label="Category" value={form.category} placeholder="e.g. services, drinks"
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          hint="'services' marks a bookable item for salon-style flows" />
        <Input label="Stock count" type="number" value={form.stockCount} placeholder="Blank = unlimited"
          onChange={e => setForm(f => ({ ...f, stockCount: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Input label="Currency override" value={form.currency} placeholder="e.g. GMD"
          onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} />
        <Input label="Duration (min)" type="number" value={form.duration} placeholder="e.g. 45"
          onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
        <Input label="Prep note" value={form.prep} placeholder="e.g. Arrive early"
          onChange={e => setForm(f => ({ ...f, prep: e.target.value }))} />
      </div>
      <Input label="Tags (comma-separated)" value={form.tagsCsv} placeholder="popular, new, special"
        onChange={e => setForm(f => ({ ...f, tagsCsv: e.target.value }))} />
      <Input label="Variants (comma-separated)" value={form.variantsCsv} placeholder="S, M, L"
        onChange={e => setForm(f => ({ ...f, variantsCsv: e.target.value }))}
        hint="Sizes or options a customer picks before adding to cart" />
      <Toggle
        checked={form.showImageOnSelect}
        onChange={v => setForm(f => ({ ...f, showImageOnSelect: v }))}
        label="Show image when item is selected"
        hint="Turn off to keep responses text-only for this item"
      />
    </div>
  );
}

// [BULK-ADD-PHOTOS-1] Single tile in the post-bulk-add photo step. Mirrors
// ItemRow's image control/upload logic, but scoped to just-created items so
// the tenant can attach photos to a whole bulk paste in one screen instead of
// opening each item individually afterward. Photos matter beyond cosmetics
// here: per waCatalogHelpers.isSyncableForCatalog (see CatalogPage.jsx), an
// item with no image is skipped entirely from the Meta WhatsApp Catalog sync
// — this step exists mainly to close that gap right after a bulk paste.
function BulkPhotoTile({ item, cloudinaryEnabled, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await menuApi.uploadImage(item._id, fd);
      const updated = r.data?.menuItem || { ...item, image: r.data?.image };
      onUploaded(updated);
    } catch (err) {
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
      onUploaded({ ...item, image: null });
      toast.success('Image removed');
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const zeroPrice = !item.price || Number(item.price) <= 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
    }}>
      <label
        title={cloudinaryEnabled ? (item.image?.url ? 'Change image' : 'Add image') : 'Image uploads not enabled'}
        style={{
          width: 44, height: 44, borderRadius: 'var(--r-md)', overflow: 'hidden',
          border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--bg-overlay)',
          cursor: cloudinaryEnabled ? 'pointer' : 'not-allowed', flexShrink: 0, position: 'relative',
        }}
      >
        {uploading ? (
          <Loader2 size={15} color="var(--text-ghost)" style={{ animation: 'spin 0.8s linear infinite' }} />
        ) : item.image?.url ? (
          <img src={item.image.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          cloudinaryEnabled ? <Upload size={14} color="var(--text-ghost)" /> : <ImageIcon size={14} color="var(--text-ghost)" />
        )}
        <input
          type="file" accept="image/*" style={{ display: 'none' }}
          disabled={!cloudinaryEnabled || uploading}
          onChange={e => uploadImage(e.target.files?.[0])}
        />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.name}</div>
        {zeroPrice && (
          <div style={{ fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 600 }}>
            $0 price — also won't sync to Meta until priced
          </div>
        )}
      </div>
      {item.image?.url && (
        <button type="button" onClick={removeImage} disabled={uploading}
          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 0, fontSize: '0.76rem', fontWeight: 600 }}>
          Remove
        </button>
      )}
    </div>
  );
}

function BulkAddForm({ currency, existingItems, cloudinaryEnabled, waCatalogEnabled, onAdded, onItemImageUpdated, onCancel, onGoToCatalog }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  // 'input' = pasting/reviewing rows, 'photos' = post-add photo step for the
  // items that were just created by this bulk submit.
  const [phase, setPhase] = useState('input');
  const [photoItems, setPhotoItems] = useState([]);

  const rows = useMemo(() => parseBulkMenuText(text), [text]);
  const validRows = rows.filter(r => r.errors.length === 0);
  const invalidRows = rows.filter(r => r.errors.length > 0);
  // [CATALOG-AWARE-BULK-1] Rows that will parse and create fine but won't
  // actually reach Meta's catalog — mirrors CatalogPage's
  // isSyncableForCatalog 'invalid_or_zero_price' reason. Only worth flagging
  // when this tenant actually has the catalog enabled.
  const zeroPriceCount = waCatalogEnabled ? validRows.filter(r => !r.price || r.price <= 0).length : 0;

  const submit = async () => {
    if (validRows.length === 0) { toast.error('Add at least one valid line first'); return; }
    // Snapshot which _ids already existed *before* this run, so we can tell
    // apart the freshly-created items afterward for the photo step.
    const beforeIds = new Set((existingItems || []).map(i => i._id));
    setSubmitting(true);
    setProgress({ done: 0, total: validRows.length });
    let latestMenuItems = null;
    let failed = [];
    // Sequential, not parallel: reuses the existing single-item POST /menu
    // endpoint (no backend changes needed) and avoids hammering the API
    // with dozens of simultaneous requests for a large paste.
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const r = await menuApi.add({
          name: row.name,
          price: row.price,
          description: row.description || '',
        });
        latestMenuItems = r.data?.menuItems || latestMenuItems;
      } catch (err) {
        failed.push({ ...row, error: err.message });
      }
      setProgress({ done: i + 1, total: validRows.length });
    }
    setSubmitting(false);
    const succeeded = validRows.length - failed.length;
    if (succeeded > 0) {
      toast.success(`${succeeded} item${succeeded !== 1 ? 's' : ''} added`);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} item${failed.length !== 1 ? 's' : ''} failed: ${failed.map(f => f.name).join(', ')}`);
    }
    if (latestMenuItems) onAdded(latestMenuItems);
    if (failed.length === 0) {
      setText('');
    } else {
      // Leave only the failed lines in the box so the tenant can fix & retry.
      setText(failed.map(f => f.raw).join('\n'));
    }
    // Hand off into the photo step for whatever just got created — only
    // worth showing if image uploads are actually configured for this tenant.
    const newlyAdded = (latestMenuItems || []).filter(mi => !beforeIds.has(mi._id));
    if (cloudinaryEnabled && newlyAdded.length > 0) {
      setPhotoItems(newlyAdded);
      setPhase('photos');
    }
  };

  if (phase === 'photos') {
    const stillMissing = photoItems.filter(i => !i.image?.url).length;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Your items are added. Want to attach a photo to any of them now? You can always add or change these later
          from the menu list.
          {/* [CATALOG-AWARE-BULK-1] Backend auto-syncs every menu create/update
              to Meta's WhatsApp Commerce Catalog (see waCatalogService.js /
              CATALOG-AUTOSYNC-1) — but only items with a price and an image
              are eligible, so this is the moment that decides whether these
              new items actually show up there. */}
          {waCatalogEnabled && (
            <> Your WhatsApp Catalog is enabled for this business — items without a photo here will be skipped
              when they sync to Meta.</>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {photoItems.map(item => (
            <BulkPhotoTile
              key={item._id}
              item={item}
              cloudinaryEnabled={cloudinaryEnabled}
              onUploaded={(updated) => {
                setPhotoItems(prev => prev.map(i => i._id === updated._id ? updated : i));
                onItemImageUpdated(updated);
              }}
            />
          ))}
        </div>
        {waCatalogEnabled && stillMissing > 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-ghost)' }}>
            {stillMissing} item{stillMissing !== 1 ? 's' : ''} still without a photo won't appear in your Meta
            catalog until one's added.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={onCancel}><Check size={14} /> Done</Btn>
          {waCatalogEnabled && (
            <Btn variant="ghost" onClick={onGoToCatalog}>View Catalog status</Btn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Paste one item per line: <strong>Name, Price, Description (optional)</strong>. Arrange your list in Notes,
        Excel, or a Word doc first, then copy and paste it here.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={BULK_EXAMPLE}
        rows={8}
        style={{
          width: '100%', resize: 'vertical', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem',
          padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
          background: 'var(--bg-overlay)', color: 'var(--text-main, inherit)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setText(BULK_EXAMPLE)}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          Insert example
        </button>
        {rows.length > 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{validRows.length} ready</span>
            {invalidRows.length > 0 && (
              <span style={{ color: 'var(--red)', fontWeight: 700 }}>{invalidRows.length} need fixing</span>
            )}
            {zeroPriceCount > 0 && (
              <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                {zeroPriceCount} won't sync to Meta ($0 price)
              </span>
            )}
          </div>
        )}
      </div>

      {invalidRows.length > 0 && (
        <div style={{
          background: 'var(--red-dim, rgba(220,38,38,0.08))', border: '1.5px solid rgba(220,38,38,0.22)',
          borderRadius: 'var(--r-md)', padding: '8px 12px', fontSize: '0.78rem', color: 'var(--red)',
          display: 'flex', flexDirection: 'column', gap: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <AlertTriangle size={13} /> Fix these lines before adding:
          </div>
          {invalidRows.map(r => (
            <div key={r.line}>Line {r.line}: {r.errors.join('; ')} — "{r.raw}"</div>
          ))}
        </div>
      )}

      {validRows.length > 0 && (
        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          {validRows.map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 12px',
              fontSize: '0.78rem', borderBottom: i < validRows.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontWeight: 600 }}>{r.name}</span>
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{r.description}</span>
              {waCatalogEnabled && (!r.price || r.price <= 0) && (
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>$0 · won't sync</span>
              )}
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatMoney(r.price, currency, 2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn onClick={submit} loading={submitting} disabled={validRows.length === 0}>
          {submitting
            ? <>Adding {progress?.done}/{progress?.total}…</>
            : <><Check size={14} /> Add {validRows.length || ''} Item{validRows.length !== 1 ? 's' : ''}</>}
        </Btn>
        <Btn variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Btn>
      </div>
    </div>
  );
}

function ItemRow({ item, onUpdate, onDelete, cloudinaryEnabled, currency }) {
  const [editing, setEditing]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name:        item.name,
    price:       item.price,
    description: item.description || '',
    available:   item.available !== false,
    category:    item.category || '',
    stockCount:  item.stockCount ?? '',
    currency:    item.currency || '',
    duration:    item.duration ?? '',
    prep:        item.prep || '',
    tagsCsv:     toCsv(item.tags),
    variantsCsv: toCsv(item.variants),
    showImageOnSelect: item.showImageOnSelect !== false,
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
        category:    form.category.trim() || null,
        stockCount:  form.stockCount === '' ? null : Number(form.stockCount),
        currency:    form.currency.trim() || null,
        duration:    form.duration === '' ? null : Number(form.duration),
        prep:        form.prep.trim() || null,
        tags:        fromCsv(form.tagsCsv),
        variants:    fromCsv(form.variantsCsv),
        showImageOnSelect: form.showImageOnSelect,
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
      // POST /menu/:itemId/image returns { ok, image, menuItem } — no menuItems array.
      const r = await menuApi.uploadImage(item._id, fd);
      const updated = r.data?.menuItem || { ...item, image: r.data?.image };
      onUpdate(null, updated);
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

  // [MENU-GRID-1] Card/gallery layout — one tile per item, image up top,
  // details + actions below. Editing mode spans the full grid width (via
  // gridColumn on the outer wrapper) so the multi-field form has room to
  // breathe instead of being squeezed into a single card's column width.
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      gridColumn: editing ? '1 / -1' : undefined,
      opacity: item.available === false && !editing ? 0.72 : 1,
      transition: 'box-shadow 0.15s, transform 0.15s, opacity 0.15s',
    }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label={`Price (${currency || 'D'})`} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '2px 0',
            }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Advanced options
          </button>
          {showAdvanced && <AdvancedFields form={form} setForm={setForm} />}
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <>
          {/* Image / photo tile — full-bleed, click-to-upload */}
          <div style={{ position: 'relative', width: '100%', height: 138, flexShrink: 0, background: 'var(--bg-overlay)' }}>
            <label
              title={cloudinaryEnabled ? (item.image?.url ? 'Change image' : 'Add image') : 'Image uploads not enabled'}
              style={{
                display: 'block', width: '100%', height: '100%',
                cursor: cloudinaryEnabled ? 'pointer' : 'not-allowed', position: 'relative',
              }}
            >
              {uploading ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={20} /></div>
              ) : item.image?.url ? (
                <img src={item.image.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {cloudinaryEnabled ? <Upload size={20} color="var(--text-ghost)" /> : <ImageIcon size={20} color="var(--text-ghost)" />}
                  {cloudinaryEnabled && <span style={{ fontSize: '0.68rem', color: 'var(--text-ghost)', fontWeight: 600 }}>Add photo</span>}
                </div>
              )}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                disabled={!cloudinaryEnabled || uploading}
                onChange={e => uploadImage(e.target.files?.[0])}
              />
            </label>
            {item.image?.url && cloudinaryEnabled && (
              <button onClick={removeImage} disabled={uploading} title="Remove image"
                style={{
                  position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
                }}>
                <X size={12} />
              </button>
            )}
            {/* Available/unavailable toggle — pinned corner badge, mirrors the
                red status dot pattern used across the dashboard's list rows. */}
            <button onClick={toggleAvail} disabled={toggling}
              title={item.available ? 'Mark unavailable' : 'Mark available'}
              style={{
                position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: '50%',
                background: item.available ? 'rgba(255,255,255,0.92)' : 'var(--red)',
                color: item.available ? 'var(--primary)' : '#fff',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              }}>
              {item.available ? <ToggleRight size={13} /> : <X size={12} />}
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '11px 13px 4px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: '0.87rem', lineHeight: 1.3 }}>{item.name}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatMoney(item.price, currency, 2)}
              </span>
            </div>
            {item.description && (
              <div style={{
                fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{item.description}</div>
            )}
            {(!item.available || item.tags?.length > 0 || item.category || item.stockCount != null || item.variants?.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {!item.available && (
                  <span style={{ fontSize: '0.63rem', background: 'var(--red-dim, rgba(220,38,38,0.08))', color: 'var(--red)', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>Unavailable</span>
                )}
                {item.tags?.length > 0 && item.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.63rem', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>{tag}</span>
                ))}
                {item.category && (
                  <span style={{ fontSize: '0.63rem', background: 'var(--bg-overlay)', color: 'var(--text-muted)', borderRadius: 99, padding: '1px 7px', fontWeight: 700, border: '1px solid var(--border)' }}>{item.category}</span>
                )}
                {item.stockCount != null && (
                  <span style={{ fontSize: '0.63rem', background: item.stockCount > 0 ? 'var(--blue-dim, var(--bg-overlay))' : 'var(--red-dim)', color: item.stockCount > 0 ? 'var(--blue)' : 'var(--red)', borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>
                    {item.stockCount} in stock
                  </span>
                )}
                {item.variants?.length > 0 && (
                  <span style={{ fontSize: '0.63rem', background: 'var(--bg-overlay)', color: 'var(--text-muted)', borderRadius: 99, padding: '1px 7px', fontWeight: 700, border: '1px solid var(--border)' }}>
                    {item.variants.length} option{item.variants.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px 10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <Btn variant="ghost" size="xs" onClick={() => setEditing(true)} title="Edit"><Pencil size={12} /> Edit</Btn>
            <Btn variant="ghost" size="xs" onClick={del} loading={deleting} style={{ color: 'var(--red)' }} title="Delete">
              <Trash2 size={12} />
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [addMode, setAddMode]     = useState('single'); // 'single' | 'bulk'
  const [form, setForm] = useState({
    name: '', price: '', description: '',
    category: '', stockCount: '', currency: '', duration: '', prep: '',
    tagsCsv: '', variantsCsv: '', showImageOnSelect: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving]       = useState(false);
  // [FIX-MENU-IMAGES-2] Optional image attached at creation time — backend's
  // POST /:tenantId/menu already accepts multipart with an "image" field
  // (see addMenuItem in dashboardController.js), the create form just never
  // offered a way to use it. newImageFile is the raw File; newImagePreview
  // is a local blob URL for the thumbnail (revoked on reset/unmount).
  const [newImageFile, setNewImageFile]       = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  // [FIX-MENU-IMAGES] Check whether image storage is configured on this
  // environment before offering an upload control — avoids a confusing
  // "upload failed" the first time someone tries, per Appendix C spec.
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  // [CATALOG-AWARE-BULK-1] Whether this tenant's Meta WhatsApp Catalog is
  // turned on — drives the bulk-add photo step's copy/warnings below.
  // Read-only here; configuring it lives on CatalogPage (see bizApi.getSettings
  // → business.waCatalog, same field CatalogPage.jsx reads).
  const [waCatalogEnabled, setWaCatalogEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    menuApi.list()
      .then(r => setMenuItems(r.data?.menuItems || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
    bizApi.cloudinaryStatus()
      .then(r => setCloudinaryEnabled(!!r.data?.cloudinaryEnabled))
      .catch(() => setCloudinaryEnabled(false));
    bizApi.getSettings()
      .then(r => setWaCatalogEnabled(!!r.data?.business?.waCatalog?.enabled))
      .catch(() => setWaCatalogEnabled(false));
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

  // Revoke the object URL behind the create-form image preview and clear it.
  const clearNewImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(null);
    setNewImagePreview(null);
  };

  const pickNewImage = (file) => {
    if (!file) return;
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const add = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      // [FIX-MENU-IMAGES-2] When an image was attached, POST multipart so the
      // backend's uploadSingle middleware + Cloudinary step in addMenuItem
      // runs; otherwise keep the original plain-JSON request unchanged.
      const advanced = {
        category:    form.category.trim() || null,
        stockCount:  form.stockCount === '' ? null : Number(form.stockCount),
        currency:    form.currency.trim() || null,
        duration:    form.duration === '' ? null : Number(form.duration),
        prep:        form.prep.trim() || null,
        tags:        fromCsv(form.tagsCsv),
        variants:    fromCsv(form.variantsCsv),
        showImageOnSelect: form.showImageOnSelect,
      };
      let payload;
      if (newImageFile) {
        payload = new FormData();
        payload.append('name', form.name.trim());
        payload.append('price', String(Number(form.price) || 0));
        payload.append('description', form.description || '');
        payload.append('image', newImageFile);
        for (const [k, v] of Object.entries(advanced)) {
          if (v === null || v === undefined) continue;
          payload.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
        }
      } else {
        payload = {
          name:        form.name.trim(),
          price:       Number(form.price) || 0,  // ⚠ must be number
          description: form.description || '',
          ...advanced,
        };
      }
      const r = await menuApi.add(payload);
      setMenuItems(r.data?.menuItems || menuItems);
      setForm({ name: '', price: '', description: '', category: '', stockCount: '', currency: '', duration: '', prep: '', tagsCsv: '', variantsCsv: '', showImageOnSelect: true });
      setShowAdvanced(false);
      clearNewImage();
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
              {addMode === 'single' ? 'New Menu Item' : 'Add Multiple Items'}
            </h3>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)', padding: 3 }}>
              <button type="button" onClick={() => setAddMode('single')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--r-sm, 6px)',
                  border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
                  background: addMode === 'single' ? 'var(--bg-surface)' : 'transparent',
                  color: addMode === 'single' ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                <Plus size={12} /> Single Item
              </button>
              <button type="button" onClick={() => setAddMode('bulk')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--r-sm, 6px)',
                  border: 'none', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700,
                  background: addMode === 'bulk' ? 'var(--bg-surface)' : 'transparent',
                  color: addMode === 'bulk' ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                <ClipboardList size={12} /> Add Multiple
              </button>
            </div>
          </div>

          {addMode === 'bulk' ? (
            <BulkAddForm
              currency={user?.currency}
              existingItems={menuItems}
              cloudinaryEnabled={cloudinaryEnabled}
              waCatalogEnabled={waCatalogEnabled}
              onAdded={(newList) => { setMenuItems(newList); }}
              onItemImageUpdated={(updated) => handleUpdate(null, updated)}
              onCancel={() => setAdding(false)}
              onGoToCatalog={() => navigate('/setup/catalog')}
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Item name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jollof Rice" />
              <Input label={`Price (${user?.currency || 'D'})`} type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
            </div>
            <Input label="Description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Savoury rice cooked in tomato sauce" />

            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
                color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: '2px 0',
              }}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Advanced options
            </button>
            {showAdvanced && <AdvancedFields form={form} setForm={setForm} />}

            {/* [FIX-MENU-IMAGES-2] Optional image at creation time, mirrors the
                per-row control below and stays disabled with the same message
                when Cloudinary isn't configured on this environment. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label
                title={cloudinaryEnabled ? 'Add a photo (optional)' : 'Image uploads not enabled'}
                style={{
                  width: 52, height: 52, borderRadius: 'var(--r-md)', overflow: 'hidden',
                  border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'var(--bg-overlay)',
                  cursor: cloudinaryEnabled ? 'pointer' : 'not-allowed', flexShrink: 0, position: 'relative',
                }}
              >
                {newImagePreview ? (
                  <img src={newImagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  cloudinaryEnabled ? <Upload size={16} color="var(--text-ghost)" /> : <ImageIcon size={16} color="var(--text-ghost)" />
                )}
                <input
                  type="file" accept="image/*" style={{ display: 'none' }}
                  disabled={!cloudinaryEnabled}
                  onChange={e => pickNewImage(e.target.files?.[0])}
                />
              </label>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {cloudinaryEnabled
                  ? (newImageFile ? <>{newImageFile.name} <button type="button" onClick={clearNewImage} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 0, marginLeft: 6, font: 'inherit' }}>Remove</button></> : 'Photo (optional)')
                  : "Photo uploads aren't turned on for this business yet"}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Add Item</Btn>
              <Btn variant="ghost" onClick={() => { clearNewImage(); setAdding(false); }}>Cancel</Btn>
            </div>
          </div>
          )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {menuItems.map((item) => (
            <ItemRow key={item._id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} cloudinaryEnabled={cloudinaryEnabled} currency={user?.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
