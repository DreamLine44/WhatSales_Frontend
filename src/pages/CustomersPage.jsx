import { useEffect, useState, useCallback, useRef } from 'react';
import { Users, RefreshCw, ShoppingBag, Phone, Package } from 'lucide-react';
import { dashApi } from '../api.js';
import { PageHeader, Card, Btn, EmptyState, Spinner, Avatar, SearchInput, Pagination, StatusBadge } from '../components/ui.jsx';
import toast from 'react-hot-toast';

function OrderHistory({ phone }) {
  const [orders, setOrders]   = useState(null); // null = not yet loaded
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // GET /dashboard/:tenantId/orders/customer/:customerPhone — defined in
    // api.js but never called anywhere before this; this is the first UI
    // surface for a customer's past-order history.
    dashApi.ordersByCustomer(phone)
      .then(r => { if (!cancelled) setOrders(r.data?.orders || []); })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [phone]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0' }}><Spinner size={18} /></div>;
  if (!orders?.length) return <div style={{ fontSize: '0.8rem', color: 'var(--text-ghost)', padding: '4px 0' }}>No past orders for this customer.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {orders.map(o => (
        <div key={o._id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
        }}>
          <Package size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.81rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {o.item} × {o.quantity}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-ghost)' }}>
              {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              {o.shortId ? ` · #${o.shortId}` : ''}
            </div>
          </div>
          {o.totalPrice != null && (
            <span style={{ fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>D {Number(o.totalPrice).toFixed(0)}</span>
          )}
          <StatusBadge status={o.status} />
        </div>
      ))}
    </div>
  );
}

function CustomerCard({ customer }) {
  // [FIX-CUSTOMERS-SCHEMA] UserProfile has no name/customerName field at all — the
  // closest thing is lead.name, only populated when lead capture is enabled and the
  // customer completed it. totalOrders/totalBookings live under stats.*, favourite
  // items under preferences.favoriteItems ([{name,count}]), and there is no spend
  // or lastOrderDate tracking anywhere in the schema or backend.
  const name  = customer.lead?.name || customer.name || customer.customerName || 'Customer';
  const phone = customer.phone || customer.customerPhone || '—';
  const totalOrders   = customer.stats?.totalOrders;
  const totalBookings = customer.stats?.totalBookings;
  const favoriteItems = customer.preferences?.favoriteItems || [];
  const lastSeen  = customer.activity?.lastSeen;
  const firstSeen = customer.activity?.firstSeen || customer.createdAt;
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
          {totalOrders != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, justifyContent: 'flex-end' }}>
              <ShoppingBag size={12} color="var(--text-muted)" />{totalOrders}
            </div>
          )}
          {lastSeen && (
            <div style={{ fontSize: '0.71rem', color: 'var(--text-ghost)', marginTop: 2 }}>
              {new Date(lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '12px 18px', background: 'var(--bg-page)', animation: 'fadeIn 0.14s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            {totalOrders != null && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Orders</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalOrders}</div>
              </div>
            )}
            {totalBookings != null && totalBookings > 0 && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Bookings</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalBookings}</div>
              </div>
            )}
            {firstSeen && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>First Seen</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {new Date(firstSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )}
            {lastSeen && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Last Seen</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {new Date(lastSeen).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            )}
            {favoriteItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Favourite</div>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{favoriteItems[0].name}</div>
              </div>
            )}
          </div>
          {phone !== '—' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Recent Orders</div>
              {/* Mounted only while expanded — lazily fetches, and unmounts (dropping
                  cached state) when collapsed, so reopening always shows fresh data. */}
              <OrderHistory phone={phone} />
            </div>
          )}
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
  // Prevents the page-change effect from double-loading when the debounce handler
  // calls setPage(1) and load(1, val) in the same tick.
  const skipEffectRef = useRef(false);
  const requestIdRef = useRef(0);
  const LIMIT = 30;

  const load = useCallback((p, q) => {
    setLoading(true);
    setError(null);
    const reqId = ++requestIdRef.current;
    const params = { page: p, limit: LIMIT };
    if (q?.trim()) params.search = q.trim();
    dashApi.customers(params)
      .then(r => {
        if (reqId !== requestIdRef.current) return; // superseded by a newer request
        setCustomers(r.data.customers || []);
        setTotal(r.data.total || 0);
      })
      .catch(err => {
        if (reqId !== requestIdRef.current) return;
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => { if (reqId === requestIdRef.current) setLoading(false); });
  }, []);

  useEffect(() => {
    if (skipEffectRef.current) { skipEffectRef.current = false; return; }
    load(page, search);
  }, [load, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search — 400ms after user stops typing; reset to page 1
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      // Skip the effect that setPage(1) would trigger — we're calling load directly
      skipEffectRef.current = true;
      setPage(1);
      load(1, val);
    }, 400);
  };


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
          {total} result{total !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={28} /></div>
      ) : error ? (
        <Card>
          <EmptyState icon={Users} title="Failed to load customers" description={error}
            action={<Btn onClick={() => load(page, search)}>Retry</Btn>} />
        </Card>
      ) : customers.length === 0 ? (
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
            {customers.map((c, i) => <CustomerCard key={c._id || i} customer={c} />)}
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
        </>
      )}
    </div>
  );
}
