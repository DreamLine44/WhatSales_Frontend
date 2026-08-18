import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { bizApi, getModeConfig } from '../api.js';
import { PageHeader, Card, Input, Btn, Spinner } from '../components/ui.jsx';
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
          address:      biz.address      || '',
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
      // PATCH /dashboard/:id/settings — partial update, only sends the fields this page owns.
      // Previously used PUT /business/:id which replaces the whole document and
      // would silently drop any fields not included in this payload.
      // [FIX-ADDR] 'address' is now in the backend's PATCH whitelist and is used by
      // the bot's "About Us" reply — previously this field existed on the schema
      // and even had a frontend spot reserved for it in comments, but saving it
      // here was silently rejected server-side, so it never had a real UI until now.
      await bizApi.updateSettings({
        name:        form.name.trim(),
        description: form.description,
        address:     form.address,
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

      <div className="settings-2col">
        <Card>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <Input
                label="Address"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="12 Kairaba Avenue, Serrekunda"
                hint="Shown to customers who ask where you're located"
              />
              <Input
                label="Admin Phone (WhatsApp)"
                value={form.adminPhone}
                onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))}
                placeholder="+220 xxx xxxx"
                hint="Phone number for order/booking notifications"
              />
            </div>

            <Btn onClick={handleSave} loading={saving} style={{ alignSelf: 'flex-start' }}>
              <Save size={15} /> Save Changes
            </Btn>
          </div>
        </Card>

        {/* Business mode — read-only, managed by admin via /admin/tenants/:id */}
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '4px 2px',
          }}>
            <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{modeConfig.emoji}</span>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{modeConfig.label}</div>
              <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>Business mode is managed by your administrator</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
