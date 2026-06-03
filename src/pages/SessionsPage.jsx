import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, RefreshCw, Bot, User } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Badge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function SessionCard({ session, onToggle }) {
  const [toggling, setToggling] = useState(false);
  const isHuman = session.humanMode;

  const toggle = async () => {
    setToggling(true);
    try {
      await dashApi.setHumanMode(session.customerPhone, !isHuman);
      onToggle(session.customerPhone, !isHuman);
      toast.success(isHuman ? 'Bot resumed' : 'Human mode enabled');
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  const lastSeen = session.lastSeen ? new Date(session.lastSeen) : null;
  const timeAgo = lastSeen ? Math.floor((Date.now() - lastSeen) / 60000) : null;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: isHuman ? 'var(--amber-dim)' : 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isHuman ? <User size={20} color="var(--amber)" /> : <Bot size={20} color="var(--primary)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 3 }}>{session.customerName || 'Customer'}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 3 }}>{session.customerPhone}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session.currentFlow && <Badge color="blue">{session.currentFlow}</Badge>}
          {timeAgo !== null && <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>Active {timeAgo}m ago</span>}
          {session.messageCount != null && <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)' }}>{session.messageCount} msgs</span>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Btn
          variant={isHuman ? 'amber' : 'ghost'}
          size="sm"
          onClick={toggle}
          loading={toggling}
          style={{ minWidth: 110 }}
        >
          {isHuman ? <><User size={13} /> Human Mode</> : <><Bot size={13} /> Bot Active</>}
        </Btn>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [humanOnly, setHumanOnly] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    dashApi.conversations(100)
      .then(r => setSessions(r.data.conversations || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed = humanOnly ? sessions.filter(s => s.humanMode) : sessions;
  const humanCount = sessions.filter(s => s.humanMode).length;

  const handleToggle = (phone, humanMode) => {
    setSessions(ss => ss.map(s => s.customerPhone === phone ? { ...s, humanMode } : s));
  };

  return (
    <div className="fade-in">
      <PageHeader
        icon={MessageSquare}
        title="Live Sessions"
        subtitle={`${sessions.length} total · ${humanCount} in human mode`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant={humanOnly ? 'soft' : 'ghost'} size="sm" onClick={() => setHumanOnly(v => !v)}>
              <User size={13} /> Human only
            </Btn>
            <Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {humanCount > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.83rem', color: 'var(--amber)', fontWeight: 600 }}>
          ⚠️ {humanCount} customer{humanCount !== 1 ? 's' : ''} waiting for a human response
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState icon={MessageSquare} title={humanOnly ? 'No sessions in human mode' : 'No active sessions'} description="Live customer sessions will appear here. Toggle a session to human mode to take over from the bot." />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map(s => <SessionCard key={s.customerPhone} session={s} onToggle={handleToggle} />)}
        </div>
      )}
    </div>
  );
}
