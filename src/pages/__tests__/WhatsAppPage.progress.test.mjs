// pages/__tests__/WhatsAppPage.progress.test.mjs
//
// Regression tests for [FEAT-CATALOG-PROGRESS-1]: WhatsAppPage.jsx's "Setup
// Progress" tracker only ever showed 3 fixed WhatsApp-connectivity steps
// (Credentials Configured → Verified with Meta → Bot Activated), even for
// tenants who had WA Catalog enabled — so there was no visibility into
// catalog readiness from the one screen a tenant naturally checks after
// asking "why isn't my bot/catalog working right".
//
// Fix: a 4th step, "Catalog Connected", is appended ONLY when
// GET /wacatalog/health reports `enabled: true` for this tenant — catalog is
// optional and lives on a different model (BusinessConfig) than the other
// three steps (Tenant), so it must never appear as a permanently-incomplete
// step for a tenant who never opted in. Its done/active/pending state and
// description are derived entirely from the real health payload (catalogId,
// lastSyncedAt, lastSyncError, itemsSkipped) — never fabricated.
//
// getProgress() / catalogStepDesc() are plain, side-effect-free functions —
// this test slices them straight out of the .jsx source and evaluates them
// in a sandboxed vm context, so it needs no JSX transform, no React runtime,
// and no test framework beyond Node's built-in test runner. It intentionally
// does NOT test rendering/DOM output — just the real logic driving it.
//
// Run with: node --test src/pages/__tests__/

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../WhatsAppPage.jsx', import.meta.url), 'utf8');

function loadHelpers() {
  const startIdx = src.indexOf('const REQUEST_ORDER');
  const endIdx   = src.indexOf('function StepItem');
  assert.notEqual(startIdx, -1, 'REQUEST_ORDER should exist in WhatsAppPage.jsx');
  assert.notEqual(endIdx, -1, 'StepItem should exist as the boundary after the helpers');

  const code = src.slice(startIdx, endIdx)
    + '\nmodule.exports = { getProgress, catalogStepDesc };';
  const sandbox = { module: { exports: {} }, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.module.exports;
}

test('getProgress(): does NOT add a catalog step when catalog is not enabled', () => {
  const { getProgress } = loadHelpers();
  const { steps, completedCount } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: { enabled: false },
  });
  assert.equal(steps.length, 3, 'a tenant that never enabled WA Catalog must keep the original 3-step tracker');
  assert.equal(completedCount, 3);
});

test('getProgress(): does NOT add a catalog step when catalog health is unavailable (null)', () => {
  const { getProgress } = loadHelpers();
  const { steps } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: null,
  });
  assert.equal(steps.length, 3, 'a missing/failed catalog health fetch must not add a phantom step');
});

test('getProgress(): appends a 4th "Catalog Connected" step when enabled, but catalog readiness is not evaluated until the bot is fully live', () => {
  const { getProgress } = loadHelpers();
  const { steps, completedCount } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: false },
    isActive: false,
    catalog: { enabled: true, catalogId: null, lastSyncedAt: null, lastSyncError: null },
  });
  assert.equal(steps.length, 4);
  assert.equal(steps[3].key, 'catalog');
  assert.equal(completedCount, 1);
});

test('getProgress(): catalog step is "active" (not done) once the bot is live but catalogId is not yet set', () => {
  const { getProgress } = loadHelpers();
  const { completedCount, steps } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: { enabled: true, catalogId: null, lastSyncedAt: null, lastSyncError: null },
  });
  assert.equal(completedCount, 3, 'completedCount must stay at 3 (not 4) so the catalog step renders as in-progress, not done');
  assert.equal(steps.length, 4);
});

test('getProgress(): catalog step is "active" (not done) when catalogId is set but a sync error is present', () => {
  const { getProgress } = loadHelpers();
  const { completedCount } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: { enabled: true, catalogId: 'cat_123', lastSyncedAt: new Date().toISOString(), lastSyncError: 'GRAPH_ERROR (400)' },
  });
  assert.equal(completedCount, 3, 'a live sync error must keep the catalog step from showing as done');
});

test('getProgress(): catalog step is "done" once catalogId is set, a sync has completed, and no error is present', () => {
  const { getProgress } = loadHelpers();
  const { completedCount, steps } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: { enabled: true, catalogId: 'cat_123', lastSyncedAt: new Date().toISOString(), lastSyncError: null, itemsSkipped: 0 },
  });
  assert.equal(completedCount, 4);
  assert.equal(completedCount, steps.length, 'reaching steps.length is what makes every step, including the last, render as done rather than spinning');
});

test('getProgress(): catalog step is still "done" even with skipped items — those are a footnote, not a blocker', () => {
  const { getProgress } = loadHelpers();
  const { completedCount } = getProgress({
    hasRequest: false,
    wa: { phoneNumberId: 'x', connected: true },
    isActive: true,
    catalog: { enabled: true, catalogId: 'cat_123', lastSyncedAt: new Date().toISOString(), lastSyncError: null, itemsSkipped: 11 },
  });
  assert.equal(completedCount, 4, 'items skipped for missing image/price is expected steady-state, not a sync failure');
});

test('catalogStepDesc(): reflects the real health payload rather than a generic message', () => {
  const { catalogStepDesc } = loadHelpers();
  assert.match(catalogStepDesc(null), /checking/i);
  assert.match(catalogStepDesc({ catalogId: null }), /admin/i);
  assert.match(catalogStepDesc({ catalogId: 'x', lastSyncError: 'GRAPH_ERROR (400)' }), /GRAPH_ERROR \(400\)/);
  assert.match(catalogStepDesc({ catalogId: 'x', lastSyncedAt: null, lastSyncError: null }), /waiting for the first sync/i);
  assert.match(catalogStepDesc({ catalogId: 'x', lastSyncedAt: new Date().toISOString(), lastSyncError: null, itemsSkipped: 3 }), /3 item/);
  assert.match(catalogStepDesc({ catalogId: 'x', lastSyncedAt: new Date().toISOString(), lastSyncError: null, itemsSkipped: 0 }), /synced and live/i);
});

test('WhatsAppPage.jsx: fetches catalog health via catalogApi.health() on both mount and manual refresh', () => {
  const occurrences = src.split('catalogApi.health()').length - 1;
  assert.ok(occurrences >= 2, 'catalog health must be fetched both on initial mount and inside handleRefresh, matching the pattern already used for bizApi/requestStatus');
});
