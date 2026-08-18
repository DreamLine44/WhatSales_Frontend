import { useEffect, useState } from 'react';
import { Settings2, Save, ShoppingBasket, UserPlus } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Input, Btn, Spinner, Toggle, SectionHeading, InfoBanner, Select } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ─────────────────────────────────────────────────────────────
// BusinessConfig.settings (autoSuggestions, enableLearning, sessionTimeout,
// allowAfterHoursOrders, maxOrderQuantity, estimatedDeliveryMinutes,
// vipThreshold) and BusinessConfig.multiItemCart (enabled, maxItems) had zero
// frontend surface — and multiItemCart couldn't even be reached through the
// API at all (missing from updateBusinessSettings's field whitelist, fixed
// alongside this page). Both are plain nested objects, not their own
// sub-schema, so partial updates are flattened to dot-notation server-side —
// this page can safely send only the fields the tenant actually changed.

const DEFAULTS = {
  settings: {
    autoSuggestions: true,
    enableLearning: true,
    sessionTimeout: 30,
    allowAfterHoursOrders: true,
    maxOrderQuantity: 20,
    estimatedDeliveryMinutes: '',
    vipThreshold: 5,
  },
  multiItemCart: { enabled: false, maxItems: 10 },
  // [SETUP-LEADCAPTURE-1] BusinessConfig.leadCapture was already whitelisted
  // in updateBusinessSettings and read by leadCaptureService, but had zero
  // frontend surface — the tenant had no way to turn on "collect customer
  // name/contact before the first flow" at all. Grouped here alongside the
  // other bot-behavior toggles rather than its own nav page, since it's a
  // single small settings block, not a CRUD list like Menu or Payment.
  leadCapture: {
    enabled: false, triggerOn: 'FIRST_MESSAGE', fields: ['name', 'email'],
    promptMessage: '', thankYouMsg: '', notifyAdmin: true,
  },
};

