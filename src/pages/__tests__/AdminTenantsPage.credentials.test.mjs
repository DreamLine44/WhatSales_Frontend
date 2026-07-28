// pages/__tests__/AdminTenantsPage.credentials.test.mjs
//
// Regression tests for [CRED-MODEL-8FIELD-1] / [CRED-VALIDATION-1]:
//   - `businessId` (Meta Business Manager ID) was missing from both the
//     Create and Edit tenant forms entirely.
//   - `catalogId` was Edit-only, forcing a second Edit step for every new
//     tenant instead of being collectible at creation time.
//   - The submitted-vs-confirmed mismatch check that already existed for
//     `catalogId` needed to extend to `businessId` and `wabaId`, since an
//     ID mix-up in exactly those fields (a WABA ID sitting in the catalogId
//     slot) is the bug this whole credential-model upgrade stems from.
//
// AdminTenantsPage.jsx's submit()/saveWA() aren't standalone pure functions —
// they close over React state (form, setForm, tenant) and imperative calls
// (adminApi, toast) that can't be cleanly vm-sandboxed the way
// WhatsAppPage.progress.test.mjs extracts getProgress()/catalogStepDesc().
// So, matching that file's fallback strategy for its last test (asserting
// `catalogApi.health()` appears the expected number of times rather than
// executing it), these are structural regression tests against the real
// source text: they pin down the exact code shape a reviewer would grep
// for, scoped to the specific function body it must appear in — not just
// "the string exists somewhere in the file".
//
// Run with: node --test src/pages/__tests__/*.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../admin/AdminTenantsPage.jsx', import.meta.url), 'utf8');

function slice(startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  const end   = src.indexOf(endMarker);
  assert.notEqual(start, -1, `marker not found in source: ${startMarker}`);
  assert.notEqual(end, -1, `marker not found in source: ${endMarker}`);
  assert.ok(end > start, `end marker "${endMarker}" appears before start marker "${startMarker}"`);
  return src.slice(start, end);
}

const createSubmitBody = () =>
  slice('const submit = async () => {', 'const selectedMode = SUPPORTED_MODES.find');

// [AUDIT-FIX-STEP-SPLIT-1] businessId/catalogId moved from Step 2 to a new
// Step 3 when the create wizard was split into 3 input steps (was 2) — the
// old step 2 crammed WhatsApp core creds + Meta/catalog extras onto one
// screen. Marker text and range updated to match; this is a real move, not
// just a rename, so the tests below now check Step 3, not Step 2.
const createStep3Jsx = () =>
  slice('{/* Step 3 — Meta app & catalog extras */}', '{/* Step 4');

const editSaveWABody = () =>
  slice('const saveWA = async () => {', 'const verifyWA = async () => {');

// ── Create modal: businessId ────────────────────────────────────────────────

test('Create modal: form state seeds meta.businessId alongside meta.appId', () => {
  assert.match(
    src,
    /meta:\s*\{\s*appId:\s*'',\s*businessId:\s*''\s*\}/,
    'CreateTenantModal must initialize form.meta.businessId',
  );
});

test('Create modal: submit() omits meta.businessId from the payload when blank (matches appId behavior)', () => {
  const body = createSubmitBody();
  assert.match(
    body,
    /if \(form\.meta\.appId\.trim\(\)\)\s*metaPayload\.appId\s*=\s*form\.meta\.appId\.trim\(\);/,
    'appId must still be omitted when blank',
  );
  assert.match(
    body,
    /if \(form\.meta\.businessId\.trim\(\)\)\s*metaPayload\.businessId\s*=\s*form\.meta\.businessId\.trim\(\);/,
    'businessId must follow the identical omit-if-blank pattern as appId',
  );
  assert.match(
    body,
    /if \(Object\.keys\(metaPayload\)\.length\)\s*payload\.meta\s*=\s*metaPayload;/,
    'payload.meta must only be attached when at least one meta field was actually provided',
  );
});

test('Create modal: catalogId is sent under waCatalog only when non-blank (same "omit if blank" pattern as whatsapp/meta)', () => {
  const body = createSubmitBody();
  assert.match(
    body,
    /if \(form\.waCatalog\.catalogId\.trim\(\)\)\s*\{\s*payload\.waCatalog\s*=\s*\{\s*catalogId:\s*form\.waCatalog\.catalogId\.trim\(\)\s*\};\s*\}/,
    'catalogId must be omitted from the create payload entirely when left blank',
  );
});

