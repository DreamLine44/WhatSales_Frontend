import { useEffect, useState } from 'react';
import { Building2, Save, Zap, Package } from 'lucide-react';
import { business as businessApi } from '../services/api';
import {
  PageHeader, Card, Button, Field, SectionTitle, Grid, Spinner, Toggle
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { BUSINESS_MODES } from '../utils/businessConfig';

export default function BusinessSetupPage() {
  const [form, setForm]     = useState({ name: '', adminPhone: '', businessMode: '', description: '' });
  const [bizData, setBizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]  = useState(false);

  useEffect(() => {
    businessApi.get().then(res => {
      const d = res.data?.business || {};
      setBizData(d);
      setForm({
        name:         d.name || '',
        adminPhone:   d.adminPhone || '',
        businessMode: d.businessMode || '',
        description:  d.description || '',
      });
    }).catch(() => toast.error('Failed to load business config'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.adminPhone || !form.businessMode) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      // Send name/description/adminPhone/businessMode as top-level allowed fields.
      // NOTE: timezone is NOT saved here — it lives inside the `hours` object and is
      // managed exclusively in HoursPage. Sending { hours: { timezone } } would replace
      // the entire hours subdocument (wiping enabled/open/close/days).
      await businessApi.updateSettings({ name: form.name, adminPhone: form.adminPhone, businessMode: form.businessMode, description: form.description });
      toast.success('Business info saved ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Business Info"
        subtitle="Core settings — your bot uses these to personalise every customer interaction"
        action={<Button loading={saving} onClick={save}><Save size={15} /> Save</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Basic info */}
        <Card>
          <SectionTitle>Basic Information</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Grid cols={2} gap={16}>
              <Field label="Business name" required>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mariama's Kitchen" />
              </Field>
              <Field label="Admin WhatsApp number" required hint="Receives order alerts — must match ADMIN_PHONES env var or DB record">
                <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} placeholder="+220 353 2423" />
              </Field>
            </Grid>
            <Field label="Business description" hint="Used by the AI in greeting messages">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="A beloved family restaurant serving authentic Gambian cuisine since 2010…" />
            </Field>
          </div>
        </Card>

        {/* Business mode — determines which flows the bot runs */}
        <Card>
          <SectionTitle
            sub="Determines what flows the bot offers: ORDER, BOOKING, or both. Changing mode updates the bot's welcome buttons and available actions."
          >
            Business Mode
          </SectionTitle>

          {/* Full-flow modes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Zap size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Full AI Flow
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>— dedicated bot module with smart conversation flow</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {BUSINESS_MODES.filter(m => m.tier === 'full').map(m => (
                <div
                  key={m.value}
                  onClick={() => set('businessMode', m.value)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1px solid ${form.businessMode === m.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.businessMode === m.value ? 'var(--primary-dim)' : 'var(--bg-overlay)',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '1rem', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  {form.businessMode === m.value && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>● Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Basic modes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Package size={13} color="var(--text-muted)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Basic Flow
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>— standard order flow, no custom bot module</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {BUSINESS_MODES.filter(m => m.tier === 'basic').map(m => (
                <div
                  key={m.value}
                  onClick={() => set('businessMode', m.value)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1px solid ${form.businessMode === m.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.businessMode === m.value ? 'var(--primary-dim)' : 'var(--bg-overlay)',
                    transition: 'all 0.15s',
                    opacity: 0.85,
                  }}
                >
                  <div style={{ fontSize: '1rem', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  {form.businessMode === m.value && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>● Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Payment config */}
        <PaymentSection bizData={bizData} />
      </div>
    </div>
  );
}

function PaymentSection({ bizData }) {
  const [form, setForm]   = useState({ enabled: false, requireProof: true, wavePhone: '', currency: 'GMD', paymentInstructions: '' });
  const [loading, setLoading] = useState(!bizData);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    // If parent already fetched business data, use it directly (avoids a second GET /business call)
    if (bizData) {
      const p = bizData.payment || {};
      const custMsg = bizData.customMessages || {};
      setForm({
        enabled:             p.enabled === true,
        requireProof:        p.requireProof !== false,
        wavePhone:           p.wavePhone || '',
        currency:            p.currency || 'GMD',
        paymentInstructions: custMsg.paymentInstructions || '',
      });
      setLoading(false);
      return;
    }
    // Fallback: fetch independently if no parent data (e.g. used standalone)
    businessApi.get().then(res => {
      const p = res.data?.business?.payment || {};
      const custMsg = res.data?.business?.customMessages || {};
      setForm({
        enabled:             p.enabled === true,
        requireProof:        p.requireProof !== false,
        wavePhone:           p.wavePhone || '',
        currency:            p.currency || 'GMD',
        paymentInstructions: custMsg.paymentInstructions || '',
      });
    }).finally(() => setLoading(false));
  }, [bizData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { paymentInstructions, ...paymentFields } = form;
      // paymentFields now includes: enabled, requireProof, wavePhone, currency (added in v2)
      // Run sequentially so a partial save doesn't commit one side without the other.
      await businessApi.updateSettings({ payment: paymentFields });
      if (paymentInstructions !== undefined) {
        await businessApi.updateMessages({ paymentInstructions });
      }
      toast.success('Payment settings saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed — check your connection and try again');
    } finally { setSaving(false); }
  };

  if (loading) return null;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <SectionTitle sub="Controls how customers pay for orders through the bot">Payment & Wave</SectionTitle>
        <Button size="sm" loading={saving} onClick={save}><Save size={13} /> Save</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* CRITICAL: payment.enabled is the master gate for Wave payment flow.
            Without enabled=true the bot NEVER shows payment instructions or
            requests screenshots, regardless of other settings. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: form.enabled ? 'var(--green-dim)' : 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: `1px solid ${form.enabled ? 'rgba(37,162,68,0.25)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: form.enabled ? 'var(--green)' : 'var(--text-primary)' }}>
              Enable Wave payment
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Master switch — must be ON for the bot to collect payments.
              Maps to <code style={{ color: 'var(--primary)' }}>payment.enabled</code> in BusinessConfig.
            </div>
          </div>
          <Toggle checked={form.enabled} onChange={v => set('enabled', v)} />
        </div>

        {form.enabled && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={form.requireProof} onChange={e => set('requireProof', e.target.checked)} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Require payment screenshot</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  When on, customers must send a Wave screenshot before the order is confirmed.
                  When off, they tap "DONE" after paying.
                </div>
              </div>
            </label>
            <Grid cols={2} gap={14}>
              <Field label="Wave payment number" hint="Displayed to customers during checkout">
                <input value={form.wavePhone} onChange={e => set('wavePhone', e.target.value)} placeholder="+220 353 2423" />
              </Field>
              <Field label="Currency code" hint="Used to format order totals shown to customers (e.g. GMD, USD, NGN)">
                <input value={form.currency} onChange={e => set('currency', e.target.value.toUpperCase())} placeholder="GMD" maxLength={4} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Field>
            </Grid>
            <Field label="Payment instructions" hint="Shown to customers after placing an order">
              <textarea value={form.paymentInstructions} onChange={e => set('paymentInstructions', e.target.value)}
                placeholder="Send payment to +220 353 2423 on Wave, then send a screenshot here." />
            </Field>
          </>
        )}

        {!form.enabled && (
          <div style={{ padding: '12px 16px', background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Wave payment is <strong>disabled</strong>. Orders will complete without any payment collection.
            Enable the toggle above to activate Wave payment flow.
          </div>
        )}
      </div>
    </Card>
  );
}
