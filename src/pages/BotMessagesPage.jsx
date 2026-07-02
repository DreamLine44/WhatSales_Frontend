import { useEffect, useState } from 'react';
import { Bot, Save } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, Spinner, InfoBanner, SectionHeading } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// [FIX-BOTMSG-SCHEMA] Field keys now match BusinessConfig.customMessages exactly
// (see models/BusinessConfig.js). The previous version used keys that don't exist
// on the schema at all (welcome, closedMsg, orderConfirmation) — every "save" was
// silently dropped by Mongoose strict mode, and the Setup Status "Bot Messages"
// checklist item could never be marked done. Fields are grouped to match how the
// bot actually uses them (see comments in the schema + webhookController).
const FIELD_GROUPS = [
  {
    heading: 'Greetings & Fallbacks',
    fields: [
      { key: 'welcomeMessage', label: 'Welcome Message', desc: 'Sent when a customer first messages', placeholder: 'Welcome! How can I help you today?' },
      { key: 'fallback',       label: 'Fallback Message', desc: "Sent when the bot doesn't understand the customer's message", placeholder: "Sorry, I didn't understand. Can you try again?" },
      { key: 'loopFallback',   label: 'Loop Recovery Message', desc: 'Sent when a customer repeats the same message 3+ times in a row', placeholder: "Let's start over — what would you like to do?" },
      { key: 'humanMode',      label: 'Human Mode Message', desc: 'Sent when a human takes over the conversation, so the customer knows to expect a person', placeholder: "You're now chatting with a member of our team." },
    ],
  },
  {
    heading: 'Orders & Bookings',
    fields: [
      { key: 'afterOrder',     label: 'After Order Message',   desc: 'Sent right after an order is placed', placeholder: "Your order has been received! We'll confirm shortly." },
      { key: 'afterBooking',   label: 'After Booking Message', desc: 'Sent right after a booking is made', placeholder: 'Your booking request has been received!' },
      { key: 'cancelMsg',      label: 'Cancel Message',        desc: 'Sent when an order or booking is cancelled', placeholder: 'No problem! Let us know if you need anything.' },
    ],
  },
  {
    heading: 'Payment',
    fields: [
      { key: 'payment',             label: 'Payment Message',       desc: 'General payment message shown to the customer', placeholder: 'Please complete your payment to confirm your order.' },
      { key: 'paymentInstructions', label: 'Payment Instructions',  desc: 'Detailed instructions for how to pay (Wave, bank transfer, etc.)', placeholder: 'Send payment to Wave number 220-XXX-XXXX and share a screenshot.' },
    ],
  },
  {
    heading: 'Business Hours',
    fields: [
      { key: 'closed',   label: 'Closed Message',   desc: 'Sent when a customer messages outside your opening hours', placeholder: 'We are currently closed. Please message us during business hours.' },
      { key: 'reopened', label: 'Reopened Message', desc: "Sent to a customer who messages again after you've reopened", placeholder: "We're back open! How can we help you today?" },
    ],
  },
  {
    heading: 'Flow Prompts',
    fields: [
      { key: 'orderPrompt',   label: 'Order Prompt',   desc: 'Overrides the default prompt shown when starting an order (leave blank for smart default)', placeholder: 'What would you like to order?' },
      { key: 'bookPrompt',    label: 'Booking Prompt',  desc: 'Overrides the default prompt shown when starting a booking', placeholder: 'What would you like to book?' },
      { key: 'servicePrompt', label: 'Service Prompt',  desc: 'Overrides the prompt shown when selecting a service', placeholder: 'Which service are you interested in?' },
      { key: 'timePrompt',    label: 'Time Prompt',     desc: 'Overrides the prompt shown when selecting a time', placeholder: 'What time works best for you?' },
    ],
  },
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
    // GET /business/:id — customMessages are part of the business document
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
        {FIELD_GROUPS.map(group => (
          <Card key={group.heading}>
            <SectionHeading>{group.heading}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {group.fields.map(field => (
                <MessageField
                  key={field.key}
                  field={field}
                  value={msgs[field.key]}
                  onChange={v => setMsgs(m => ({ ...m, [field.key]: v }))}
                />
              ))}
            </div>
          </Card>
        ))}

        <Btn onClick={save} loading={saving} style={{ alignSelf: 'flex-start' }}>
          <Save size={15} /> Save Messages
        </Btn>
      </div>
    </div>
  );
}
