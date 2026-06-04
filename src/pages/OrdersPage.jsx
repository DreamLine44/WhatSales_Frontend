import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, RefreshCw, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, StatusBadge, Btn, EmptyState, Spinner, Select } from '../components/ui.jsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending','confirmed','completed','cancelled','payment_failed','rejected'];

const STATUS_COLORS = {
  pending: 'amber', confirmed: 'green', completed: 'blue',
  cancelled: 'red', payment_failed: 'red', rejected: 'red',
};

function OrderRow({ order, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await dashApi.updateOrder(order._id, { status: newStatus, notes: notes || undefined });
      onUpdate({ ...order, status: newStatus, notes: notes || order.notes });
      toast.success('Order updated');
      setExpanded(false);
    } catch (err) { toast.error(err.message || 'Failed to update order'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', marginBottom: 8, overflow: 'hidden',
      transition: 'box-shadow 0.15s',
      boxShadow: expanded ? 'var(--sh-md)' : 'var(--sh-xs)',
    }}>
      <button onClick={() => setExpanded(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.item} × {order.quantity}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{order.customerPhone}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />{new Date(order.createdAt).toLocaleDateString()}
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
          {order.addOns?.length > 0 && (
            <div style={{ marginBottom: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700 }}>Add-ons: </span>{order.addOns.join(', ')}
            </div>
          )}
          {order.notes && (
            <div style={{ marginBottom: 10, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700 }}>Notes: </span>{order.notes}
            </div>
          )}
          {order.paymentMethod && (
            <div style={{ marginBottom: 12, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700 }}>Payment: </span>{order.paymentMethod} — {order.paymentStatus}
            </div>
          )}
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

  const load = useCallback(() => {
    setLoading(true);
    dashApi.orders({ status: statusFilter || undefined, page, limit: 20 })
      .then(r => { setOrders(r.data.orders || []); setTotal(r.data.total || 0); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fade-in">
      <PageHeader
        icon={ShoppingCart} title="Orders"
        subtitle={`${total} total orders`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{
                padding: '8px 30px 8px 12px', border: '1.5px solid var(--border-mid)',
                borderRadius: 'var(--r-md)', fontFamily: 'var(--font-body)', fontSize: '0.815rem',
                background: 'var(--bg-surface)', cursor: 'pointer', outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23627065' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Btn>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
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
          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Btn>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)' }}>Page {page}</span>
              <Btn variant="ghost" size="sm" disabled={orders.length < 20} onClick={() => setPage(p => p + 1)}>Next →</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
