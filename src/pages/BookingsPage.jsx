import { useEffect, useState, useCallback } from 'react';
import { Calendar, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { dashApi, bookingApi } from '../api.js';
import { PageHeader, Card, StatusBadge, Btn, EmptyState, Spinner, Select, Pagination, FilterBar, InlineSelect } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// Step 10: PATCH /admin/bookings/:bookingId/status
// Valid statuses: pending | confirmed | completed | cancelled
// adminNote is sent to the customer via WhatsApp on confirmed, completed, cancelled
const STATUS_OPTIONS = ['pending','confirmed','completed','cancelled'];

function BookingRow({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // Step 10: PATCH /admin/bookings/:bookingId/status — uses TENANT API KEY
      await bookingApi.updateStatus(booking._id, {
        status: newStatus,
        adminNote: adminNote || undefined,
      });
      onUpdate({ ...booking, status: newStatus });
      toast.success('Booking updated');
      setExpanded(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', marginBottom: 8, overflow: 'hidden',
      boxShadow: expanded ? 'var(--sh-md)' : 'var(--sh-xs)', transition: 'box-shadow 0.15s',
    }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3, letterSpacing: '-0.01em' }}>
            {booking.service || 'Appointment'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{booking.customerPhone}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />{booking.date}{booking.time ? ` at ${booking.time}` : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StatusBadge status={booking.status} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '16px 18px', background: 'var(--bg-page)', animation: 'fadeIn 0.15s ease' }}>
          {booking.adminNote && (
            <div style={{ marginBottom: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700 }}>Note: </span>{booking.adminNote}
            </div>
          )}
          {booking.partySize && (
            <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700 }}>Party size: </span>{booking.partySize}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 150 }}>
              <Select label="Update status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                Note to customer (optional)
              </label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder='e.g. "Table 4 reserved for you, ground floor."'
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            {(newStatus !== booking.status || adminNote.trim()) && (
              <Btn onClick={handleUpdate} loading={saving} size="sm">Save</Btn>
            )}
            <Btn variant="ghost" size="sm" onClick={() => setExpanded(false)}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const load = useCallback((p, sf) => {
    setLoading(true);
    setError(null);
    // GET /dashboard/:id/bookings — list bookings (dashboard read route)
    dashApi.bookings({ status: sf || undefined, page: p, limit: LIMIT })
      .then(r => { setBookings(r.data.bookings || []); setTotal(r.data.total || 0); })
      .catch(err => { setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(page, statusFilter); }, [page, statusFilter]);

  return (
    <div className="fade-in">
      <PageHeader icon={Calendar} title="Bookings" subtitle={`${total} bookings`}
        actions={<Btn variant="ghost" size="sm" onClick={() => load(page, statusFilter)}><RefreshCw size={14} /></Btn>}
      />

      <FilterBar>
        <InlineSelect value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </InlineSelect>
      </FilterBar>

      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
        : error
          ? <Card><EmptyState icon={Calendar} title="Failed to load bookings" description={error}
              action={<Btn onClick={() => load(page, statusFilter)}>Retry</Btn>} /></Card>
          : bookings.length === 0
            ? <Card><EmptyState icon={Calendar} title="No bookings yet" description="Bookings will appear here when customers schedule appointments via WhatsApp." /></Card>
            : <>
                <div className="stagger">{bookings.map(b => (
                  <BookingRow key={b._id} booking={b} onUpdate={u => setBookings(bs => bs.map(x => x._id === u._id ? u : x))} />
                ))}</div>
                <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
              </>
      }
    </div>
  );
}

export default BookingsPage;
