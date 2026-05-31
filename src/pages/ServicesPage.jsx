import { useEffect, useState } from 'react';
import { Scissors, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { services as servicesApi } from '../services/api';
import {
  PageHeader, Card, Button, Field, EmptyState, Spinner, Modal, Grid, Badge, SectionTitle, ConfirmModal
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { useAuth } from '../store/AuthContext';
import { getBizConfig } from '../utils/businessConfig';

const BLANK = { name: '', description: '', duration: 60, price: '', category: '', available: true };

export default function ServicesPage() {
  const { tenant } = useAuth();
  const cfg = getBizConfig(tenant?.businessMode || 'GENERIC');
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '', loading: false });

  const load = async () => {
    setLoading(true);
    try {
      const res = await servicesApi.list();
      setItems(res.data?.services || []);
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', duration: s.duration || 60, price: s.price || '', category: s.category || '', available: s.available !== false }); setModal(true); };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name) { toast.error('Service name is required'); return; }
    setSaving(true);
    try {
      // Coerce numeric fields — HTML inputs return strings; Mongoose expects Number
      const payload = {
        ...form,
        price:    form.price !== '' ? Number(form.price)    : undefined,
        duration: form.duration !== '' ? Number(form.duration) : 60,
      };
      if (editing) {
        await servicesApi.update(editing._id, payload);
        toast.success('Service updated');
      } else {
        await servicesApi.create(payload);
        toast.success('Service added');
      }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id, name) => {
    setDeleteConfirm({ open: true, id, name, loading: false });
  };

  const removeConfirmed = async () => {
    setDeleteConfirm(s => ({ ...s, loading: true }));
    try {
      await servicesApi.delete(deleteConfirm.id);
      toast.success('Service removed');
      setDeleteConfirm({ open: false, id: null, name: '', loading: false });
      load();
    } catch {
      toast.error('Failed to remove');
      setDeleteConfirm(s => ({ ...s, loading: false }));
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title={cfg.catalog.pageTitle}
        subtitle={cfg.catalog.pageSubtitle}
        action={<Button onClick={openNew}><Plus size={15} /> {cfg.catalog.addLabel}</Button>}
      />

      {/* Info banner — explains the SVC_N ID system to business owners */}
      <Card style={{ marginBottom: 24, background: 'var(--blue-dim)', border: '1px solid rgba(108,156,255,0.25)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.87rem', color: 'var(--blue)', lineHeight: 1.5 }}>
            Each service is assigned a button ID (SVC_0, SVC_1, etc.) in the order they appear here.
            Customers tap these during WhatsApp booking flows. The order matters — reorder to rearrange them.
          </div>
        </div>
      </Card>

      {loading ? <Spinner /> : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={cfg.catalog.icon}
            title={cfg.catalog.emptyTitle}
            body={cfg.catalog.emptyBody}
            action={<Button onClick={openNew}><Plus size={15} /> {cfg.catalog.addLabel}</Button>}
          />
        </Card>
      ) : (
        <Grid cols={3} gap={14}>
          {items.map((svc, idx) => (
            <ServiceCard key={svc._id} svc={svc} idx={idx} onEdit={openEdit} onDelete={remove} />
          ))}
        </Grid>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit ${cfg.catalog.itemLabel.charAt(0).toUpperCase() + cfg.catalog.itemLabel.slice(1)}` : cfg.catalog.addLabel} width={460}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Service name" required>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={
              { SALON: 'e.g. Haircut & Blow-dry', BARBERSHOP: 'e.g. Fade + Beard Trim', DELIVERY: 'e.g. Express Delivery (Same Day)', COSMETICS: 'e.g. Skin Consultation' }[tenant?.businessMode] || 'Service name'
            } />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Price (D)">
              <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="200" />
            </Field>
            <Field label="Duration (min)">
              <input type="number" min="15" step="15" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="60" />
            </Field>
          </div>
          <Field label="Category">
            <input value={form.category} onChange={e => set('category', e.target.value)} placeholder={cfg.catalog.categoryPlaceholder} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description for customers…" style={{ minHeight: 72 }} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.available} onChange={e => set('available', e.target.checked)} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Available for booking</span>
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button style={{ flex: 1 }} loading={saving} onClick={save}>
              {editing ? 'Save Changes' : cfg.catalog.addLabel}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '', loading: false })}
        onConfirm={removeConfirmed}
        loading={deleteConfirm.loading}
        title={`Remove ${cfg.catalog.itemLabel.charAt(0).toUpperCase() + cfg.catalog.itemLabel.slice(1)}`}
        message={`Remove "${deleteConfirm.name}"? This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}

function ServiceCard({ svc, idx, onEdit, onDelete }) {
  return (
    <Card style={{ opacity: svc.available === false ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{svc.name}</div>
          <Badge label={`SVC_${idx}`} color="purple" />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onEdit(svc)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(svc._id, svc.name)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px 6px', borderRadius: 6, cursor: 'pointer' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {svc.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>{svc.description}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {svc.price ? (
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>D {Number(svc.price).toLocaleString()}</span>
        ) : <span />}
        {svc.duration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            {svc.duration} min
          </div>
        )}
      </div>

      <div style={{ marginTop: 8 }}>
        <Badge label={svc.available !== false ? 'Available' : 'Unavailable'} color={svc.available !== false ? 'green' : 'default'} />
      </div>
    </Card>
  );
}
