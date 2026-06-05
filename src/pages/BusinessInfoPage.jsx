import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { bizApi, getModeConfig } from '../api.js';
import { PageHeader, Card, Input, Textarea, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

export default function BusinessInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({});

  useEffect(() => {
    // Step 6: GET /business/:id — returns the complete business record
    bizApi.get()
      .then(r => {
        const biz = r.data.business || r.data || {};
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
      // Step 3: PUT /business/:id — only send the keys we want to update
      await bizApi.update({
        name:        form.name.trim(),
        description: form.description,
        adminPhone:  form.adminPhone,
      });
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
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="Tell customers what your business does…"
          />
          <Input
            label="Admin Phone (WhatsApp)"
            value={form.adminPhone}
            onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))}
            placeholder="+220 xxx xxxx"
            hint="Phone number for order/booking notifications"
          />

          {/* Business mode — read-only, managed by admin via /admin/tenants/:id */}
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
