import { useEffect, useState, useCallback, useRef } from 'react';
import { Users, RefreshCw, ShoppingBag, Phone } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Avatar, SearchInput, Pagination } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function CustomerCard({ customer }) {
  const name  = customer.name  || customer.customerName  || 'Customer';
  const phone = customer.phone || customer.customerPhone || '—';
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="hover-lift"
      style={{
        background: 'var(--bg-surface)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--sh-xs)',
      }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <Avatar name={name} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, letterSpacing: '-0.01em' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Phone size={10} />{phone}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {customer.totalOrders != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, justifyContent: 'flex-end' }}>
              <ShoppingBag size={12} color="var(--text-muted)" />{customer.totalOrders}
            </div>
          )}
          {customer.updatedAt && (
            <div style={{ fontSize: '0.71rem', color: 'var(--text-ghost)', marginTop: 2 }}>
              {new Date(customer.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '12px 18px', background: 'var(--bg-page)', animation: 'fadeIn 0.14s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {customer.totalOrders != null && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Orders</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{customer.totalOrders}</div>
              </div>
            )}
            {customer.totalSpent != null && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total Spent</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>D {Number(customer.totalSpent).toFixed(0)}</div>
              </div>
            )}
            {customer.createdAt && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>First Seen</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )}
            {customer.lastOrderDate && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Last Order</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {new Date(customer.lastOrderDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )}
            {customer.preferredItems?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Favourite</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{customer.preferredItems[0]}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [error, setError]         = useState(null);
  const searchTimer = useRef(null);
  const LIMIT = 30;

  const load = useCallback((p, q) => {
    setLoading(true);
    setError(null);
    // Customer search: pass ?search= if the API supports it, otherwise filter client-side
    const params = { page: p, limit: LIMIT };
    if (q?.trim()) params.search = q.trim();
    dashApi.customers(params)
      .then(r => {
        setCustomers(r.data.customers || []);
        setTotal(r.data.total || 0);
      })
      .catch(err => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, search); }, [load, page]); // eslint-disable-line

  // Debounce search — 400ms after user stops typing; reset to page 1
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, val);
    }, 400);
  };

  // Client-side filter as fallback for APIs that ignore ?search=
  const displayed = search.trim()
    ? customers.filter(c => {
        const q = search.toLowerCase();
        return (c.name || c.customerName || '').toLowerCase().includes(q) ||
               (c.phone || c.customerPhone || '').includes(q);
      })
    : customers;

  return (
    <div className="fade-in">
      <PageHeader icon={Users} title="Customers" subtitle={`${total} total customers`}
        actions={<Btn variant="ghost" size="sm" onClick={() => load(page, search)}><RefreshCw size={14} /> Refresh</Btn>}
      />

      <SearchInput
        value={search}
        onChange={handleSearch}
        placeholder="Search by name or phone…"
        style={{ marginBottom: 16 }}
      />

      {search && !loading && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
          {displayed.length} result{displayed.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : error ? (
        <Card>
          <EmptyState icon={Users} title="Failed to load customers" description={error}
            action={<Btn onClick={() => load(page, search)}>Retry</Btn>} />
        </Card>
      ) : displayed.length === 0 ? (
        <Card>
          <EmptyState icon={Users}
            title={search ? 'No matches found' : 'No customers yet'}
            description={search ? 'Try a different name or phone number.' : 'Customer profiles are created automatically when someone chats with your bot.'}
            action={search ? <Btn variant="ghost" onClick={() => handleSearch('')}>Clear search</Btn> : null}
          />
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="stagger">
            {displayed.map((c, i) => <CustomerCard key={c._id || i} customer={c} />)}
          </div>
          {!search && <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />}
        </>
      )}
    </div>
  );
}
