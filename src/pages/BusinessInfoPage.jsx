import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { dashApi, getModeConfig, BUSINESS_MODES } from '../api.js';
import { PageHeader, Card, Input, Select, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

export default function BusinessInfoPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    dashApi.settings()
      .then(r => {
        const biz = r.data.business || {};
        setSettings(biz);
        setForm({
          name: biz.name || '',
          description: biz.description || '',
          adminPhone: biz.adminPhone || '',
          businessMode: biz.businessMode || 'RESTAURANT',
        });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.name?.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      await dashApi.updateSettings({ name: form.name, description: form.description, adminPhone: form.adminPhone });
      toast.success('Business info saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Building2} title="Business Info" subtitle="Your business profile and contact details" />

      <Card style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Business Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Business" />
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Tell customers what your business does..."
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <Input label="Admin Phone (WhatsApp)" value={form.adminPhone} onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))} placeholder="+220 xxx xxxx" hint="Phone number for order/booking notifications" />

          <div style={{ padding: '14px 16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>{getModeConfig(form.businessMode).emoji}</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getModeConfig(form.businessMode).label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Business mode is managed by your administrator</div>
            </div>
          </div>

          <Btn onClick={handleSave} loading={saving}><Save size={15} /> Save Changes</Btn>
        </div>
      </Card>
    </div>
  );
}
