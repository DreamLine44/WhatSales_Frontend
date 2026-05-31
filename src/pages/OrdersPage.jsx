import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { orders as ordersApi } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { formatCurrency } from '../utils/currency';
import {
  PageHeader, Card, Table, Tr, Td, OrderStatusBadge, Button,
  EmptyState, Spinner, Modal, Badge, DetailRow, FilterTabs, SearchInput,
  ConfirmModal
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { getBizConfig } from '../utils/businessConfig';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';

const VALID_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'payment_failed']);

const FILTERS = [
  { label: 'All',            value: '' },
  { label: 'Pending',        value: 'pending' },
  { label: 'Confirmed',      value: 'confirmed' },
  { label: 'Completed',      value: 'completed' },
  { label: 'Cancelled',      value: 'cancelled' },
  { label: 'Rejected',       value: 'rejected' },
  { label: 'Payment Failed', value: 'payment_failed' },
];

export default function OrdersPage() {
  const location = useLocation();
  const { tenant } = useAuth();
  const cfg = getBizConfig(tenant?.businessMode || 'GENERIC');
  const currency = tenant?.payment?.currency;

  const rawUrlFilter = new URLSearchParams(location.search).get('filter') || '';
  const validatedUrlFilter = VALID_STATUSES.has(rawUrlFilter) ? rawUrlFilter : '';

  const [filter, setFilter]   = useState(validatedUrlFilter);
  const [search, setSearch]   = useState('');
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  // Pagination
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 50;

  useEffect(() => {
    const raw = new URLSearchParams(location.search).get('filter') || '';
    const validated = VALID_STATUSES.has(raw) ? raw : '';
    setFilter(validated);
    setPage(1);
  }, [location.search]);

  const data = search.trim()
    ? rawData.filter(o => {
        const q = search.toLowerCase();
        return (
          (o.customerPhone || '').includes(q) ||
          (o.shortId || '').toLowerCase().includes(q) ||
          (o.item || '').toLowerCase().includes(q)
        );
      })
    : rawData;

  const [selected, setSelected] = useState(null);
  const [acting, setActing]     = useState({});
  // ConfirmModal state
  const [confirmState, setConfirmState] = useState({ open: false, orderId: null, shortId: null, loading: false });

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, page: pg };
      if (filter) params.status = filter;
      const res = await ordersApi.list(params);
      setRawData(res.data?.orders || []);
      if (res.data?.pages) setTotalPages(res.data.pages);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [filter]);
  useEffect(() => { if (page > 1) load(page); }, [page]);
  // Auto-refresh pending orders every 60s so new orders are noticed
  useEffect(() => {
    const interval = setInterval(() => { load(); }, 60000);
    return () => clearInterval(interval);
  }, [filter, page]);

  const approve = async (orderId) => {
    setActing(a => ({ ...a, [orderId]: 'approve' }));
    try {
      await ordersApi.approve(orderId);
      toast.success('Order confirmed — customer notified ✅');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to approve'); }
    finally { setActing(a => ({ ...a, [orderId]: null })); }
  };

  const reject = async (orderId) => {
    setActing(a => ({ ...a, [orderId]: 'reject' }));
    try {
      await ordersApi.reject(orderId);
      toast.success('Order rejected — customer notified');
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reject'); }
    finally { setActing(a => ({ ...a, [orderId]: null })); }
  };

  const cancelConfirmed = async () => {
    const { orderId } = confirmState;
    setConfirmState(s => ({ ...s, loading: true }));
    try {
      await ordersApi.cancel(orderId);
      toast.success('Order cancelled');
      setConfirmState({ open: false, orderId: null, shortId: null, loading: false });
      load();
    } catch {
      toast.error('Failed to cancel');
      setConfirmState(s => ({ ...s, loading: false }));
    }
  };

  const canCancel = (order) => order.status === 'pending';

  return (
    <div className="fade-in">
      <PageHeader
        title={cfg.transactions.ordersPageTitle || "Orders"}
        subtitle={cfg.transactions.ordersSubtitle || "Manage customer orders"}
      />

      <Card style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterTabs filters={FILTERS} active={filter} onChange={(v) => { setFilter(v); setPage(1); }} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search by phone, ref, item…" />
        </div>
        {search.trim() && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> Searching within the {rawData.length} most recently loaded orders.
          </div>
        )}
      </Card>

      <Card padding="0">
        {loading ? <Spinner /> : data.length === 0 ? (
          <EmptyState icon={Package} title={`No ${(cfg.transactions.ordersNavLabel || "orders").toLowerCase()} found`} body={cfg.transactions.emptyOrdersBody || "Orders placed via WhatsApp will appear here"} />
        ) : (
          <Table headers={['Ref', 'Customer', 'Item', 'Qty', 'Total', 'Status', 'Date', 'Actions']}>
            {data.map(order => (
              <Tr key={order._id} onClick={() => setSelected(order)}>
                <Td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>#{order.shortId}</span></Td>
                <Td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{order.customerPhone}</Td>
                <Td style={{ fontWeight: 500 }}>{order.item}</Td>
                <Td>{order.quantity}</Td>
                <Td style={{ fontWeight: 600 }}>
                  {formatCurrency(order.totalPrice, currency)}
                </Td>
                <Td><OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} /></Td>
                <Td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {order.createdAt ? format(new Date(order.createdAt), 'dd MMM, HH:mm') : '—'}
                </Td>
                <Td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {order.status === 'pending' && (
                      <>
                        <Button size="sm" variant="success" loading={acting[order._id] === 'approve'} onClick={() => approve(order._id)}>✓ Approve</Button>
                        <Button size="sm" variant="danger"  loading={acting[order._id] === 'reject'}  onClick={() => reject(order._id)}>✗ Reject</Button>
                      </>
                    )}
                    {canCancel(order) && (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmState({ open: true, orderId: order._id, shortId: order.shortId, loading: false })}>Cancel</Button>
                    )}
                  </div>
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

      {/* Order detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?.shortId}`} width={480}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DetailRow label="Customer"    value={selected.customerPhone} />
            <DetailRow label={cfg.transactions.orderItemLabel || "Item"}        value={`${selected.item} × ${selected.quantity}`} />
            <DetailRow label="Total"       value={formatCurrency(selected.totalPrice, currency)} />
            <DetailRow label="Status"      value={<OrderStatusBadge status={selected.status} paymentStatus={selected.paymentStatus} />} />
            <DetailRow label="Reviewed by" value={selected.paymentReviewedBy || 'Not reviewed'} />
            <DetailRow label="Created"     value={selected.createdAt ? format(new Date(selected.createdAt), 'dd MMM yyyy, HH:mm') : '—'} />
            {selected.notes && <DetailRow label="Notes" value={selected.notes} />}

            {selected.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="success" style={{ flex: 1 }} loading={acting[selected?._id] === 'approve'} onClick={() => approve(selected._id)}>
                  <CheckCircle size={15} /> Approve Payment
                </Button>
                <Button variant="danger" style={{ flex: 1 }} loading={acting[selected?._id] === 'reject'} onClick={() => reject(selected._id)}>
                  <XCircle size={15} /> Reject Payment
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm cancel — replaces window.confirm */}
      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState({ open: false, orderId: null, shortId: null, loading: false })}
        onConfirm={cancelConfirmed}
        loading={confirmState.loading}
        title="Cancel Order"
        message={`Cancel order #${confirmState.shortId}? This cannot be undone.`}
        confirmLabel="Yes, Cancel Order"
        variant="danger"
      />
    </div>
  );
}
