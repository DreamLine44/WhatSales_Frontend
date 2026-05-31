import { useEffect, useState } from 'react';
import { Users, Search, Phone, ShoppingCart, Clock } from 'lucide-react';
import { customers as customersApi, orders as ordersApi } from '../services/api';
import { useAuth } from '../store/AuthContext';
import {
  PageHeader, Card, Table, Tr, Td, Button, EmptyState,
  Spinner, Modal, Badge, StatCard, Grid
} from '../components/ui/index.jsx';
import toast from 'react-hot-toast';
import { getBizConfig } from '../utils/businessConfig';
import { formatDistanceToNow, format } from 'date-fns';

export default function CustomersPage() {
  const { tenant } = useAuth();
  const cfg = getBizConfig(tenant?.businessMode || 'GENERIC');
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory]   = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const LIMIT = 50;

  // Client-side search — backend has no search param
  const displayed = search.trim()
    ? data.filter(c => {
        const q = search.toLowerCase();
        return (
          (c.customerPhone || '').includes(q) ||
          (c.name || '').toLowerCase().includes(q) ||
          (c.customerName || '').toLowerCase().includes(q)
        );
      })
    : data;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await customersApi.list({ limit: LIMIT, page: p });
      setData(res.data?.customers || []);
      setTotal(res.data?.total || 0);
      setPage(p);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCustomer = async (customer) => {
    setSelected(customer);
    setHistory([]);
    setHistLoading(true);
    try {
      const phone = customer.customerPhone || customer.phone;
      if (phone) {
        const res = await ordersApi.byCustomer(phone, 10);
        setHistory(res.data?.orders || []);
      }
    } catch { /* order history optional */ }
    finally { setHistLoading(false); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="fade-in">
      <PageHeader
        title="Customers"
        subtitle="Everyone who has interacted with your WhatsApp bot"
      />

      {/* Summary stats */}
      <Grid cols={3} minColWidth={160} gap={14} style={{ marginBottom: 24 }}>
        <StatCard label="Total Customers" value={total}  icon={Users}        color="var(--primary)" />
        <StatCard label={search.trim() ? "Filtered" : "This page"} value={displayed.length} sub={search.trim() ? `of ${total} total` : `of ${total} total`} icon={Search} color="var(--blue)" />
        <StatCard label="Page"            value={`${page} / ${totalPages || 1}`} icon={Clock} color="var(--purple)" />
      </Grid>

      {/* Search bar */}
      <Card style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by phone or name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }}
          />
        </div>
        {search.trim() && (
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠</span> Searching within the {data.length} customers on this page. Use pagination to load more.
          </div>
        )}
      </Card>

      <Card padding="0">
        {loading ? <Spinner /> : displayed.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            body="Customers appear here after their first WhatsApp interaction with your bot"
          />
        ) : (
          <Table headers={['Phone', 'Name', 'Messages', 'Flow', 'Last Seen', 'Actions']}>
            {displayed.map(c => {
              const phone = c.customerPhone || c.phone || '—';
              const name  = c.name || c.customerName || '—';
              return (
                <Tr key={c._id} onClick={() => openCustomer(c)}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-dim)', border: '1.5px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={13} color="var(--primary)" />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', fontFamily: 'monospace' }}>{phone}</span>
                    </div>
                  </Td>
                  <Td style={{ color: 'var(--text-secondary)' }}>{name}</Td>
                  <Td style={{ fontWeight: 600 }}>{c.messageCount || 0}</Td>
                  <Td>
                    {c.currentFlow
                      ? <Badge label={c.currentFlow} color="blue" />
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}
                  </Td>
                  <Td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {c.updatedAt || c.lastSeen
                      ? formatDistanceToNow(new Date(c.updatedAt || c.lastSeen), { addSuffix: true })
                      : '—'}
                  </Td>
                  <Td onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" onClick={() => openCustomer(c)}>
                      View
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => load(page - 1)}>← Prev</Button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next →</Button>
        </div>
      )}

      {/* Customer detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Profile" width={520}>
        {selected && (() => {
          const phone = selected.customerPhone || selected.phone || '—';
          const name  = selected.name || selected.customerName || '—';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-dim)', border: '2px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    {(name !== '—' ? name : phone)[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{phone}</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Messages', value: selected.messageCount || 0 },
                  { label: 'Current flow', value: selected.currentFlow || 'None' },
                  { label: 'Human mode', value: selected.humanMode ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Timestamps */}
              {(selected.createdAt || selected.updatedAt) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                  {selected.createdAt && <span>First seen: {format(new Date(selected.createdAt), 'dd MMM yyyy')}</span>}
                  {selected.updatedAt && <span>Last seen: {formatDistanceToNow(new Date(selected.updatedAt), { addSuffix: true })}</span>}
                </div>
              )}

              {/* Order / appointment history */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ShoppingCart size={15} color="var(--primary)" />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Recent {cfg.customers?.orderHistoryLabel || cfg.transactions.ordersNavLabel || 'Orders'}</span>
                </div>
                {histLoading ? (
                  <Spinner size={20} />
                ) : history.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>No {(cfg.customers?.orderHistoryLabel || cfg.transactions.ordersNavLabel || 'orders').toLowerCase()} yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.map(o => (
                      <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>#{o.shortId}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: 10 }}>{o.item} × {o.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {o.totalPrice && <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>D {Number(o.totalPrice).toLocaleString()}</span>}
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
