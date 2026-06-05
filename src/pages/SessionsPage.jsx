import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageSquare, RefreshCw, Bot, User, AlertTriangle, Clock, Zap } from 'lucide-react';
import { sessionsApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Badge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function timeAgoStr(date) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SessionCard({ session, onToggle }) {
  const [toggling, setToggling] = useState(false);
  const isHuman = session.humanMode;

  const toggle = async () => {
    setToggling(true);
    try {
      // Toggle human mode — dashboard-level route
      await sessionsApi.setHumanMode(session.customerPhone, !isHuman);
      onToggle(session.customerPhone, !isHuman);
      toast.success(isHuman ? 'Bot resumed — AI will handle replies' : 'Human mode — bot paused');
    } catch (err) { toast.error(err.message); }
    finally { setToggling(false); }
  };

  const ago = timeAgoStr(session.lastSeen);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1.5px solid ${isHuman ? 'rgba(217,119,6,0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'box-shadow 0.15s, transform 0.15s',
      boxShadow: isHuman ? '0 0 0 3px rgba(217,119,6,0.08), var(--sh-sm)' : 'var(--sh-xs)',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
        background: isHuman ? '#fef3c7' : 'var(--primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${isHuman ? 'rgba(217,119,6,0.35)' : 'var(--border-accent)'}`,
        position: 'relative',
      }}>
        {isHuman ? <User size={20} color="var(--amber)" /> : <Bot size={20} color="var(--primary)" />}
        {session.lastSeen && (Date.now() - new Date(session.lastSeen)) < 300000 && (
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 9, height: 9, borderRadius: '50%',
            background: isHuman ? 'var(--amber)' : 'var(--green-400)',
            border: '2px solid var(--bg-surface)',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3, letterSpacing: '-0.01em' }}>
          {session.customerName || 'Customer'}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5 }}>
          {session.customerPhone}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {session.currentFlow && <Badge color="blue">{session.currentFlow}</Badge>}
          {ago && (
            <span style={{ fontSize: '0.71rem', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} />{ago}
            </span>
          )}
          {session.messageCount != null && (
            <span style={{ fontSize: '0.71rem', color: 'var(--text-ghost)' }}>
              {session.messageCount} msgs
            </span>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Btn
          variant={isHuman ? 'amber' : 'ghost'}
          size="sm"
          onClick={toggle}
          loading={toggling}
          style={{ minWidth: 126 }}
          title={isHuman ? 'Click to resume bot' : 'Click to take over from bot'}
        >
          {isHuman
            ? <><User size={13} /> Human Mode</>
            : <><Bot size={13} /> Bot Active</>}
        </Btn>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [humanOnly, setHumanOnly] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    // Step 11: GET /admin/sessions/:tenantId — uses TENANT API KEY
    // Supports ?limit, ?page, ?humanOnly
    sessionsApi.list({ limit: 100 })
      .then(r => setSessions(r.data.sessions || r.data.conversations || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s so human-mode alerts stay fresh (silent refresh - no loading state)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      sessionsApi.list({ limit: 100 })
        .then(r => setSessions(r.data.sessions || r.data.conversations || []))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  const displayed   = humanOnly ? sessions.filter(s => s.humanMode) : sessions;
  const humanCount  = sessions.filter(s => s.humanMode).length;
  const botCount    = sessions.filter(s => !s.humanMode).length;
  const activeCount = sessions.filter(s => s.lastSeen && (Date.now() - new Date(s.lastSeen)) < 300000).length;

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
              <User size={13} /> {humanOnly ? 'All' : 'Human only'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /></Btn>
          </div>
        }
      />

      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
            <Bot size={13} /> {botCount} bot active
          </div>
          {humanCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--amber)' }}>
              <User size={13} /> {humanCount} need reply
            </div>
          )}
          {activeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', background: 'var(--bg-overlay)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Zap size={13} /> {activeCount} active now
            </div>
          )}
        </div>
      )}

      {humanCount > 0 && !humanOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16, padding: '12px 16px',
          background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)',
          borderRadius: 'var(--r-md)', fontSize: '0.845rem', color: 'var(--amber)', fontWeight: 600,
          cursor: 'pointer',
        }}
          onClick={() => setHumanOnly(true)}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          {humanCount} customer{humanCount !== 1 ? 's' : ''} waiting for a human response — click to filter
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
