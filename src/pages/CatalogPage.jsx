import { useEffect, useState } from 'react';
import {
  ShoppingBag, RefreshCw, CheckCircle2, AlertCircle, Clock, XCircle,
  ImageOff, PackageX, Loader2, Info, PowerOff,
} from 'lucide-react';
import { bizApi, catalogApi } from '../api.js';
import { PageHeader, Card, Btn, Select, Toggle, Badge, InfoBanner, StatCard, SectionHeading } from '../components/ui.jsx';
import toast from 'react-hot-toast';

// ── AUDIT NOTE ─────────────────────────────────────────────────────────────
// Backend has a full WA Commerce Catalog subsystem (business/:tenantId/wacatalog
// /health + /sync) with zero frontend surface before this page: a tenant had no
// way to see whether their Meta catalog was connected, healthy, or stale, and
// no way to enable it, configure it, or trigger a sync. This page is that
// surface.
//
// [AUDIT-FIX-CATALOG-HEALTH-SHAPE] GET /wacatalog/health does NOT return a
// pre-computed `status` string, `products`, `connected`, `missingImages`, or
// `outOfStock` — this page (and api.js's comment above catalogApi) previously
// assumed a response shape the backend never actually implements. The real
// shape (see businessController.js getWaCatalogHealth) is:
//   { enabled, catalogId, lastSyncedAt, lastSyncError: string|null,
//     totalItems, itemsReady, itemsSkipped, skippedDetail: [{id,name,reasons}] }
// `reasons` is drawn from waCatalogHelpers.isSyncableForCatalog and is only
// ever 'invalid_or_zero_price' and/or 'missing_image' — there's no
// "out of stock" concept anywhere in the schema or the sync-eligibility gate,
// so that stat has been dropped rather than invented. `status`/`connected`
// are now derived client-side from the real fields below instead.
const STATUS_META = {
  // [CATALOG-AUTOSYNC-1] Auto-sync is now the primary mechanism (backend
  // auto-subscribes the catalog to the app during activation) — the tenant
  // no longer needs to think of this as a two-step manual process. Your
  // admin sets the Catalog ID once; subscription + activation follow
  // automatically after that.
  not_connected: { label: 'Not Connected', color: 'gray',  Icon: XCircle,     desc: 'Ask your admin to set a Catalog ID for your account — once it\'s set, syncing happens automatically.' },
  disabled:      { label: 'Disabled',      color: 'gray',  Icon: PowerOff,    desc: 'Catalog is configured but turned off — enable it below to go live.' },
  never_synced:  { label: 'Never Synced',  color: 'amber', Icon: Clock,       desc: 'Catalog is configured but has never been synced to Meta yet.' },
  sync_failed:   { label: 'Sync Failed',   color: 'red',   Icon: AlertCircle, desc: 'The last sync attempt failed — see the error below.' },
  needs_sync:    { label: 'Needs Sync',    color: 'amber', Icon: AlertCircle, desc: "It's been over 24 hours since the last successful sync." },
  // [FIX-CATALOG-PENDING-VERIFY-1] Meta's items_batch API is async — a 200
  // response only means a batch was ACCEPTED, not that those items are
  // confirmed live yet (see waCatalogService.js CATALOG-ASYNC-VERIFY-1).
  // Previously any pending handle was invisible here: as long as
  // lastSyncError was empty and lastSyncedAt was recent, the page showed a
  // flat "Healthy" even while some (or all) just-synced items were still
  // being processed by Meta and not actually visible to customers yet. This
  // state surfaces that window honestly instead of over-promising.
  verifying:     { label: 'Verifying',     color: 'amber', Icon: Clock,       desc: "Meta is still processing your last sync — some items may not be visible to customers yet. This usually clears within a few minutes; re-sync to check." },
  healthy:       { label: 'Healthy',       color: 'green', Icon: CheckCircle2, desc: 'Your catalog is up to date with Meta.' },
};

