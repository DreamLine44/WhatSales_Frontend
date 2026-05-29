import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { business as businessApi } from '../services/api';
import {
  PageHeader, Card, Button, Spinner
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

/**
 * Maps to BusinessConfig.customMessages:
 *   welcomeMessage  — shown by moduleRouter GREET case
 *   closed   — shown by webhookController step 5 (hours enforcement)
 *              backend reads customMessages.closed (NOT closedMessage)
 *              webhookController.js line 331: business?.customMessages?.closed
 *   loopFallback    — shown by checkAndHandleLoop() when MAX_LOOP reached
 *   fallback        — shown by moduleRouter FALLBACK/CLARIFY case
 *
 * NOTE: The closed message key is 'closed' — backend reads customMessages.closed
 * (webhookController.js:331). Do NOT rename to 'closedMessage' — that is a
 * different legacy fallback field and the bot will not read it.
 */
const FIELDS = [
  {
    key: 'welcomeMessage',
    label: 'Welcome message',
    hint: 'Shown when a customer first messages you, or types "hi". Leave blank to use the AI-generated greeting.',
    placeholder: '👋 Welcome to Mariama\'s Kitchen! How can I help you today?',
    field: 'textarea',
  },
  {
    key: 'closed',  // backend reads customMessages.closed — NOT closedMessage
    label: 'Closed message',
    hint: 'Shown when a customer messages outside your configured business hours (requires Hours to be enabled).',
    placeholder: '⏰ We\'re currently closed. Our hours are Mon–Sat 9am–9pm. We\'ll be back soon! 🙏',
    field: 'textarea',
  },
  {
    key: 'loopFallback',
    label: 'Loop break message',
    hint: 'Shown when the bot detects a customer sending the same message 3 times in a row (loop prevention). The main menu buttons are appended automatically.',
    placeholder: 'I noticed we keep going in circles! Let me take you back to the main menu. 😊',
    field: 'textarea',
  },
  {
    key: 'fallback',
    label: 'Fallback / AI reply message',
    hint: 'Shown when the bot can\'t understand what the customer wants and falls back to the AI. Leave blank to use the mode default.',
    placeholder: 'How can I help you today? 😊',
    field: 'input',
  },
];

export default function BotConfigPage() {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    businessApi.get()
      .then(res => {
        const m = res.data?.business?.customMessages || {};
        setForm({
          welcomeMessage: m.welcomeMessage || '',
          // backend reads customMessages.closed (webhookController.js:331)
          closed:  m.closed  || '',
          loopFallback:   m.loopFallback   || '',
          fallback:       m.fallback       || '',
        });
      })
      .catch(() => toast.error('Failed to load bot config'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await businessApi.updateMessages(form);
      toast.success('Bot messages saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const reset = (key) => set(key, '');

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Bot Messages"
        subtitle="Customise what your WhatsApp bot says in key situations"
        action={<Button loading={saving} onClick={save}><Save size={15} /> Save All</Button>}
      />

      <Card style={{ marginBottom: 24, background: 'var(--blue-dim)', border: '1px solid rgba(108,156,255,0.25)', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span>💡</span>
          <div style={{ fontSize: '0.87rem', color: 'var(--blue)', lineHeight: 1.6 }}>
            All fields are optional. Leave blank to use the smart defaults built into the bot.
            Emoji are supported and encouraged — they improve customer engagement on WhatsApp.
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {FIELDS.map(({ key, label, hint, placeholder, field }) => (
          <Card key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</div>
              </div>
              {form[key] && (
                <button
                  onClick={() => reset(key)}
                  style={{ background: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flexShrink: 0 }}
                >
                  <RefreshCw size={11} /> Reset
                </button>
              )}
            </div>

            {field === 'textarea' ? (
              <textarea
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                style={{ minHeight: 88 }}
              />
            ) : (
              <input
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
              />
            )}

            {form[key] && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Preview</div>
                <WhatsAppBubble text={form[key]} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function WhatsAppBubble({ text }) {
  return (
    <div style={{
      background: 'var(--bg-overlay)',
      border: '1px solid var(--border)',
      borderRadius: '0 12px 12px 12px',
      padding: '10px 14px',
      fontSize: '0.87rem',
      color: 'var(--text-primary)',
      lineHeight: 1.55,
      whiteSpace: 'pre-wrap',
      maxWidth: 420,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: -8,
        width: 0, height: 0,
        borderTop: '8px solid var(--border)',
        borderLeft: '8px solid transparent',
      }} />
      {text}
    </div>
  );
}
