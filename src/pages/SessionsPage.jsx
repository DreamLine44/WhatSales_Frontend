import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, RefreshCw, Bot, User, AlertTriangle } from 'lucide-react';
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
  const timeAgo  = lastSeen ? Math.floor((Date.now() - lastSeen) / 60000) : null;

  return (
    <div style={{
      background: 'var(--bg-surface)', border: `1.5px solid ${isHuman ? 'rgba(217,119,6,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'box-shadow 0.15s',
      boxShadow: isHuman ? '0 0 0 3px rgba(217,119,6,0.08)' : 'var(--sh-xs)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: isHuman ? '#fef3c7' : 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${isHuman ? 'rgba(217,119,6,0.3)' : 'var(--border-accent)'}`,
      }}>
        {isHuman
          ? <User size={20} color="var(--amber)" />
          : <Bot size={20} color="var(--primary)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3, letterSpacing: '-0.01em' }}>
          {session.customerName || 'Customer'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 4 }}>{session.customerPhone}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {session.currentFlow && <Badge color="blue">{session.currentFlow}</Badge>}
          {timeAgo !== null && <span style={{ fontSize: '0.71rem', color: 'var(--text-ghost)' }}>Active {timeAgo}m ago</span>}
          {session.messageCount != null && <span style={{ fontSize: '0.71rem', color: 'var(--text-ghost)' }}>{session.messageCount} msgs</span>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Btn
          variant={isHuman ? 'amber' : 'ghost'}
          size="sm"
          onClick={toggle}
          loading={toggling}
          style={{ minWidth: 116 }}
        >
          {isHuman ? <><User size={13} /> Human Mode</> : <><Bot size={13} /> Bot Active</>}
        </Btn>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [humanOnly, setHumanOnly] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    dashApi.conversations(100)
      .then(r => setSessions(r.data.conversations || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed  = humanOnly ? sessions.filter(s => s.humanMode) : sessions;
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
            <Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {humanCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16, padding: '12px 16px',
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)',
          borderRadius: 'var(--r-md)', fontSize: '0.845rem', color: 'var(--amber)', fontWeight: 600,
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          {humanCount} customer{humanCount !== 1 ? 's' : ''} waiting for a human response
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title={humanOnly ? 'No sessions in human mode' : 'No active sessions'}
            description="Live customer sessions appear here. Toggle a session to human mode to take over from the bot."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="stagger">
          {displayed.map(s => <SessionCard key={s.customerPhone} session={s} onToggle={handleToggle} />)}
        </div>
      )}
    </div>
  );
}
