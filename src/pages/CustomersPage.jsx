import { useEffect, useState, useCallback } from 'react';
import { Users, RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function CustomerCard({ customer }) {
  const name  = customer.name  || customer.customerName  || 'Customer';
  const phone = customer.phone || customer.customerPhone || '—';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  // Deterministic color from name
  const colors = ['var(--primary)', 'var(--blue)', 'var(--purple)', 'var(--teal)', 'var(--amber)'];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'box-shadow 0.15s, transform 0.15s',
      boxShadow: 'var(--sh-xs)',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sh-xs)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: colors[colorIndex] + '18',
        border: `2px solid ${colors[colorIndex]}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: colors[colorIndex], fontSize: '0.85rem',
      }}>
        {initials || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, letterSpacing: '-0.01em' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{phone}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {customer.totalOrders != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
            <ShoppingBag size={12} color="var(--text-muted)" />{customer.totalOrders} orders
          </div>
        )}
        {customer.updatedAt && (
          <div style={{ fontSize: '0.71rem', color: 'var(--text-ghost)', marginTop: 2 }}>
            {new Date(customer.updatedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    dashApi.customers({ page, limit: 30 })
      .then(r => { setCustomers(r.data.customers || []); setTotal(r.data.total || 0); })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

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
        actions={<Btn variant="ghost" size="sm" onClick={load}><RefreshCw size={14} /> Refresh</Btn>}
      />

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: searchFocused ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none', transition: 'color 0.15s' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
          placeholder="Search by name or phone…"
          style={{
            width: '100%', padding: '11px 13px 11px 40px',
            border: `1.5px solid ${searchFocused ? 'var(--primary)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--r-lg)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: searchFocused ? '0 0 0 3px var(--primary-dim)' : 'none',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
          }}>✕</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Users}
            title={search ? 'No matches found' : 'No customers yet'}
            description={search ? 'Try a different name or phone number.' : 'Customer profiles are created automatically when someone chats with your bot.'} />
        </Card>
      ) : (
        <>
          {search && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="stagger">
            {filtered.map((c, i) => <CustomerCard key={c._id || i} customer={c} />)}
          </div>
          {total > 30 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Btn>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)' }}>Page {page}</span>
              <Btn variant="ghost" size="sm" disabled={customers.length < 30} onClick={() => setPage(p => p + 1)}>Next →</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}
