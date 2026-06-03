import { useEffect, useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, Spinner, Select } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm}` };
});

const TIMEZONES = ['UTC','Africa/Banjul','Africa/Lagos','Africa/Abidjan','Africa/Accra','Africa/Nairobi','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Asia/Dubai'];

export default function OpeningHoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState({ enabled: false, timezone: 'UTC', open: 8, close: 22, days: {} });

  useEffect(() => {
    dashApi.settings()
      .then(r => {
        const h = r.data.business?.hours || {};
        setHours({
          enabled: h.enabled || false,
          timezone: h.timezone || 'UTC',
          open: h.open ?? 8,
          close: h.close ?? 22,
          days: h.days || {},
        });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await dashApi.updateSettings({ hours });
      toast.success('Opening hours saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Clock} title="Opening Hours" subtitle="Configure when your bot accepts orders" />

      <Card style={{ maxWidth: 600 }}>
        {/* Enable toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Enforce Opening Hours</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Bot only accepts orders when you are open</div>
          </div>
          <button
            onClick={() => setHours(h => ({ ...h, enabled: !h.enabled }))}
            style={{ width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', background: hours.enabled ? 'var(--primary)' : 'var(--border-mid)', transition: 'background 0.2s', position: 'relative' }}
          >
            <span style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: hours.enabled ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        {hours.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select label="Timezone" value={hours.timezone} onChange={e => setHours(h => ({ ...h, timezone: e.target.value }))}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </Select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Default Open" value={hours.open} onChange={e => setHours(h => ({ ...h, open: Number(e.target.value) }))}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </Select>
              <Select label="Default Close" value={hours.close} onChange={e => setHours(h => ({ ...h, close: Number(e.target.value) }))}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </Select>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Days Active</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map(day => {
                  const active = hours.days[day]?.open !== undefined ? true : day !== 'sunday';
                  return (
                    <button
                      key={day}
                      onClick={() => setHours(h => ({ ...h, days: { ...h.days, [day]: active ? undefined : { open: h.open, close: h.close } } }))}
                      style={{
                        padding: '6px 14px', borderRadius: 99, border: '1.5px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize',
                        borderColor: active ? 'var(--primary)' : 'var(--border-mid)',
                        background: active ? 'var(--primary-dim)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >{day.slice(0, 3)}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Btn onClick={save} loading={saving}><Save size={15} /> Save Hours</Btn>
        </div>
      </Card>
    </div>
  );
}
