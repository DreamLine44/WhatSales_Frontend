import { useEffect, useState } from 'react';
import { MessageSquare, UserCheck, RefreshCw, Bot, UserX } from 'lucide-react';
import { sessions as sessionsApi } from '../services/api';
import {
  PageHeader, Card, Table, Tr, Td, Button, EmptyState, Spinner, Badge, StatCard, Grid, FilterTabs
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function SessionsPage() {
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState({});
  const [filter, setFilter]           = useState('');
  const [count, setCount]             = useState({ total: 0, humanMode: null });

  // Client-side filter — no extra API call on tab switch
  const data = filter === 'human'
    ? allSessions.filter(s => s.humanMode)
    : allSessions;

  const load = async () => {
    setLoading(true);
    try {
      const allRes = await sessionsApi.list({ limit: 200 });
      const all = allRes.data?.conversations || [];
      const humanCount = all.filter(s => s.humanMode).length;
      setAllSessions(all);
      setCount({ total: all.length, humanMode: humanCount });
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  // Fetch on mount, then poll every 30s for new sessions without requiring manual refresh
  useEffect(() => {
    load();
    const interval = setInterval(() => { load(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mirrors adminCommandService resumeBot — same as "RESUME BOT <phone>"
  // Backend also sends the customer a WhatsApp notification
  const resumeBot = async (customerPhone) => {
    setActing(a => ({ ...a, [customerPhone]: 'resume' }));
    try {
      await sessionsApi.resumeBot(customerPhone);
      toast.success(`✅ Bot resumed for ${customerPhone}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume bot');
    } finally {
      setActing(a => ({ ...a, [customerPhone]: null }));
    }
  };

  // FIX: takeOver was defined in api.js but never wired to the UI.
  // Adds a "Take Over" button for bot-active sessions so agents can intercept.
  const takeOver = async (customerPhone) => {
    setActing(a => ({ ...a, [customerPhone]: 'takeover' }));
    try {
      await sessionsApi.takeOver(customerPhone);
      toast.success(`Human mode enabled for ${customerPhone} — bot silenced`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable human mode');
    } finally {
      setActing(a => ({ ...a, [customerPhone]: null }));
    }
  };

  const FILTERS = [
    { label: 'All Active', value: '' },
    { label: `Human Mode (${count.humanMode ?? '–'})`, value: 'human' },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Live Sessions"
        subtitle="Active customer conversations — manage human handoff"
        action={
          <Button variant="secondary" onClick={load} size="sm">
            <RefreshCw size={14} /> Refresh
          </Button>
        }
      />

      {/* Stats */}
      <Grid cols={3} minColWidth={160} gap={14} style={{ marginBottom: 24 }}>
        <StatCard label="Active Sessions" value={count.total}                          icon={MessageSquare} color="var(--blue)"    />
        <StatCard label="Human Mode"      value={count.humanMode} sub="Bot silenced"   icon={UserCheck}     color="var(--primary)" />
        <StatCard label="Bot Active"      value={count.humanMode !== null ? count.total - count.humanMode : '—'} sub="Automated" icon={Bot} color="var(--green)"   />
      </Grid>

      {/* Human mode banner */}
      {count.humanMode > 0 && (
        <Card style={{ marginBottom: 20, background: 'var(--primary-dim)', border: '1px solid var(--border-accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <strong>{count.humanMode}</strong> customer{count.humanMode > 1 ? 's are' : ' is'} in human-mode.
              The bot is silenced — reply directly on WhatsApp, then click <em>Resume Bot</em>.
            </span>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ marginBottom: 16 }}>
        <FilterTabs filters={FILTERS} active={filter} onChange={setFilter} />
      </div>

      <Card padding="0">
        {loading ? <Spinner /> : data.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No active sessions" body="Customer sessions appear here while they're chatting with your bot" />
        ) : (
          <Table headers={['Customer', 'Flow / Step', 'Last Seen', 'Messages', 'Mode', 'Actions']}>
            {data.map(s => (
              <Tr key={s._id || s.customerPhone}>
                <Td>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.customerPhone}</div>
                  {s.customerName && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.customerName}</div>}
                </Td>
                <Td>
                  {s.currentFlow ? (
                    <div>
                      <Badge label={s.currentFlow} color="blue" />
                      {s.step && <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginLeft: 6 }}>{s.step}</span>}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.87rem' }}>Idle</span>
                  )}
                </Td>
                <Td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                  {s.lastSeen ? formatDistanceToNow(new Date(s.lastSeen), { addSuffix: true }) : '—'}
                </Td>
                <Td style={{ fontWeight: 600 }}>{s.messageCount || 0}</Td>
                <Td>
                  {s.humanMode ? (
                    <Badge label="Human Mode" color="amber" />
                  ) : (
                    <Badge label="Bot Active"  color="green" />
                  )}
                </Td>
                <Td>
                  {s.humanMode ? (
                    // Resume bot — sends customer a WhatsApp notification
                    <Button
                      size="sm"
                      loading={acting[s.customerPhone] === 'resume'}
                      onClick={() => resumeBot(s.customerPhone)}
                    >
                      <Bot size={13} /> Resume Bot
                    </Button>
                  ) : (
                    // FIX: "Take Over" button was missing — api.js had sessions.takeOver()
                    // but it was never surfaced in the UI. Now wired up.
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={acting[s.customerPhone] === 'takeover'}
                      onClick={() => takeOver(s.customerPhone)}
                    >
                      <UserX size={13} /> Take Over
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
