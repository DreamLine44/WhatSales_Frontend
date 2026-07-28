// pages/__tests__/api.errorInterceptor.test.mjs
//
// Regression test for [CRED-VALIDATION-1]: api.js's shared errorInterceptor
// used to reject with a bare `new Error(msg)`, discarding the original axios
// response entirely. That meant any caller reading `err.response?.data?...`
// downstream of `http`/`adminHttp` — including AdminTenantsPage.jsx's new
// per-field `lastValidationError` display — always got `undefined`, silently.
//
// errorInterceptor is a small, pure function (no closures over component
// state), so — unlike AdminTenantsPage.jsx's submit()/saveWA() — it can be
// extracted and actually EXECUTED via vm rather than pattern-matched. This
// test would have caught the original bug: it fails if `err.response` is
// ever dropped again.
//
// Run with: node --test src/pages/__tests__/*.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync(new URL('../../api.js', import.meta.url), 'utf8');

function loadErrorInterceptor() {
  const startIdx = src.indexOf('const errorInterceptor');
  const endIdx   = src.indexOf('// [AUDIT-FIX-SESSION-EXPIRY]');
  assert.notEqual(startIdx, -1, 'errorInterceptor should exist in api.js');
  assert.notEqual(endIdx, -1, 'the AUDIT-FIX-SESSION-EXPIRY comment should exist as the boundary after errorInterceptor');

  const code = src.slice(startIdx, endIdx) + '\nmodule.exports = { errorInterceptor };';
  const sandbox = { module: { exports: {} }, Promise, Error };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.module.exports;
}

test('errorInterceptor: preserves err.response on the rejected Error, not just its message', async () => {
  const { errorInterceptor } = loadErrorInterceptor();
  const fakeAxiosError = {
    message: 'Request failed with status code 400',
    response: {
      status: 400,
      data: {
        error: 'Validation failed',
        lastValidationError: { businessId: 'businessId looks wrong' },
      },
    },
  };

  await assert.rejects(
    () => Promise.reject(fakeAxiosError).catch(errorInterceptor),
    (err) => {
      assert.equal(err.message, 'Validation failed', 'message extraction behavior must be unchanged');
      assert.ok(err.response, 'err.response must survive the interceptor — this is the regression the bug caused');
      assert.equal(err.response.data.lastValidationError.businessId, 'businessId looks wrong');
      return true;
    },
  );
});

test('errorInterceptor: falls back to err.message, then "Network error", when no response body is present', async () => {
  const { errorInterceptor } = loadErrorInterceptor();

  await assert.rejects(
    () => Promise.reject({ message: 'timeout of 15000ms exceeded' }).catch(errorInterceptor),
    /timeout of 15000ms exceeded/,
  );

  await assert.rejects(
    () => Promise.reject({}).catch(errorInterceptor),
    /Network error/,
  );
});
