import { useEffect, useState, useCallback } from 'react';
import { Users, RefreshCw, Search } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function CustomerCard({ customer }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
        {(customer.name || customer.customerName || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{customer.name || customer.customerName || 'Customer'}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customer.phone || customer.customerPhone}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {customer.totalOrders != null && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{customer.totalOrders} orders</div>}
        {customer.updatedAt && <div style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', marginTop: 2 }}>{new Date(customer.updatedAt).toLocaleDateString()}</div>}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    dashApi.customers({ page, limit: 30 })
      .then(r => { setCustomers(r.data.customers || []); setTotal(r.data.total || 0); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = search
    ? customers.filter(c => {
        const q = search.toLowerCase();
        return (c.name || c.customerName || '').toLowerCase().includes(q) ||
          (c.phone || c.customerPhone || '').includes(q);
      })
    : customers;

  return (
    <div className="fade-in">
      <PageHeader icon={Users} title="Customers" subtitle={`${total} total customers`}
        actions={<Btn variant="ghost" size="sm" onClick={fetch}><RefreshCw size={14} /></Btn>}
      />

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{ width: '100%', padding: '10px 13px 10px 38px', border: '1.5px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No customers yet" description="Customer profiles are created automatically when someone chats with your bot." /></Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((c, i) => <CustomerCard key={c._id || i} customer={c} />)}
          </div>
          {total > 30 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Btn>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>Page {page}</span>
              <Btn variant="ghost" size="sm" disabled={customers.length < 30} onClick={() => setPage(p => p + 1)}>Next</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
