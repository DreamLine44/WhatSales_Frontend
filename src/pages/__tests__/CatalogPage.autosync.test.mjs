// pages/__tests__/CatalogPage.autosync.test.mjs
//
// Regression tests for [CATALOG-AUTOSYNC-1]: the backend now auto-subscribes
// the catalog to the app during activation and pushes every product
// create/update/delete automatically, so "Sync Now" / manual sync is the
// backup path, not the only way changes reach Meta. CatalogPage.jsx's copy
// and its skippedDetail-derived stat card needed to reflect that instead of
// describing a two-step manual "ask admin, then sync" process.
//
// deriveStatus() is a pure, side-effect-free function (like
// WhatsAppPage.jsx's getProgress()), so it's extracted and executed directly
// via vm rather than pattern-matched — this actually runs the real logic
// instead of just asserting the string shape of the source.
//
// Run with: node --test src/pages/__tests__/*.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../CatalogPage.jsx', import.meta.url), 'utf8');

function loadDeriveStatus() {
  const startIdx = src.indexOf('const DAY_MS');
  const endIdx   = src.indexOf('function fmtDate');
  assert.notEqual(startIdx, -1, 'DAY_MS should exist in CatalogPage.jsx');
  assert.notEqual(endIdx, -1, 'fmtDate should exist as the boundary after deriveStatus()');

  const code = src.slice(startIdx, endIdx) + '\nmodule.exports = { deriveStatus };';
  const sandbox = { module: { exports: {} }, Date };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.module.exports;
}

test('deriveStatus(): still returns the same 7-state ladder untouched by the copy/stat-card changes', () => {
  const { deriveStatus } = loadDeriveStatus();
  assert.equal(deriveStatus(null), 'not_connected');
  assert.equal(deriveStatus({ catalogId: null }), 'not_connected');
  assert.equal(deriveStatus({ catalogId: 'x', enabled: false }), 'disabled');
  assert.equal(deriveStatus({ catalogId: 'x', enabled: true, lastSyncError: 'boom' }), 'sync_failed');
  assert.equal(deriveStatus({ catalogId: 'x', enabled: true, lastSyncedAt: null }), 'never_synced');
  assert.equal(
    deriveStatus({ catalogId: 'x', enabled: true, lastSyncedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() }),
    'needs_sync',
  );
  assert.equal(
    deriveStatus({ catalogId: 'x', enabled: true, lastSyncedAt: new Date().toISOString(), pendingVerification: 2 }),
    'verifying',
  );
  assert.equal(
    deriveStatus({ catalogId: 'x', enabled: true, lastSyncedAt: new Date().toISOString(), pendingVerification: 0 }),
    'healthy',
  );
});

test('not_connected copy no longer frames setup as a two-step "ask admin, then enable" process', () => {
  assert.doesNotMatch(
    src,
    /Ask your admin to connect a Catalog ID, then enable it below\./,
    'the old two-step manual-connection copy must be gone',
  );
  assert.match(
    src,
    /not_connected:[\s\S]{0,400}automatically/i,
    'the not_connected description must mention automatic syncing/subscription now that auto-sync is primary',
  );
});

test('Catalog ID helper text describes one-time admin setup with automatic follow-through, not "contact admin to connect"', () => {
  assert.doesNotMatch(src, /Contact your admin to get your Meta Catalog ID connected\./);
  assert.match(src, /one-time setup step/i);
  assert.match(src, /automatically/i);
});

test('skippedDetail derives a third "sync_failed" per-item bucket alongside missingImages/invalidPrice, without a new stat card', () => {
  assert.match(src, /itemSyncFailed\s*=\s*skippedDetail\.filter\(s => s\.reasons\?\.includes\('sync_failed'\)\)\.length;/);

  // Must extend the existing "Data Issues" StatCard's sub-line, not add a new <StatCard>.
  const statCardCount = (src.match(/<StatCard/g) || []).length;
  assert.equal(statCardCount, 4, 'no new StatCard should have been added — same 4 cards as before (Status, Products Live, Last Synced, Data Issues)');
  assert.match(src, /missing image · \$\{invalidPrice\} invalid price\$\{itemSyncFailed \? ` · \$\{itemSyncFailed\} failed to sync` : ''\}/);
});

test('"Sync Now" explanatory copy positions manual sync as the backup path, not the primary mechanism', () => {
  assert.doesNotMatch(
    src,
    /manual syncing is mainly useful right after a big menu update\./,
    'the old copy that implied manual sync was the main path must be replaced',
  );
  assert.match(src, /automatically and\s*\n?\s*near-instantly/);
  assert.match(src, /backup/i);
  assert.match(src, /Sync Now/);
});

test('Sync Now button is still rendered and still gated on `connected` — auto-sync being primary must not hide or remove it', () => {
  assert.match(src, /<Btn onClick=\{runSync\} loading=\{syncing\} disabled=\{!connected\}/);
});
