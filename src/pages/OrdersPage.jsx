import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, RefreshCw, ChevronDown, ChevronUp, Clock, Package, DollarSign } from 'lucide-react';
import { dashApi, orderApi } from '../api.js';
import { PageHeader, Card, StatusBadge, Btn, EmptyState, Spinner, Select, FilterBar, InlineSelect, Pagination } from '../components/ui.jsx';
import toast from 'react-hot-toast';
// [FIX-ORDERS-STATUS] Full 11-value Order.status enum from the backend model —
// previously this list was missing preparing/ready/out_for_delivery/delivered,
// meaning an order stuck in one of those states had no way to be filtered to
// or explicitly set via this dropdown (Appendix B bug #7).
// Customers receive WhatsApp notifications on: confirmed, completed, cancelled, rejected
const STATUS_OPTIONS = [
  'pending', 'payment_pending_verification', 'confirmed', 'preparing',
  'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled',
  'payment_failed', 'rejected',
];

function OrderRow({ order, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // Step 9: PATCH /admin/orders/:orderId/status — uses TENANT API KEY
      await orderApi.updateStatus(order._id, { status: newStatus, notes: notes || undefined });
      onUpdate({ ...order, status: newStatus, notes: notes || order.notes });
      toast.success('Order updated');
      setExpanded(false);
    } catch (err) { toast.error(err.message || 'Failed to update order'); }
    finally { setSaving(false); }
  };

  const isNew = order.status === 'pending';

  return (
    <div style={{
      background: 'var(--bg-surface)', border: `1.5px solid ${isNew ? 'rgba(10,122,60,0.22)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)', marginBottom: 8, overflow: 'hidden',
      transition: 'box-shadow 0.15s',
      boxShadow: expanded ? 'var(--sh-md)' : (isNew ? '0 0 0 3px var(--primary-dim)' : 'var(--sh-xs)'),
    }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: isNew ? 'var(--primary-dim)' : 'var(--bg-overlay)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${isNew ? 'var(--border-accent)' : 'var(--border)'}`,
        }}>
          <Package size={16} color={isNew ? 'var(--primary)' : 'var(--text-muted)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.item} × {order.quantity}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{order.customerPhone}</span>
            {order.customerName && (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{order.customerName}</span>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {order.totalPrice != null && (
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              D {Number(order.totalPrice).toFixed(0)}
            </span>
          )}
          <StatusBadge status={order.status} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '16px 18px', background: 'var(--bg-page)', animation: 'fadeIn 0.15s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
            {order.addOns?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Add-ons</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{order.addOns.join(', ')}</div>
              </div>
            )}
            {order.notes && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Notes</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{order.notes}</div>
              </div>
            )}
            {order.paymentMethod && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Payment</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{order.paymentMethod} — {order.paymentStatus}</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 150 }}>
              <Select label="Update status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add a note..."
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(newStatus !== order.status || notes.trim()) && (
                <Btn onClick={handleUpdate} loading={saving} size="sm">Save</Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={() => setExpanded(false)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback((p, sf) => {
    setLoading(true);
    setError(null);
    // GET /dashboard/:id/orders — list orders (dashboard read route)
    dashApi.orders({ status: sf || undefined, page: p, limit: LIMIT })
      .then(r => { setOrders(r.data.orders || []); setTotal(r.data.total || 0); })
      .catch(err => { setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(page, statusFilter); }, [page, statusFilter]);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const revenue = orders.filter(o => ['confirmed','completed'].includes(o.status)).reduce((s, o) => s + (o.totalPrice || 0), 0);

  return (
    <div className="fade-in">
      <PageHeader
        icon={ShoppingCart} title="Orders"
        subtitle={`${total} total orders`}
        actions={<Btn variant="ghost" size="sm" onClick={() => load(page, statusFilter)}><RefreshCw size={14} /> Refresh</Btn>}
      />

      {!loading && orders.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', borderRadius: 'var(--r-md)', fontSize: '0.815rem', fontWeight: 600, color: 'var(--primary)' }}>
            <Package size={13} /> {orders.length} on this page
          </div>
          {pendingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'var(--amber-dim)', border: '1.5px solid rgba(217,119,6,0.22)', borderRadius: 'var(--r-md)', fontSize: '0.815rem', fontWeight: 600, color: 'var(--amber)' }}>
              ⚡ {pendingCount} pending action
            </div>
          )}
          {revenue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: 'var(--bg-overlay)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.815rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {/* [FIX-ORDERS-8] Explicit label — this is a sum of only the orders
                  currently on this page, not a 30-day total (which lives on the
                  Overview page). Ambiguous "D6750 visible" next to Overview's
                  "Revenue (30D)" caused confused support questions per audit. */}
              <DollarSign size={13} /> D {revenue.toFixed(0)} — this page only
            </div>
          )}
        </div>
      )}

      <FilterBar>
        <InlineSelect value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </InlineSelect>
      </FilterBar>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : error ? (
        <Card>
          <EmptyState icon={ShoppingCart} title="Failed to load orders" description={error}
            action={<Btn onClick={() => load(page, statusFilter)}>Retry</Btn>} />
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState icon={ShoppingCart} title="No orders yet"
            description="Your AI assistant is active and waiting for customers. Orders will appear automatically when customers begin chatting." />
        </Card>
      ) : (
        <>
          <div className="stagger">
            {orders.map(o => (
              <OrderRow key={o._id} order={o} onUpdate={u => setOrders(os => os.map(x => x._id === u._id ? u : x))} />
            ))}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
}
