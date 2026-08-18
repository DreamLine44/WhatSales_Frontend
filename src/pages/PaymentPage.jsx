import { useEffect, useState } from 'react';
import { Wallet, Save, Plus, Trash2, Star, CreditCard } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Input, Btn, Spinner, Toggle, SectionHeading, InfoBanner, EmptyState } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// [SETUP-PAYMENT-1] BusinessConfig.payment (enabled, currency, requireProof,
// channels[]) has full backend support — read by getBusinessSettings,
// writable via updateBusinessSettings's field whitelist, and consumed by
// paymentService.js / orderFlow.js to render provider-appropriate payment
// instructions to customers — but had no frontend page at all until now.
// Every tenant on the platform accepts payment purely through screenshot +
// manual admin confirmation (no live gateway), so what's configured here is
// literally the list of accounts customers are told to pay into.

const PROVIDER_SUGGESTIONS = ['Wave', 'GT Bank', 'EcoBank', 'Trust Bank', 'Bank Transfer', 'Cash on Delivery'];

function ChannelRow({ channel, onChange, onRemove, onMakeDefault }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10,
      padding: '12px 14px', background: 'var(--bg-overlay)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-md)',
    }}>
      <Input
        label="Provider" wrapStyle={{ flex: '1 1 140px' }}
        value={channel.provider} placeholder="e.g. Wave"
        list="ws-provider-suggestions"
        onChange={e => onChange({ ...channel, provider: e.target.value })}
      />
      <Input
        label="Account / Phone number" wrapStyle={{ flex: '1 1 160px' }}
        value={channel.accountNo} placeholder="e.g. 220 xxx xxxx"
        onChange={e => onChange({ ...channel, accountNo: e.target.value })}
      />
      <Input
        label="Label (optional)" wrapStyle={{ flex: '1 1 140px' }}
        value={channel.label} placeholder="e.g. Main till"
        onChange={e => onChange({ ...channel, label: e.target.value })}
      />
      <div style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
        <button
          type="button" onClick={onMakeDefault} title={channel.isDefault ? 'Default account' : 'Make default'}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '9px 11px', borderRadius: 'var(--r-md)',
            border: `1.5px solid ${channel.isDefault ? 'var(--border-accent)' : 'var(--border-mid)'}`,
            background: channel.isDefault ? 'var(--primary-dim)' : 'var(--bg-surface)',
            color: channel.isDefault ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}
        >
          <Star size={13} fill={channel.isDefault ? 'currentColor' : 'none'} /> Default
        </button>
        <button type="button" onClick={onRemove} title="Remove account"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
            borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-mid)', background: 'var(--bg-surface)',
            color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [enabled, setEnabled]         = useState(false);
  const [currency, setCurrency]       = useState('GMD');
  const [requireProof, setRequireProof] = useState(true);
  const [channels, setChannels]       = useState([]);

  useEffect(() => {
    bizApi.getSettings()
      .then(r => {
        const p = r.data?.business?.payment || {};
        setEnabled(!!p.enabled);
        setCurrency(p.currency || 'GMD');
        setRequireProof(p.requireProof !== false);
        setChannels((p.channels || []).map(c => ({ ...c })));
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addChannel = () => {
    setChannels(cs => [...cs, { provider: '', accountNo: '', label: '', isDefault: cs.length === 0 }]);
  };

  const updateChannel = (idx, next) => {
    setChannels(cs => cs.map((c, i) => (i === idx ? next : c)));
  };

  const removeChannel = (idx) => {
    setChannels(cs => {
      const wasDefault = cs[idx]?.isDefault;
      const next = cs.filter((_, i) => i !== idx);
      // Keep exactly one default account when the removed one held that role.
      if (wasDefault && next.length > 0 && !next.some(c => c.isDefault)) next[0].isDefault = true;
      return next;
    });
  };

  const makeDefault = (idx) => {
    setChannels(cs => cs.map((c, i) => ({ ...c, isDefault: i === idx })));
  };

  const save = async () => {
    const cleaned = channels
      .map(c => ({ ...c, provider: c.provider.trim(), accountNo: c.accountNo.trim(), label: (c.label || '').trim() }))
      .filter(c => c.provider && c.accountNo);
    if (enabled && cleaned.length === 0) {
      toast.error('Add at least one payment account, or turn payments off');
      return;
    }
    // Guarantee exactly one default when any accounts exist.
    if (cleaned.length > 0 && !cleaned.some(c => c.isDefault)) cleaned[0].isDefault = true;

    setSaving(true);
    try {
      await bizApi.updateSettings({
        payment: {
          enabled,
          currency: currency.trim() || 'GMD',
          requireProof,
          channels: cleaned,
        },
      });
      setChannels(cleaned);
      toast.success('Payment settings saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Wallet} title="Payment" subtitle="Accounts customers pay into via WhatsApp" />

      <datalist id="ws-provider-suggestions">
        {PROVIDER_SUGGESTIONS.map(p => <option key={p} value={p} />)}
      </datalist>

      <div className="settings-2col">
        <Card>
          <SectionHeading action={<Btn size="xs" variant="soft" onClick={addChannel}><Plus size={13} /> Add Account</Btn>}>
            Payment Accounts
          </SectionHeading>

          {!enabled && (
            <InfoBanner type="info" style={{ marginBottom: 14 }}>
              Payments are currently off — turn on "Accept Payments" to have these accounts shown to customers.
            </InfoBanner>
          )}

          {channels.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment accounts yet"
              description="Add a Wave number, bank account, or other channel customers can pay into. They'll send a screenshot as proof."
              action={<Btn size="sm" onClick={addChannel}><Plus size={14} /> Add first account</Btn>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {channels.map((c, idx) => (
                <ChannelRow
                  key={idx}
                  channel={c}
                  onChange={next => updateChannel(idx, next)}
                  onRemove={() => removeChannel(idx)}
                  onMakeDefault={() => makeDefault(idx)}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            No live payment gateway is used — customers send money directly to one of these accounts, then share a
            screenshot in chat. An admin confirms the payment before the order proceeds.
          </div>

          <Btn onClick={save} loading={saving} style={{ marginTop: 16 }}>
            <Save size={15} /> Save Payment Settings
          </Btn>
        </Card>

        <Card>
          <SectionHeading>General</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label="Accept Payments"
              hint="When off, customers place orders without a payment step"
            />
            <Input
              label="Currency" value={currency}
              onChange={e => setCurrency(e.target.value)}
              placeholder="GMD" hint="Shown next to every price"
            />
            <Toggle
              checked={requireProof}
              onChange={setRequireProof}
              label="Require Payment Proof"
              hint="Customer must send a screenshot before an order is confirmed by an admin"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
