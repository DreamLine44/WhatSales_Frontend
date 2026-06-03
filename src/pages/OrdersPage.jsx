import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, StatusBadge, Btn, EmptyState, Spinner, Select } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending','confirmed','completed','cancelled','rejected','payment_pending_verification'];

function OrderRow({ order, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await dashApi.updateOrder(order._id, { status: newStatus, notes: notes || undefined });
      onUpdate({ ...order, status: newStatus, notes });
      toast.success('Order updated');
      setExpanded(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update order');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 8, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.item} × {order.quantity}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {order.customerPhone} · {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {order.totalPrice != null && (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              D {Number(order.totalPrice).toFixed(0)}
            </span>
          )}
          <StatusBadge status={order.status} />
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', background: 'var(--bg-base)' }}>
          {order.addOns?.length > 0 && (
            <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>Add-ons: </span>{order.addOns.join(', ')}
            </div>
          )}
          {order.notes && (
            <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>Notes: </span>{order.notes}
            </div>
          )}
          {order.paymentMethod && (
            <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>Payment: </span>{order.paymentMethod} — {order.paymentStatus}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <Select label="Update status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Note (optional)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add a note..."
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <Btn onClick={handleUpdate} loading={saving} size="sm">Save</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(() => {
    setLoading(true);
    dashApi.orders({ status: statusFilter || undefined, page, limit: 20 })
      .then(r => { setOrders(r.data.orders || []); setTotal(r.data.total || 0); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUpdate = (updated) => {
    setOrders(o => o.map(x => x._id === updated._id ? updated : x));
  };

  return (
    <div className="fade-in">
      <PageHeader
        icon={ShoppingCart}
        title="Orders"
        subtitle={`${total} total orders`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', background: 'var(--bg-surface)', cursor: 'pointer' }}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn variant="ghost" size="sm" onClick={fetch}>
              <RefreshCw size={14} /> Refresh
            </Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="Your AI assistant is active and waiting for customers. Orders will appear automatically when customers begin chatting."
          />
        </Card>
      ) : (
        <>
          {orders.map(o => (
            <OrderRow key={o._id} order={o} onUpdate={handleUpdate} />
          ))}
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Btn>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>Page {page}</span>
              <Btn variant="ghost" size="sm" disabled={orders.length < 20} onClick={() => setPage(p => p + 1)}>Next</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