test('Create modal JSX (Step 3): renders a Meta Business ID input wired to setMeta(\'businessId\', ...)', () => {
  const step3 = createStep3Jsx();
  assert.match(step3, /Meta Business ID \(optional\)/);
  assert.match(step3, /setMeta\('businessId', e\.target\.value\)/);
});

test('Create modal JSX (Step 3): renders a WhatsApp Catalog ID input — catalogId is no longer Edit-only', () => {
  const step3 = createStep3Jsx();
  assert.match(step3, /WhatsApp Catalog ID \(optional\)/);
  assert.match(step3, /setCatalog\('catalogId', e\.target\.value\)/);
});

// ── Edit modal: businessId ──────────────────────────────────────────────────

test('Edit modal: form state pre-fills meta.businessId from initialTenant, exactly like appId (unlike appSecret)', () => {
  assert.match(
    src,
    /businessId:\s*initialTenant\.meta\?\.businessId\s*\|\|\s*''/,
    'businessId is not sensitive, so it must pre-fill from the tenant record on mount',
  );
});

test('Edit modal: saveWA() deletes meta.businessId from the payload when blank, same guard as appId/appSecret', () => {
  const body = editSaveWABody();
  assert.match(body, /if \(!metaPayload\.appId\)\s*delete metaPayload\.appId;/);
  assert.match(body, /if \(!metaPayload\.businessId\)\s*delete metaPayload\.businessId;/);
  assert.match(body, /if \(!metaPayload\.appSecret\)\s*delete metaPayload\.appSecret;/);
});

test('Edit modal: businessId is NOT cleared after a successful save (unlike accessToken/webhookSecret/appSecret)', () => {
  const body = editSaveWABody();

  // The real secrets must be explicitly cleared post-save...
  assert.match(body, /setWA\('accessToken', ''\);/);
  assert.match(body, /setWA\('webhookSecret', ''\);/);
  assert.match(body, /setMeta\('appSecret', ''\);/);

  // ...but businessId must never appear in a post-save clear call.
  assert.doesNotMatch(
    body,
    /setMeta\('businessId', ''\)/,
    'businessId is not a secret and must remain populated after a successful save',
  );
});

// ── Mismatch detection: extended from catalogId to businessId + wabaId ─────

test('Edit modal: submitted-vs-confirmed mismatch detection covers catalogId, businessId, AND wabaId', () => {
  const body = editSaveWABody();
  assert.match(body, /const catalogIdMismatch\s*=/);
  assert.match(body, /const businessIdMismatch\s*=/);
  assert.match(body, /const wabaIdMismatch\s*=/);
});

test('Edit modal: a businessId or wabaId mismatch surfaces its own toast.error (never a silent success)', () => {
  const body = editSaveWABody();
  assert.match(body, /if \(businessIdMismatch\)\s*\{[\s\S]*?toast\.error\(/, 'businessId mismatch must produce an explicit error toast');
  assert.match(body, /if \(wabaIdMismatch\)\s*\{[\s\S]*?toast\.error\(/, 'wabaId mismatch must produce an explicit error toast');
});

test('Edit modal: the unqualified "saved" success toast is gated on ALL THREE mismatch flags, not just catalogId', () => {
  const body = editSaveWABody();
  assert.match(
    body,
    /if \(!catalogIdMismatch && !businessIdMismatch && !wabaIdMismatch\)\s*\{\s*toast\.success\('WhatsApp credentials saved'\);/,
    'a businessId/wabaId mismatch must block the generic success toast, same as catalogId already did',
  );
});

// ── webhookSecret: left in place pending backend confirmation ──────────────

test('webhookSecret is intentionally NOT removed — no tenantController.js was available to confirm the backend actually dropped it', () => {
  // This is a floor, not an exact count: if this legitimately drops (backend
  // confirmed removal), update this test deliberately alongside removing the
  // field — it should never disappear as a side effect of an unrelated change.
  const occurrences = src.split('webhookSecret').length - 1;
  assert.ok(
    occurrences >= 6,
    `expected webhookSecret to still appear across both modals + the payload-cleanup block (found ${occurrences})`,
  );
});

// ── Inline validation errors ────────────────────────────────────────────────

test('Both modals surface backend per-field validation errors via a local FieldError component', () => {
  const fieldErrorDefs = src.match(/function FieldError\(/g) || [];
  assert.equal(fieldErrorDefs.length, 1, 'FieldError should be defined once and reused by both modals');

  const usages = src.match(/<FieldError msg=\{fieldErrors\./g) || [];
  assert.ok(usages.length >= 8, `expected FieldError to be wired to multiple fields across both modals (found ${usages.length})`);
});
