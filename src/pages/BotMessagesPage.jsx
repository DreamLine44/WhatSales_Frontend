import { useEffect, useState } from 'react';
import { Bot, Save, Info } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const MESSAGE_FIELDS = [
  { key: 'welcome',   label: 'Welcome Message',  desc: 'Sent when a customer first messages', placeholder: 'Welcome! How can I help you today?' },
  { key: 'fallback',  label: 'Fallback Message',  desc: "Sent when the bot doesn't understand", placeholder: 'Sorry, I didn\'t understand. Can you try again?' },
  { key: 'cancelMsg', label: 'Cancel Message',    desc: 'Sent when an order or booking is cancelled', placeholder: 'No problem! Let us know if you need anything.' },
  { key: 'closedMsg', label: 'Closed Message',    desc: 'Sent when outside opening hours', placeholder: 'We are currently closed. Please message us during business hours.' },
  { key: 'orderConfirmation', label: 'Order Confirmation', desc: 'Sent after an order is placed', placeholder: 'Your order has been received! We\'ll confirm shortly.' },
];

export default function BotMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msgs, setMsgs] = useState({});

  useEffect(() => {
    dashApi.settings()
      .then(r => setMsgs(r.data.business?.customMessages || {}))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await dashApi.updateSettings({ customMessages: msgs });
      toast.success('Bot messages saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Bot} title="Bot Messages" subtitle="Customize what your AI assistant says" />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: 'var(--blue-dim)', border: '1.5px solid rgba(37,99,235,0.15)', borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
        <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.83rem', color: 'var(--blue)', lineHeight: 1.5 }}>
          Leave fields blank to use the default messages for your business type. Custom messages take full priority over defaults.
        </p>
      </div>

      <Card style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {MESSAGE_FIELDS.map(field => (
            <div key={field.key}>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>{field.label}</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{field.desc}</span>
              </div>
              <textarea
                value={msgs[field.key] || ''}
                onChange={e => setMsgs(m => ({ ...m, [field.key]: e.target.value }))}
                rows={2}
                placeholder={field.placeholder}
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-mid)'}
              />
            </div>
          ))}

          <Btn onClick={save} loading={saving}><Save size={15} /> Save Messages</Btn>
        </div>
      </Card>
    </div>
  );
}
