// BookingsPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { Calendar, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, StatusBadge, Btn, EmptyState, Spinner, Select } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending','confirmed','completed','cancelled'];

function BookingRow({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(booking.status);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await dashApi.updateBooking(booking._id, { status: newStatus, adminNote: adminNote || undefined });
      onUpdate({ ...booking, status: newStatus });
      toast.success('Booking updated');
      setExpanded(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{booking.service || 'Appointment'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {booking.customerPhone} · {booking.date} {booking.time ? `at ${booking.time}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <StatusBadge status={booking.status} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', background: 'var(--bg-base)' }}>
          {booking.adminNote && <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}><span style={{ fontWeight: 600 }}>Note: </span>{booking.adminNote}</div>}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <Select label="Update status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Note to customer..." style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <Btn onClick={handleUpdate} loading={saving} size="sm">Save</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    dashApi.bookings({ status: statusFilter || undefined })
      .then(r => setBookings(r.data.bookings || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="fade-in">
      <PageHeader icon={Calendar} title="Bookings" subtitle={`${bookings.length} bookings`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', background: 'var(--bg-surface)', cursor: 'pointer' }}>
              <option value="">All</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /></Btn>
          </div>
        }
      />
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
        : bookings.length === 0 ? <Card><EmptyState icon={Calendar} title="No bookings yet" description="Bookings will appear here when customers schedule appointments via WhatsApp." /></Card>
        : bookings.map(b => <BookingRow key={b._id} booking={b} onUpdate={u => setBookings(bs => bs.map(x => x._id === u._id ? u : x))} />)}
    </div>
  );
}

export default BookingsPage;
