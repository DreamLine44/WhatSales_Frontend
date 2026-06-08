import { useEffect, useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { bizApi } from '../api.js';
import { PageHeader, Card, Btn, Spinner, Select, Toggle } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return { value: i, label: `${h}:00 ${ampm}` };
});
const TIMEZONES = [
  'UTC','Africa/Banjul','Africa/Lagos','Africa/Abidjan','Africa/Accra',
  'Africa/Nairobi','Europe/London','Europe/Paris','America/New_York',
  'America/Los_Angeles','Asia/Dubai',
];
const DAY_LABELS = { monday:'Mon',tuesday:'Tue',wednesday:'Wed',thursday:'Thu',friday:'Fri',saturday:'Sat',sunday:'Sun' };

export default function OpeningHoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [hours, setHours]     = useState({ enabled: false, timezone: 'UTC', open: 8, close: 22, days: {} });

  useEffect(() => {
    // Step 6: GET /business/:id — returns full business config including hours
    bizApi.get()
      .then(r => {
        const biz = r.data.business || r.data || {};
        const h = biz.hours || {};
        setHours({
          enabled:  h.enabled  || false,
          timezone: h.timezone || 'UTC',
          open:     h.open     ?? 8,
          close:    h.close    ?? 22,
          days:     h.days     || {},
        });
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day) => {
    setHours(h => {
      const days = { ...h.days };
      if (days[day]) delete days[day];
      else days[day] = { open: h.open, close: h.close };
      return { ...h, days };
    });
  };

  const isDayActive = (day) => hours.days[day] !== undefined && hours.days[day] !== null;

  const save = async () => {
    setSaving(true);
    try {
      // PATCH /dashboard/:id/settings — partial update, only sends the hours key.
      // Previously used PUT /business/:id which replaces the whole document and
      // would silently drop any fields not included in this payload.
      await bizApi.updateSettings({ hours });
      toast.success('Opening hours saved');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>;

  return (
    <div className="fade-in">
      <PageHeader icon={Clock} title="Opening Hours" subtitle="Configure when your bot accepts orders" />

      <Card style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ paddingBottom: 18, borderBottom: '1.5px solid var(--border)' }}>
            <Toggle
              checked={hours.enabled}
              onChange={v => setHours(h => ({ ...h, enabled: v }))}
              label="Enforce Opening Hours"
              hint="Bot only accepts orders during your configured hours"
            />
          </div>

          {hours.enabled && (
            <>
              <Select label="Timezone" value={hours.timezone} onChange={e => setHours(h => ({ ...h, timezone: e.target.value }))}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </Select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Select label="Default Open" value={hours.open} onChange={e => setHours(h => ({ ...h, open: Number(e.target.value) }))}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </Select>
                <Select label="Default Close" value={hours.close} onChange={e => setHours(h => ({ ...h, close: Number(e.target.value) }))}>
                  {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                </Select>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>Active Days</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DAYS.map(day => {
                    const active = isDayActive(day);
                    return (
                      <button key={day} onClick={() => toggleDay(day)} style={{
                        padding: '7px 14px', borderRadius: 'var(--r-full)',
                        border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border-mid)'}`,
                        cursor: 'pointer', fontSize: '0.815rem', fontWeight: 700,
                        background: active ? 'var(--primary)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}>
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Btn onClick={save} loading={saving} style={{ alignSelf: 'flex-start' }}>
            <Save size={15} /> Save Hours
          </Btn>
        </div>
      </Card>
    </div>
  );
}
