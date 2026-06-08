import { useEffect, useState } from 'react';
import { Bot, Save } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, Spinner, InfoBanner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const MESSAGE_FIELDS = [
  { key: 'welcome',           label: 'Welcome Message',    desc: 'Sent when a customer first messages',           placeholder: 'Welcome! How can I help you today?' },
  { key: 'fallback',          label: 'Fallback Message',   desc: "Sent when the bot doesn't understand",          placeholder: "Sorry, I didn't understand. Can you try again?" },
  { key: 'cancelMsg',         label: 'Cancel Message',     desc: 'Sent when an order or booking is cancelled',    placeholder: 'No problem! Let us know if you need anything.' },
  { key: 'closedMsg',         label: 'Closed Message',     desc: 'Sent when outside opening hours',               placeholder: 'We are currently closed. Please message us during business hours.' },
  { key: 'orderConfirmation', label: 'Order Confirmation', desc: 'Sent after an order is placed',                 placeholder: "Your order has been received! We'll confirm shortly." },
];

function MessageField({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>{field.label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{field.desc}</div>
      </div>
      <textarea
        value={value || ''} onChange={e => onChange(e.target.value)}
        rows={2} placeholder={field.placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 13px',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border-mid)'}`,
          borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
          resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
        }}
      />
    </div>
  );
}

export default function BotMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msgs, setMsgs]       = useState({});

  useEffect(() => {
    // Step 6: GET /business/:id — customMessages are part of the business document
    bizApi.get()
      .then(r => {
        const biz = r.data.business || r.data || {};
        setMsgs(biz.customMessages || {});
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // PATCH /dashboard/:id/settings — partial update, only sends the customMessages key.
      // Previously used PUT /business/:id which replaces the whole document and
      // would silently drop any fields not included in this payload.
      await bizApi.updateSettings({ customMessages: msgs });
      toast.success('Bot messages saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Bot} title="Bot Messages" subtitle="Customize what your AI assistant says" />

      <InfoBanner type="info" style={{ marginBottom: 20 }}>
        Leave fields blank to use the default messages for your business type. Custom messages take full priority over defaults.
      </InfoBanner>

      <Card style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {MESSAGE_FIELDS.map(field => (
            <MessageField
              key={field.key}
              field={field}
              value={msgs[field.key]}
              onChange={v => setMsgs(m => ({ ...m, [field.key]: v }))}
            />
          ))}
          <Btn onClick={save} loading={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={15} /> Save Messages
          </Btn>
        </div>
      </Card>
    </div>
  );
}