const LEAD_FIELD_OPTIONS = ['name', 'email', 'phone', 'address'];

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [settings, setSettings]         = useState(DEFAULTS.settings);
  const [multiItemCart, setMultiItemCart] = useState(DEFAULTS.multiItemCart);
  const [leadCapture, setLeadCapture]   = useState(DEFAULTS.leadCapture);

  useEffect(() => {
    bizApi.getSettings()
      .then(r => {
        const biz = r.data?.business || {};
        setSettings({
          autoSuggestions:          biz.settings?.autoSuggestions ?? true,
          enableLearning:           biz.settings?.enableLearning ?? true,
          sessionTimeout:           biz.settings?.sessionTimeout ?? 30,
          allowAfterHoursOrders:    biz.settings?.allowAfterHoursOrders ?? true,
          maxOrderQuantity:         biz.settings?.maxOrderQuantity ?? 20,
          estimatedDeliveryMinutes: biz.settings?.estimatedDeliveryMinutes ?? '',
          vipThreshold:             biz.settings?.vipThreshold ?? 5,
        });
        setMultiItemCart({
          enabled:  biz.multiItemCart?.enabled ?? false,
          maxItems: biz.multiItemCart?.maxItems ?? 10,
        });
        setLeadCapture({
          enabled:       biz.leadCapture?.enabled ?? false,
          triggerOn:     biz.leadCapture?.triggerOn ?? 'FIRST_MESSAGE',
          fields:        biz.leadCapture?.fields?.length ? biz.leadCapture.fields : ['name', 'email'],
          promptMessage: biz.leadCapture?.promptMessage ?? '',
          thankYouMsg:   biz.leadCapture?.thankYouMsg ?? '',
          notifyAdmin:   biz.leadCapture?.notifyAdmin ?? true,
        });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await bizApi.updateSettings({
        settings: {
          autoSuggestions:          settings.autoSuggestions,
          enableLearning:           settings.enableLearning,
          sessionTimeout:           Number(settings.sessionTimeout) || 30,
          allowAfterHoursOrders:    settings.allowAfterHoursOrders,
          maxOrderQuantity:         Number(settings.maxOrderQuantity) || 20,
          estimatedDeliveryMinutes: settings.estimatedDeliveryMinutes === '' ? null : Number(settings.estimatedDeliveryMinutes),
          vipThreshold:             Number(settings.vipThreshold) || 5,
        },
        multiItemCart: {
          enabled:  multiItemCart.enabled,
          maxItems: Number(multiItemCart.maxItems) || 10,
        },
        leadCapture: {
          enabled:       leadCapture.enabled,
          triggerOn:     leadCapture.triggerOn,
          fields:        leadCapture.fields,
          promptMessage: leadCapture.promptMessage || null,
          thankYouMsg:   leadCapture.thankYouMsg || null,
          notifyAdmin:   leadCapture.notifyAdmin,
        },
      });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleLeadField = (field) => {
    setLeadCapture(lc => ({
      ...lc,
      fields: lc.fields.includes(field) ? lc.fields.filter(f => f !== field) : [...lc.fields, field],
    }));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Settings2} title="Preferences" subtitle="Fine-tune how your bot behaves" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <Card>
          <SectionHeading>Ordering Behavior</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Toggle
              checked={settings.autoSuggestions}
              onChange={v => setSettings(s => ({ ...s, autoSuggestions: v }))}
              label="Auto-Suggestions"
              hint="Bot suggests popular or related items during ordering"
            />
            <Toggle
              checked={settings.enableLearning}
              onChange={v => setSettings(s => ({ ...s, enableLearning: v }))}
              label="Bot Learning"
              hint="Bot adapts to common customer phrasing over time"
            />
            <Toggle
              checked={settings.allowAfterHoursOrders}
              onChange={v => setSettings(s => ({ ...s, allowAfterHoursOrders: v }))}
              label="Allow After-Hours Orders"
              hint="Let customers place orders outside your configured opening hours"
            />
          </div>
        </Card>

        <Card>
          <SectionHeading>Limits & Thresholds</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Session Timeout (minutes)"
              type="number" min={1}
              value={settings.sessionTimeout}
              onChange={e => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))}
              hint="How long a customer's conversation stays active with no reply"
            />
            <Input
              label="Max Order Quantity (per item)"
              type="number" min={1} max={500}
              value={settings.maxOrderQuantity}
              onChange={e => setSettings(s => ({ ...s, maxOrderQuantity: e.target.value }))}
            />
            <Input
              label="Estimated Delivery Time (minutes)"
              type="number" min={1} max={1440}
              value={settings.estimatedDeliveryMinutes}
              placeholder="Leave blank for no fixed ETA"
              onChange={e => setSettings(s => ({ ...s, estimatedDeliveryMinutes: e.target.value }))}
            />
            <Input
              label="VIP Threshold (orders)"
              type="number" min={1} max={1000}
              value={settings.vipThreshold}
              onChange={e => setSettings(s => ({ ...s, vipThreshold: e.target.value }))}
              hint="Number of completed orders before a customer is flagged VIP"
            />
          </div>
        </Card>

        <Card>
          <SectionHeading action={<ShoppingBasket size={16} color="var(--text-muted)" />}>Multi-Item Cart</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              checked={multiItemCart.enabled}
              onChange={v => setMultiItemCart(c => ({ ...c, enabled: v }))}
              label="Enable Multi-Item Cart"
              hint="Let a customer order several different items in one checkout"
            />
            <Input
              label="Max Items per Cart"
              type="number" min={1} max={50}
              value={multiItemCart.maxItems}
              disabled={!multiItemCart.enabled}
              onChange={e => setMultiItemCart(c => ({ ...c, maxItems: e.target.value }))}
            />
            {!multiItemCart.enabled && (
              <InfoBanner type="info">
                Off by default — each order carries a single item. Turn this on for customers who want to order multiple distinct items at once (e.g. a lipstick + a foundation together).
              </InfoBanner>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeading action={<UserPlus size={16} color="var(--text-muted)" />}>Lead Capture</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle
              checked={leadCapture.enabled}
              onChange={v => setLeadCapture(lc => ({ ...lc, enabled: v }))}
              label="Collect Customer Details"
              hint="Bot asks for name/contact info before starting the first order or booking"
            />
            {leadCapture.enabled && (
              <>
                <Select
                  label="When to Ask"
                  value={leadCapture.triggerOn}
                  onChange={e => setLeadCapture(lc => ({ ...lc, triggerOn: e.target.value }))}
                >
                  <option value="FIRST_MESSAGE">On first message</option>
                  <option value="AFTER_ORDER">After an order</option>
                  <option value="AFTER_BOOKING">After a booking</option>
                  <option value="MANUAL">Manual only</option>
                </Select>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 7 }}>Fields to Collect</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {LEAD_FIELD_OPTIONS.map(field => {
                      const active = leadCapture.fields.includes(field);
                      return (
                        <button key={field} type="button" onClick={() => toggleLeadField(field)}
                          style={{
                            padding: '5px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700,
                            textTransform: 'capitalize', cursor: 'pointer',
                            border: `1.5px solid ${active ? 'var(--border-accent)' : 'var(--border-mid)'}`,
                            background: active ? 'var(--primary-dim)' : 'var(--bg-surface)',
                            color: active ? 'var(--primary)' : 'var(--text-muted)',
                          }}
                        >{field}</button>
                      );
                    })}
                  </div>
                </div>
                <Input
                  label="Custom Prompt (optional)" value={leadCapture.promptMessage}
                  placeholder="Before we get started, could I get your name?"
                  onChange={e => setLeadCapture(lc => ({ ...lc, promptMessage: e.target.value }))}
                />
                <Input
                  label="Thank-You Message (optional)" value={leadCapture.thankYouMsg}
                  placeholder="Thanks! Let's get started."
                  onChange={e => setLeadCapture(lc => ({ ...lc, thankYouMsg: e.target.value }))}
                />
                <Toggle
                  checked={leadCapture.notifyAdmin}
                  onChange={v => setLeadCapture(lc => ({ ...lc, notifyAdmin: v }))}
                  label="Notify Me on New Leads"
                  hint="Get a WhatsApp alert every time a new lead is captured"
                />
              </>
            )}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn onClick={save} loading={saving}><Save size={15} /> Save Preferences</Btn>
      </div>
    </div>
  );
}
