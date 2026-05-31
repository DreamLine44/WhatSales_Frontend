import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { bookings as bookingsApi } from '../services/api';
import {
  PageHeader, Card, Table, Tr, Td, BookingStatusBadge, Button,
  EmptyState, Spinner, Modal, DetailRow, FilterTabs, SearchInput
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { useAuth } from '../store/AuthContext';
import { getBizConfig } from '../utils/businessConfig';
import { format } from 'date-fns';

const FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Declined',  value: 'cancelled' },
];

export default function BookingsPage() {
  const { tenant } = useAuth();
  const cfg = getBizConfig(tenant?.businessMode || 'GENERIC');
  const [filter, setFilter]     = useState('');
  const [search, setSearch]     = useState('');
  const [rawData, setRawData]   = useState([]);
  const [loading, setLoading]   = useState(true);
  // Client-side search — backend getBookings has no search param
  const data = search.trim()
    ? rawData.filter(b => {
        const q = search.toLowerCase();
        return (
          (b.customerPhone || '').includes(q) ||
          (b.shortId || '').toLowerCase().includes(q) ||
          (b.service || '').toLowerCase().includes(q) ||
          (b.customerName || '').toLowerCase().includes(q)
        );
      })
    : rawData;
  const [selected, setSelected] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [acting, setActing]     = useState({});  // { [bookingId]: 'confirm'|'decline' }
  const [showDecline, setShowDecline] = useState(false);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 50;

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, page: pg };
      if (filter) params.status = filter;
      const res = await bookingsApi.list(params);
      setRawData(res.data?.bookings || []);
      if (res.data?.pages) setTotalPages(res.data.pages);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [filter]); // search is client-side
  useEffect(() => { if (page > 1) load(page); }, [page]);

  const confirm = async (bookingId) => {
    setActing(a => ({ ...a, [bookingId]: 'confirm' }));
    try {
      await bookingsApi.confirm(bookingId);
      toast.success('Booking confirmed — customer notified ✅');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to confirm'); }
    finally { setActing(a => ({ ...a, [bookingId]: null })); }
  };

  const decline = async (bookingId) => {
    setActing(a => ({ ...a, [bookingId]: 'decline' }));
    try {
      // mirrors adminCommandService declineBooking(shortId, reason, ...)
      await bookingsApi.decline(bookingId, declineReason || undefined);
      toast.success('Booking declined — customer notified');
      setSelected(null);
      setShowDecline(false);
      setDeclineReason('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to decline'); }
    finally { setActing(a => ({ ...a, [bookingId]: null })); }
  };

  return (
    <div className="fade-in">
      <PageHeader title={cfg.transactions.bookingsPageTitle || "Bookings"} subtitle={cfg.transactions.bookingsSubtitle || "Manage customer bookings"} />

      <Card style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterTabs filters={FILTERS} active={filter} onChange={setFilter} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search by phone, ref, service…" />
        </div>
        {search.trim() && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> Searching within the {rawData.length} most recently loaded bookings. Older records are not included.
          </div>
        )}
      </Card>

      <Card padding="0">
        {loading ? <Spinner /> : data.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={`No ${(cfg.transactions.bookingsNavLabel || "bookings").toLowerCase()} yet`} body={cfg.transactions.emptyBookingsBody || "Booking requests from WhatsApp will appear here"} />
        ) : (
          <Table headers={['Ref', 'Customer', 'Service', 'Date', 'Time', 'Party', 'Status', 'Actions']}>
            {data.map(b => (
              <Tr key={b._id} onClick={() => setSelected(b)}>
                <Td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>#{b.shortId}</span></Td>
                <Td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{b.customerPhone}</Td>
                <Td style={{ fontWeight: 500 }}>{b.service || '—'}</Td>
                <Td>{b.date || '—'}</Td>
                <Td>{b.time || '—'}</Td>
                <Td>{b.partySize || '—'}</Td>
                <Td><BookingStatusBadge status={b.status} /></Td>
                <Td onClick={e => e.stopPropagation()}>
                  {b.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Button size="sm" variant="success" loading={acting[b._id] === 'confirm'} onClick={() => confirm(b._id)}>✓ Confirm</Button>
                      <Button size="sm" variant="danger" loading={acting[b._id] === 'decline'} onClick={() => { setSelected(b); setShowDecline(true); }}>✗ Decline</Button>
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
        </div>
      )}

      {/* Booking detail modal */}
      <Modal open={!!selected && !showDecline} onClose={() => setSelected(null)} title={`Booking #${selected?.shortId}`} width={460}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DetailRow label="Customer" value={selected.customerPhone} />
            <DetailRow label="Name" value={selected.customerName || '—'} />
            <DetailRow label="Service" value={selected.service || '—'} />
            <DetailRow label="Date" value={selected.date || '—'} />
            <DetailRow label="Time" value={selected.time || '—'} />
            <DetailRow label="Party size" value={selected.partySize || '—'} />
            <DetailRow label="Status" value={<BookingStatusBadge status={selected.status} />} />
            {selected.adminNote && <DetailRow label="Decline reason" value={selected.adminNote} />}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="success" style={{ flex: 1 }} loading={acting[selected._id] === 'confirm'} onClick={() => confirm(selected._id)}>
                  ✓ Confirm Booking
                </Button>
                <Button variant="danger" style={{ flex: 1 }} loading={acting[selected._id] === 'decline'} onClick={() => setShowDecline(true)}>
                  ✗ Decline
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Decline modal with reason — mirrors DECLINE BOOK <id> [reason] */}
      <Modal open={showDecline} onClose={() => { setShowDecline(false); setDeclineReason(''); }} title="Decline Booking" width={400}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Declining booking <strong>#{selected.shortId}</strong> will notify the customer and cancel their appointment.
            </p>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Reason <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                placeholder="e.g. Fully booked that day"
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowDecline(false); setDeclineReason(''); }}>Cancel</Button>
              <Button variant="danger" style={{ flex: 1 }} loading={acting[selected?._id] === 'decline'} onClick={() => decline(selected._id)}>
                Decline Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

