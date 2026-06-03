import { useEffect, useState } from 'react';
import { Scissors, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Input } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function ServiceRow({ service, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: service.name, price: service.price, description: service.description || '', duration: service.duration || 30 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      await bizApi.updateService(service._id, { ...form, price: Number(form.price), duration: Number(form.duration) });
      onUpdate({ ...service, ...form });
      setEditing(false);
      toast.success('Service updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try {
      await bizApi.deleteService(service._id);
      onDelete(service._id);
      toast.success('Service deleted');
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <Input label="Service name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Price (D)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <Input label="Duration (min)" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
          </div>
          <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" onClick={save} loading={saving}><Check size={13} /> Save</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={13} /> Cancel</Btn>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{service.name}</div>
            {service.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{service.description}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>D {Number(service.price).toFixed(0)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{service.duration || 30} min</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil size={13} /></Btn>
            <Btn variant="ghost" size="sm" onClick={del} loading={deleting} style={{ color: 'var(--red)' }}><Trash2 size={13} /></Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '', duration: '30' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    bizApi.getServices()
      .then(r => setServices(r.data.services || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const add = async () => {
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await bizApi.addService({ ...form, price: Number(form.price), duration: Number(form.duration) });
      setServices(r.data.services || []);
      setForm({ name: '', price: '', description: '', duration: '30' });
      setAdding(false);
      toast.success('Service added');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader icon={Scissors} title="Services" subtitle={`${services.length} services`}
        actions={<Btn size="sm" onClick={() => setAdding(v => !v)}><Plus size={14} /> Add Service</Btn>}
      />

      {adding && (
        <Card style={{ marginBottom: 16, borderColor: 'var(--border-accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>New Service</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <Input label="Service name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Haircut" />
              <Input label="Price (D)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="200" />
              <Input label="Duration (min)" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            </div>
            <Input label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Professional haircut..." />
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
        <Card><EmptyState icon={Scissors} title="No services yet"
          description="Add your services so customers can book appointments via WhatsApp."
          action={<Btn onClick={() => setAdding(true)}><Plus size={14} /> Add first service</Btn>}
        /></Card>
      ) : (
        <div>{services.map(s => (
          <ServiceRow key={s._id} service={s}
            onDelete={id => setServices(xs => xs.filter(x => x._id !== id))}
            onUpdate={u => setServices(xs => xs.map(x => x._id === u._id ? u : x))}
          />
        ))}</div>
      )}
    </div>
  );
}
