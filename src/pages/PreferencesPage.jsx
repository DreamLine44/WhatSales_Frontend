import { useEffect, useState } from 'react';
import { Settings2, Save, ShoppingBasket } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Input, Btn, Spinner, Toggle, SectionHeading, InfoBanner } from '../components/ui.jsx';
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
};

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [settings, setSettings]         = useState(DEFAULTS.settings);
  const [multiItemCart, setMultiItemCart] = useState(DEFAULTS.multiItemCart);

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
      });
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
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
      </div>

      <div style={{ marginTop: 20 }}>
        <Btn onClick={save} loading={saving}><Save size={15} /> Save Preferences</Btn>
      </div>
    </div>
  );
}
