import { useEffect, useState } from 'react';
import { Save, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import { business as businessApi } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { getDefaultFlow } from '../data/defaultFlows';
import {
  PageHeader, Card, Button, Spinner, SectionTitle
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const FIELDS = [
  {
    key: 'welcomeMessage',
    label: 'Welcome message',
    hint: 'Sent when a customer first messages you, or types "hi".',
    field: 'textarea',
  },
  {
    key: 'closed',
    label: 'Closed message',
    hint: 'Sent when a customer messages outside your business hours.',
    field: 'textarea',
  },
  {
    key: 'loopFallback',
    label: 'Loop break message',
    hint: 'Sent when the bot detects the same message 3 times in a row. The main menu is appended automatically.',
    field: 'textarea',
  },
  {
    key: 'fallback',
    label: 'Fallback message',
    hint: 'Sent when the bot can\'t understand what the customer wants.',
    field: 'input',
  },
];

export default function BotConfigPage() {
  const { tenant } = useAuth();
  const businessMode = tenant?.businessMode || 'GENERIC';

  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [isEmpty, setIsEmpty]   = useState(false);
  const [applied, setApplied]   = useState(false);

  useEffect(() => {
    businessApi.get()
      .then(res => {
        const m = res.data?.business?.customMessages || {};
        const loaded = {
          welcomeMessage: m.welcomeMessage || '',
          closed:         m.closed         || '',
          loopFallback:   m.loopFallback   || '',
          fallback:       m.fallback       || '',
        };
        setForm(loaded);
        // Detect if tenant has never configured anything
        const allEmpty = Object.values(loaded).every(v => !v.trim());
        setIsEmpty(allEmpty);
      })
      .catch(() => toast.error('Failed to load bot config'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const applyDefaults = (confirm = false) => {
    const hasContent = Object.values(form).some(v => v.trim());
    if (hasContent && !confirm) {
      // Ask before overwriting
      if (!window.confirm('Apply default template? This will replace your current messages.')) return;
    }
    const flow = getDefaultFlow(businessMode);
    setForm({ ...flow.messages });
    setIsEmpty(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
    toast.success(`Default ${flow.label} template applied — save to keep it!`);
  };

  const save = async () => {
    setSaving(true);
    try {
      await businessApi.updateMessages(form);
      setIsEmpty(false);
      toast.success('Bot messages saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const flow = getDefaultFlow(businessMode);

  return (
    <div className="fade-in">
      <PageHeader
        title="Bot Messages"
        subtitle="What your bot says in key situations"
        action={<Button loading={saving} onClick={save}><Save size={15} /> Save All</Button>}
      />

      {/* Auto-suggest banner for first-time setup */}
      {isEmpty && (
        <Card style={{ marginBottom: 20, background: 'var(--primary-dim)', border: '1.5px solid rgba(30,138,66,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2rem', flexShrink: 0 }}>✨</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: 3 }}>
                Start with a ready-made {flow.label} template
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Pre-written messages built for your business type — working out of the box, customise anytime.
              </div>
            </div>
            <Button onClick={() => applyDefaults(true)} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              <Sparkles size={14} /> Apply template
            </Button>
          </div>
        </Card>
      )}

      {/* Manual template button when not empty */}
      {!isEmpty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button variant="secondary" size="sm" onClick={() => applyDefaults(false)}>
            {applied ? <><CheckCircle size={13} color="var(--green)" /> Applied!</> : <><Sparkles size={13} /> Use {flow.label} template</>}
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {FIELDS.map(({ key, label, hint, field }) => (
          <Card key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{hint}</div>
              </div>
              {form[key] && (
                <button
                  onClick={() => set(key, '')}
                  style={{ background: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flexShrink: 0 }}
                >
                  <RefreshCw size={11} /> Clear
                </button>
              )}
            </div>

            {field === 'textarea' ? (
              <textarea
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={getDefaultFlow(businessMode).messages[key]}
                style={{ minHeight: 100 }}
              />
            ) : (
              <input
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={getDefaultFlow(businessMode).messages[key]}
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Button loading={saving} onClick={save}><Save size={15} /> Save All</Button>
      </div>
    </div>
  );
}

function WhatsAppBubble({ text }) {
  return (
    <div style={{
      background: 'var(--bg-overlay)', border: '1px solid var(--border)',
      borderRadius: '0 12px 12px 12px', padding: '10px 14px',
      fontSize: '0.87rem', color: 'var(--text-primary)',
      lineHeight: 1.55, whiteSpace: 'pre-wrap', maxWidth: 420, position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: -8, width: 0, height: 0, borderTop: '8px solid var(--border)', borderLeft: '8px solid transparent' }} />
      {text}
    </div>
  );
}
