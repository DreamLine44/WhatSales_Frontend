import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { dashApi, getModeConfig } from '../api.js';
import { PageHeader, Card, Input, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

export default function BusinessInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    dashApi.settings()
      .then(r => {
        const biz = r.data.business || {};
        setForm({
          name:         biz.name         || '',
          description:  biz.description  || '',
          adminPhone:   biz.adminPhone   || '',
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
      await dashApi.updateSettings({ name: form.name.trim(), description: form.description, adminPhone: form.adminPhone });
      toast.success('Business info saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  const modeConfig = getModeConfig(form.businessMode);

  return (
    <div className="fade-in">
      <PageHeader icon={Building2} title="Business Info" subtitle="Your business profile and contact details" />

      <Card style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            label="Business Name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="My Business"
          />
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Description</label>
            <textarea
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Tell customers what your business does…"
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
            />
          </div>
          <Input
            label="Admin Phone (WhatsApp)"
            value={form.adminPhone}
            onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))}
            placeholder="+220 xxx xxxx"
            hint="Phone number for order/booking notifications"
          />

          {/* Business mode — read-only */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: 'var(--bg-overlay)',
            borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
          }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{modeConfig.emoji}</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{modeConfig.label}</div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>Business mode is managed by your administrator</div>
            </div>
          </div>

          <Btn onClick={handleSave} loading={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={15} /> Save Changes
          </Btn>
        </div>
      </Card>
    </div>
  );
}
