import { useEffect, useState } from 'react';
import { Scissors, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { servicesApi, formatMoney } from '../api.js';
import { useAuth } from '../store/AuthContext.jsx';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Services use the dedicated /dashboard/:tenantId/services CRUD endpoints.
// Each operation is atomic — no full-array replacement needed.
// GET    /services              → { services, count }
// POST   /services              → 201 { services }
// PATCH  /services/:serviceId   → { services }
// DELETE /services/:serviceId   → { ok: true }
// ⚠ price and duration must be Numbers, not strings

function ServiceRow({ service, onUpdate, onDelete, currency }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: service.name,
    price: service.price,
    description: service.description || '',
    duration: service.duration || 30,
  });
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      const r = await servicesApi.update(service._id, {
        name:        form.name.trim(),
        price:       Number(form.price) || 0,       // ⚠ must be number
        duration:    Number(form.duration) || 30,   // ⚠ must be number
        description: form.description || '',
      });
      // Response: { services: [...] } — find the updated item to pass back
      const updated = (r.data?.services || []).find(s => s._id === service._id) || {
        ...service, ...form, price: Number(form.price) || 0, duration: Number(form.duration) || 30,
      };
      onUpdate(r.data?.services || null, updated);
      setEditing(false);
      toast.success('Service updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await servicesApi.remove(service._id);
      onDelete(service._id);
      toast.success('Service deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px 18px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <Input label="Service name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label={`Price (${currency || 'D'})`} type="number" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <Input label="Duration (min)" type="number" value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
          </div>
          <Input label="Description" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{service.name}</div>
            {service.description && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{service.description}</div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {formatMoney(service.price, currency)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {service.duration || 30} min
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)} title="Edit"><Pencil size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }} title="Delete">
              <Trash2 size={13} />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [adding, setAdding]     = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '', duration: '30' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    servicesApi.list()
      .then(r => setServices(r.data?.services || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  // When PATCH returns the full updated array, use it; otherwise apply local splice
  const handleUpdate = (newList, updatedItem) => {
    if (newList) {
      setServices(newList);
    } else {
      setServices(prev => prev.map(s => s._id === updatedItem._id ? updatedItem : s));
    }
  };

  const handleDelete = (deletedId) => {
    setServices(prev => prev.filter(s => s._id !== deletedId));
  };

  const add = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await servicesApi.add({
        name:        form.name.trim(),
        price:       Number(form.price) || 0,      // ⚠ number
        duration:    Number(form.duration) || 30,  // ⚠ number
        description: form.description || '',
      });
      setServices(r.data?.services || services);
      setForm({ name: '', price: '', description: '', duration: '30' });
      setAdding(false);
      toast.success('Service added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={Scissors} title="Services" subtitle={`${services.length} service${services.length !== 1 ? 's' : ''}`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Service</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Service</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <Input label="Service name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Haircut" />
              <Input label={`Price (${user?.currency || 'D'})`} type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="200" />
              <Input label="Duration (min)" type="number" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <Input label="Description (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Professional haircut..." />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={add} loading={saving}><Check size={14} /> Add Service</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : services.length === 0 ? (
        <Card>
          <EmptyState icon={Scissors} title="No services yet"
            description="Add your services so customers can book appointments via WhatsApp."
            action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first service</Btn>}
          />
        </Card>
      ) : (
        <div>
          {services.map((s) => (
            <ServiceRow key={s._id} service={s} onUpdate={handleUpdate} onDelete={handleDelete} currency={user?.currency} />
          ))}
        </div>
      )}
    </div>
  );
}