const MODE_OPTIONS = [
  { value: 'AI_DECIDES',   label: 'AI Decides (recommended)', hint: 'The bot offers the catalog only when a customer seems to be browsing.' },
  { value: 'ALWAYS_OFFER', label: 'Always Offer',             hint: 'The bot offers the catalog on every order start.' },
  { value: 'MANUAL_ONLY',  label: 'Manual Only',               hint: 'The catalog is never sent automatically.' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// [AUDIT-FIX-CATALOG-HEALTH-SHAPE] Derives the same 6-state ladder the UI
// always had, but from fields the backend actually returns instead of a
// `status` string that never existed server-side.
function deriveStatus(h) {
  if (!h) return 'not_connected';
  if (!h.catalogId) return 'not_connected';
  if (!h.enabled) return 'disabled';
  if (h.lastSyncError) return 'sync_failed';
  if (!h.lastSyncedAt) return 'never_synced';
  if (Date.now() - new Date(h.lastSyncedAt).getTime() > DAY_MS) return 'needs_sync';
  if ((h.pendingVerification || 0) > 0) return 'verifying';
  return 'healthy';
}

function fmtDate(d) {
  if (!d) return 'Never';
  const date = new Date(d);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CatalogPage() {
  const [loading, setLoading]   = useState(true);
  const [health, setHealth]     = useState(null);
  const [phoneOk, setPhoneOk]   = useState(false); // real (non-SIM_) connected number on file
  const [form, setForm]         = useState({ enabled: false, mode: 'AI_DECIDES' });
  const [catalogId, setCatalogId] = useState(''); // read-only — set by the platform admin, see [AUDIT-FIX-CATALOG-ADMIN-1]
  const [saving, setSaving]     = useState(false);
  const [syncing, setSyncing]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // [AUDIT-FIX-CATALOG-PHONE-STATUS-2] bizApi.getSettings() hits
      // GET /dashboard/:tenantId/settings, which per api.js's own documented
      // contract only ever returns { business } — never tenantStatus. The
      // previous fix here (AUDIT-FIX-CATALOG-PHONE-STATUS-1) correctly
      // identified that tenantStatus.whatsapp.connected is the real
      // Meta-verified source of truth, but read it off the wrong response —
      // biz.data?.tenantStatus was always undefined, so this silently fell
      // through to the old phoneNumberId/SIM_ guess every single time,
      // meaning the banner could never clear even after a successful
      // POST /verify-whatsapp. bizApi.get() (GET /business/:tenantId) is the
      // endpoint that actually returns tenantStatus — see WhatsAppPage.jsx,
      // which already relies on this same call for the same field.
      const [h, biz, tenantRes] = await Promise.all([
        catalogApi.health(),
        bizApi.getSettings(),
        bizApi.get(),
      ]);
      setHealth(h.data);
      const wa = biz.data?.business?.waCatalog || {};
      setForm({
        enabled: !!wa.enabled,
        mode:    wa.mode || 'AI_DECIDES',
      });
      setCatalogId(wa.catalogId || '');
      const tenantStatus = tenantRes.data?.tenantStatus;
      if (tenantStatus) {
        setPhoneOk(!!tenantStatus.whatsapp?.connected);
      } else {
        // Fallback only if tenantStatus is genuinely unavailable (e.g. an
        // auth context where req.tenant isn't attached server-side).
        const phoneNumberId = biz.data?.business?.phoneNumberId;
        setPhoneOk(!!phoneNumberId && !String(phoneNumberId).startsWith('SIM_'));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.enabled && !catalogId) {
      toast.error('No Catalog ID is set for your account yet — contact your admin to get one connected before enabling.');
      return;
    }
    if (form.enabled && !phoneOk) {
      toast.error('WhatsApp is not connected yet — connect a real number before enabling the catalog.');
      return;
    }
    setSaving(true);
    try {
      // [AUDIT-FIX-CATALOG-TENANT-LOCKDOWN-1] catalogId is no longer sent from
      // here — it's admin-only now (PATCH /admin/tenants/:id). Sending it would
      // be silently stripped by the backend anyway, but omitting it keeps this
      // request honest about what a tenant actually controls: on/off + offer mode.
      await bizApi.updateSettings({
        waCatalog: {
          enabled: form.enabled,
          mode:    form.mode,
        },
      });
      toast.success('Catalog settings saved');
      await load();
    } catch (err) {
      // Backend guards surface as clear 400 messages — show them verbatim.
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await catalogApi.sync();
      toast.success(`Synced ${r.data.synced || 0} item${r.data.synced === 1 ? '' : 's'}${r.data.deleted ? `, removed ${r.data.deleted}` : ''}`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const status = deriveStatus(health);
  const meta = STATUS_META[status];
  // "Sync Now" only makes sense once the catalog is actually enabled+configured —
  // there is no separate `connected` field from the backend, so this is derived
  // from the same enabled+catalogId pair the backend itself gates the sync route on.
  const connected = !!(health?.enabled && health?.catalogId);
  // Reasons were always exactly 'missing_image' and/or 'invalid_or_zero_price' —
  // see waCatalogHelpers.isSyncableForCatalog. No "out of stock" field exists
  // anywhere in the schema or this gate, so it isn't shown here.
  // [CATALOG-AUTOSYNC-1] A third bucket, 'sync_failed', can now appear per-item
  // in skippedDetail — distinct from the two data-quality reasons above, this
  // means the item itself is fine but Meta rejected/failed the push. Extends
  // the same stat card rather than adding a new one, since this card already
  // breaks down *why* items aren't live.
  const skippedDetail = health?.skippedDetail || [];
  const missingImages = skippedDetail.filter(s => s.reasons?.includes('missing_image')).length;
  const invalidPrice   = skippedDetail.filter(s => s.reasons?.includes('invalid_or_zero_price')).length;
  const itemSyncFailed = skippedDetail.filter(s => s.reasons?.includes('sync_failed')).length;

  return (
    <div className="fade-in">
      <PageHeader
        icon={ShoppingBag}
        title="WhatsApp Catalog"
        subtitle="Sell directly from Meta's WhatsApp Commerce Catalog"
        actions={
          <Btn variant="ghost" size="sm" onClick={load} loading={loading && !!health}>
            <RefreshCw size={14} /> Refresh
          </Btn>
        }
      />

      {!phoneOk && (
        <InfoBanner type="warning" style={{ marginBottom: 20 }}>
          Your WhatsApp number isn't connected yet, so the catalog can't go live even if enabled here.
          Contact your account admin to get WhatsApp connected first.
        </InfoBanner>
      )}

      {!loading && health && (
        <InfoBanner type={meta.color === 'green' ? 'success' : meta.color === 'red' ? 'error' : meta.color === 'gray' ? 'info' : 'warning'} style={{ marginBottom: 20 }}>
          <strong>{meta.label}.</strong> {meta.desc}
          {health.lastSyncError && (
            <span> Last error: <code>{health.lastSyncError}</code></span>
          )}
          {status !== 'verifying' && (health.pendingVerification || 0) > 0 && (
            <span> ({health.pendingVerification} item{health.pendingVerification > 1 ? 's' : ''} still being verified by Meta.)</span>
          )}
        </InfoBanner>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <>
          {/* Health stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            <StatCard label="Status" value={meta.label} icon={meta.Icon} color={meta.color} plain />
            <StatCard label="Products Live" value={String(health.itemsReady ?? 0)} icon={ShoppingBag} color="blue" />
            <StatCard label="Last Synced" value={fmtDate(health.lastSyncedAt)} icon={Clock} color="teal" plain />
            <StatCard
              label="Data Issues"
              value={String(health.itemsSkipped ?? 0)}
              sub={`${missingImages} missing image · ${invalidPrice} invalid price${itemSyncFailed ? ` · ${itemSyncFailed} failed to sync` : ''}`}
              icon={health.itemsSkipped ? ImageOff : PackageX}
              color={health.itemsSkipped ? 'amber' : 'green'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Configuration */}
            <Card>
              <SectionHeading>Catalog Configuration</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Toggle
                  checked={form.enabled}
                  onChange={v => setForm(f => ({ ...f, enabled: v }))}
                  label="Enable WhatsApp Catalog"
                  hint="Lets customers browse & order products directly inside WhatsApp"
                />
                {/* [AUDIT-FIX-CATALOG-TENANT-LOCKDOWN-1] Catalog ID is read-only here —
                    setting it correctly requires Meta Commerce Manager + Business
                    Settings access this account doesn't have (and shouldn't need).
                    Your admin sets this once; you just toggle it on/off and pick
                    how the bot offers it. */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Catalog ID
                  </div>
                  <div style={{
                    background: 'var(--bg-overlay)', borderRadius: 'var(--r-md)',
                    padding: '10px 12px', border: '1.5px solid var(--border)',
                    fontSize: '0.85rem', color: catalogId ? 'var(--text-primary)' : 'var(--text-ghost)',
                    fontFamily: catalogId ? 'monospace' : 'inherit',
                  }}>
                    {catalogId || 'Not set yet'}
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                    {catalogId
                      ? "Set by your admin. Contact them if this needs to change."
                      : 'Ask your admin to set your Meta Catalog ID — it\'s a one-time setup step. Once it\'s set, subscribing and syncing happen automatically, no further action needed from you.'}
                  </p>
                </div>
                <Select
                  label="Offer Mode"
                  value={form.mode}
                  onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                  hint={MODE_OPTIONS.find(m => m.value === form.mode)?.hint}
                >
                  {MODE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Select>
                <Btn onClick={save} loading={saving} fullWidth>Save Catalog Settings</Btn>
              </div>
            </Card>

            {/* Sync */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Card>
                <SectionHeading action={<Badge color={meta.color}>{meta.label}</Badge>}>Sync to Meta</SectionHeading>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  Every product create, update, and delete now pushes to Meta's Commerce Catalog automatically and
                  near-instantly — you don't need to sync manually for day-to-day menu changes. This button forces a
                  full catalog resync and is mainly there as a backup: use it right after a big bulk menu update, or
                  to recover if an auto-sync failed (see Data Issues below). Items missing a price or image are
                  skipped automatically either way.
                </p>
                <Btn onClick={runSync} loading={syncing} disabled={!connected} fullWidth variant={connected ? 'primary' : 'secondary'}>
                  <RefreshCw size={14} /> Sync Now
                </Btn>
                {!connected && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-ghost)', marginTop: 8, textAlign: 'center' }}>
                    {catalogId ? 'Enable the catalog above first.' : 'Ask your admin to set a Catalog ID first.'}
                  </div>
                )}
              </Card>

              <Card style={{ background: 'var(--bg-overlay)', border: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Info size={16} color="var(--blue)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      What makes an item syncable?
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                      Every item needs a valid price and an image to appear in your WhatsApp Catalog. Items missing either
                      are skipped during sync — check <strong>Menu / Products</strong> to fix the {missingImages} item(s)
                      currently missing an image{invalidPrice ? ` and ${invalidPrice} with an invalid price` : ''}.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
