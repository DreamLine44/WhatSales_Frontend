import { useEffect, useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { business as businessApi } from '../services/api';
import {
  PageHeader, Card, Button, Field, SectionTitle, Toggle, Spinner, Grid
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

/**
 * Maps exactly to BusinessConfig.hours:
 *   enabled  — hours.enabled (bool): when false, bot always responds (isWithinBusinessHours returns true)
 *   timezone — hours.timezone: used by Intl.DateTimeFormat in isWithinBusinessHours()
 *   open     — hours.open (decimal hour, e.g. 9 = 9:00am): default open hour
 *   close    — hours.close (decimal hour, e.g. 22 = 10:00pm): default close hour
 *   days     — hours.days: per-day overrides { monday: { open, close, closed }, ... }
 *              matches the daysObj normalisation in isWithinBusinessHours()
 */
const DAY_NAMES = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const DEFAULT_DAYS = Object.fromEntries(
  DAY_NAMES.map(d => [d, { open: 9, close: 22, closed: false, override: false }])
);

function defaultHours() {
  return { enabled: false, timezone: 'UTC', open: 9, close: 22, days: DEFAULT_DAYS };
}

export default function HoursPage() {
  const [form, setForm]       = useState(defaultHours());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    businessApi.get()
      .then(res => {
        const h = res.data?.business?.hours;
        if (!h) return;
        // Merge stored days with defaults so all 7 days are always present
        const mergedDays = { ...DEFAULT_DAYS };
        if (h.days) {
          Object.entries(h.days).forEach(([day, cfg]) => {
            mergedDays[day] = { ...DEFAULT_DAYS[day], ...cfg };
          });
        }
        setForm({
          enabled:  h.enabled  ?? false,
          timezone: h.timezone || 'UTC',
          open:     h.open     ?? 9,
          close:    h.close    ?? 22,
          days:     mergedDays,
        });
      })
      .catch(() => toast.error('Failed to load hours'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setDay = (day, k, v) => setForm(f => ({
    ...f,
    days: { ...f.days, [day]: { ...f.days[day], [k]: v } },
  }));

  const save = async () => {
    if (form.open >= form.close) {
      toast.error('Default opening time must be before closing time');
      return;
    }
    // Validate per-day override times
    for (const [day, cfg] of Object.entries(form.days)) {
      if (cfg.override && !cfg.closed) {
        const open  = cfg.open  ?? form.open;
        const close = cfg.close ?? form.close;
        if (open >= close) {
          toast.error(`${day.charAt(0).toUpperCase() + day.slice(1)}: custom open time must be before close time`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      // Strip custom open/close from days where override is off —
      // backend isWithinBusinessHours() checks for presence of values,
      // NOT the override flag. Stale values would be applied silently.
      const cleanDays = {};
      for (const [day, cfg] of Object.entries(form.days)) {
        if (cfg.override) {
          cleanDays[day] = { open: cfg.open, close: cfg.close, closed: cfg.closed, override: true };
        } else {
          cleanDays[day] = { closed: cfg.closed, override: false };
        }
      }
      await businessApi.updateHours({ ...form, days: cleanDays });
      // Sync in-memory form.days with what was actually saved so stale
      // open/close values don't persist in non-override day inputs.
      const mergedAfterSave = {};
      for (const [d, v] of Object.entries(cleanDays)) {
        mergedAfterSave[d] = { ...DEFAULT_DAYS[d], ...v };
      }
      setForm(f => ({ ...f, days: mergedAfterSave }));
      toast.success('Business hours saved ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const decimalToTime = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec - h) * 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const timeToDec = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Opening Hours"
        subtitle="The bot automatically replies with your closed message outside these hours"
        action={<Button loading={saving} onClick={save}><Save size={15} /> Save</Button>}
      />

      {/* Enable toggle */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>Enable hours enforcement</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              When on, the bot checks the time before responding. When off, it always replies regardless of time.
              Matches the <code style={{ color: 'var(--primary)' }}>hours.enabled</code> flag in <code style={{ color: 'var(--primary)' }}>isWithinBusinessHours()</code>.
            </div>
          </div>
          <Toggle checked={form.enabled} onChange={v => set('enabled', v)} />
        </div>
      </Card>

      {form.enabled && (
        <>
          {/* Default hours + timezone */}
          <Card style={{ marginBottom: 20 }}>
            <SectionTitle sub="Applied to any day that doesn't have a custom override below">Default Hours</SectionTitle>
            <Grid cols={3} gap={16}>
              <Field label="Timezone" hint="Matched against Intl.DateTimeFormat in the bot">
                <select value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                  <option value="UTC">UTC</option>
                  <option value="Africa/Banjul">Africa/Banjul (GMT)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
                  <option value="Africa/Accra">Africa/Accra (GMT)</option>
                  <option value="Africa/Dakar">Africa/Dakar (GMT)</option>
                  <option value="Africa/Abidjan">Africa/Abidjan (GMT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </Field>
              <Field label="Default open" hint="hours.open (decimal hour)">
                <input
                  type="time"
                  value={decimalToTime(form.open)}
                  onChange={e => set('open', timeToDec(e.target.value))}
                />
              </Field>
              <Field label="Default close" hint="hours.close (decimal hour)">
                <input
                  type="time"
                  value={decimalToTime(form.close)}
                  onChange={e => set('close', timeToDec(e.target.value))}
                />
              </Field>
            </Grid>
          </Card>

          {/* Per-day overrides — map to hours.days[day] */}
          <Card>
            <SectionTitle sub="Override specific days — useful for Sundays, half-days, or holidays">Per-day Overrides</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DAY_NAMES.map(day => {
                const d = form.days[day] || {};
                return (
                  <div key={day} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr auto',
                    gap: 12, alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    opacity: d.closed ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{DAY_LABELS[day]}</span>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={d.override || false}
                        onChange={e => setDay(day, 'override', e.target.checked)}
                      />
                      Custom hours
                    </label>

                    {d.override && !d.closed ? (
                      <>
                        <input
                          type="time"
                          value={decimalToTime(d.open ?? form.open)}
                          onChange={e => setDay(day, 'open', timeToDec(e.target.value))}
                          disabled={d.closed}
                        />
                        <input
                          type="time"
                          value={decimalToTime(d.close ?? form.close)}
                          onChange={e => setDay(day, 'close', timeToDec(e.target.value))}
                          disabled={d.closed}
                        />
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {d.closed ? '—' : `${decimalToTime(form.open)} – ${decimalToTime(form.close)}`}
                        </div>
                        <div />
                      </>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: d.closed ? 'var(--red)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={d.closed || false}
                        onChange={e => setDay(day, 'closed', e.target.checked)}
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Explanation banner */}
          <Card style={{ marginTop: 20, background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-primary)' }}>How the bot uses these hours:</strong><br />
              Before responding to any message, <code>isWithinBusinessHours()</code> checks:
              <ol style={{ marginLeft: 18, marginTop: 6 }}>
                <li>If <code>hours.enabled</code> is false → always open</li>
                <li>If today's day config has <code>closed: true</code> → closed</li>
                <li>If today's day config has a custom <code>open/close</code> → use those</li>
                <li>Otherwise falls back to default <code>open/close</code> hours</li>
              </ol>
              Minutes are respected (e.g. 9:30am open means the bot is closed at 9:15am).
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
