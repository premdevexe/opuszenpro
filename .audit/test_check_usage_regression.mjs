/**
 * OpusZenvix Check Usage Regression Test Suite
 *
 * Verifies:
 * 1. Valid local keys (5x, 20x) return 200 with complete telemetry
 * 2. Valid upstream keys (e.g. sk-ant-opm-...) return 200 with provider telemetry
 * 3. Token normalization: Bearer prefix, outer quotes, leading/trailing whitespace
 * 4. Internal key ID lookup: resolving by UUID/ID returns canonical key record
 * 5. Zero-usage keys: fresh keys with 0 requests or rolling window at 0 tokens
 *    are verified as active with 0 used tokens (never reported as missing or 404)
 * 6. Invalid keys: unknown tokens return 404 with code 'KEY_NOT_FOUND'
 * 7. Revoked keys: return 200 with status: 'revoked', isActive: false (never 404)
 * 8. Database failures: simulated DB connection/query errors return 503 DATABASE_ERROR,
 *    never misreporting an infrastructure failure as a missing key
 * 9. Security: sensitive credentials remain redacted in payloads and logs
 */

import http from 'node:http';
import { supabase } from '../server/lib/supabase.js';
import { handleKeyStatusInspection, normalizeToken } from '../server/routes/keys.js';
import { calculateSlidingWindowUsage } from '../server/lib/quotaEngine.js';

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const mark = pass ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` (${detail})` : ''}`);
}

// Helper to create mock Express request & response objects
function createMockReqRes({ body = {}, query = {}, params = {}, headers = {} } = {}) {
  const req = { body, query, params, headers };
  const res = {
    statusCode: 200,
    headers: {},
    bodyData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    type(t) {
      this.headers['content-type'] = t;
      return this;
    },
    json(obj) {
      this.bodyData = obj;
      return this;
    },
    send(data) {
      try {
        this.bodyData = JSON.parse(data);
      } catch {
        this.bodyData = data;
      }
      return this;
    }
  };
  return { req, res };
}

console.log('=======================================================');
console.log('STARTING OPUSZENVIX CHECK USAGE REGRESSION TEST SUITE');
console.log('=======================================================');

// ---------------------------------------------------------------------
// TEST GROUP 1: Token Normalization Helper
// ---------------------------------------------------------------------
console.log('\n--- 1. TOKEN NORMALIZATION TESTS ---');
{
  const rawKey = 'opm-live-5x-9f8a3c2e1b4d7f0a';
  record('Preserves already clean token', normalizeToken(rawKey) === rawKey);
  record('Strips Bearer prefix with space', normalizeToken(`Bearer ${rawKey}`) === rawKey);
  record('Strips lowercase bearer prefix', normalizeToken(`bearer ${rawKey}`) === rawKey);
  record('Strips double quotes', normalizeToken(`"${rawKey}"`) === rawKey);
  record('Strips single quotes', normalizeToken(`'${rawKey}'`) === rawKey);
  record('Strips Bearer inside quotes', normalizeToken(`"Bearer ${rawKey}"`) === rawKey);
  record('Trims leading and trailing spaces', normalizeToken(`   ${rawKey}   \n`) === rawKey);
}

// ---------------------------------------------------------------------
// TEST GROUP 2: Valid Keys (Local Mock DB & Upstream Provider)
// ---------------------------------------------------------------------
console.log('\n--- 2. VALID API KEYS TESTS ---');
{
  // 2a. Standard Dev Key (5x Tier) in local DB
  const { req, res } = createMockReqRes({ body: { key: 'opm-live-5x-9f8a3c2e1b4d7f0a' } });
  await handleKeyStatusInspection(req, res);
  const data = res.bodyData;
  record('Local Dev Key 5x returns HTTP 200', res.statusCode === 200);
  record('Returns success: true and status: ok', data?.success === true && data?.status === 'ok');
  record('Key status is active', data?.keyStatus === 'active' && data?.key?.status === 'active');
  record('Verified tier allocation is 5x', data?.key?.tier === '5x');
  record('Token limit matches 5x quota (5M)', data?.key?.window_token_limit === 5000000);
  record('Returns masked token format', typeof data?.masked_token === 'string' && data.masked_token.includes('...'));

  // 2b. Heavy Agentic Key (20x Tier) in local DB
  const { req: req20, res: res20 } = createMockReqRes({ body: { key: 'opm-live-20x-8d7e6f5c4b3a2109' } });
  await handleKeyStatusInspection(req20, res20);
  record('Local Agent Key 20x returns HTTP 200', res20.statusCode === 200);
  record('Verified tier allocation is 20x', res20.bodyData?.key?.tier === '20x');
  record('Token limit matches 20x quota (20M)', res20.bodyData?.key?.window_token_limit === 20000000);

  // 2c. Upstream Provider Key
  const { req: reqUp, res: resUp } = createMockReqRes({ body: { key: 'sk-ant-opm-UP_quLGun4rhgxXfsN7q8NQmjurkoiBL' } });
  await handleKeyStatusInspection(reqUp, resUp);
  record('Upstream Key sk-ant-opm-UP_qu... returns HTTP 200', resUp.statusCode === 200);
  record('Upstream Key returns provider verified plan', resUp.bodyData?.planSource === 'provider');
  record('Upstream Key status is active', resUp.bodyData?.keyStatus === 'active');
}

// ---------------------------------------------------------------------
// TEST GROUP 3: Flexible Input Formats (Bearer, Quotes, Query, Params)
// ---------------------------------------------------------------------
console.log('\n--- 3. INPUT FORMAT FLEXIBILITY TESTS ---');
{
  // 3a. Body with Bearer prefix
  const { req: r1, res: s1 } = createMockReqRes({ body: { key: 'Bearer opm-live-5x-9f8a3c2e1b4d7f0a' } });
  await handleKeyStatusInspection(r1, s1);
  record('Body key with Bearer prefix resolves to 200', s1.statusCode === 200);

  // 3b. Body key wrapped in quotes
  const { req: r2, res: s2 } = createMockReqRes({ body: { key: '"sk-ant-opm-UP_quLGun4rhgxXfsN7q8NQmjurkoiBL"' } });
  await handleKeyStatusInspection(r2, s2);
  record('Body key with double quotes resolves to 200', s2.statusCode === 200);

  // 3c. URL Slug param: /api/key-status/:token
  const { req: r3, res: s3 } = createMockReqRes({ params: { token: 'opm-live-20x-8d7e6f5c4b3a2109' } });
  await handleKeyStatusInspection(r3, s3);
  record('URL slug param :token resolves to 200', s3.statusCode === 200);

  // 3d. Query string: ?key=...
  const { req: r4, res: s4 } = createMockReqRes({ query: { key: 'opm-live-5x-9f8a3c2e1b4d7f0a' } });
  await handleKeyStatusInspection(r4, s4);
  record('Query param ?key=... resolves to 200', s4.statusCode === 200);

  // 3e. Internal UUID lookup
  const { req: r5, res: s5 } = createMockReqRes({ body: { key: '00000000-0000-0000-0000-000000000001' } });
  await handleKeyStatusInspection(r5, s5);
  record('Internal UUID lookup resolves to 200', s5.statusCode === 200);
  record('UUID lookup returns canonical key_token', s5.bodyData?.key?.key_token === 'opm-live-5x-9f8a3c2e1b4d7f0a');
}

// ---------------------------------------------------------------------
// TEST GROUP 4: Zero-Usage Keys
// ---------------------------------------------------------------------
console.log('\n--- 4. ZERO-USAGE KEYS TESTS ---');
{
  // 4a. Fresh newly-provisioned key with 0 requests and 0 window tokens used
  const freshKeyToken = 'opm-live-5x-fresh-zero-usage-test';
  await supabase.from('api_keys').insert({
    id: '00000000-0000-0000-0000-000000000099',
    name: 'Fresh Zero Usage Key',
    key_prefix: 'opm-live-5x',
    key_token: freshKeyToken,
    tier: '5x',
    status: 'active',
    rate_limit_rpm: 60,
    rate_limit_tpm: 400000,
    window_token_limit: 5000000,
    window_tokens_used: 0,
    window_started_at: new Date().toISOString(),
    window_resets_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    total_tokens_consumed: 0,
    total_requests: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString()
  });

  const { req: rZ, res: sZ } = createMockReqRes({ body: { key: freshKeyToken } });
  await handleKeyStatusInspection(rZ, sZ);
  const zData = sZ.bodyData;
  record('Zero-usage key returns HTTP 200 (not 404)', sZ.statusCode === 200);
  record('Zero-usage key reports tokensUsed === 0', zData?.key?.window_tokens_used === 0);
  record('Zero-usage key reports percentUsed === 0', zData?.key?.percentUsed === 0);
  record('Zero-usage key reports remaining tokens === limit', zData?.key?.window_tokens_remaining === 5000000);
  record('Zero-usage key reports percentRemaining === 100', zData?.key?.percentRemaining === 100);
  record('Zero-usage key has verified usage', zData?.isUsageVerified === true);

  // 4b. Upstream key with 0 usage
  const { req: rUpZ, res: sUpZ } = createMockReqRes({ body: { key: 'sk-ant-opm-UP_quLGun4rhgxXfsN7q8NQmjurkoiBL' } });
  await handleKeyStatusInspection(rUpZ, sUpZ);
  const upZData = sUpZ.bodyData;
  record('Upstream 0% usage key returns HTTP 200', sUpZ.statusCode === 200);
  record('Upstream 0% usage key reports used_tokens === 0', upZData?.key?.window_tokens_used === 0);
  record('Upstream 0% usage key reports remaining === limit', upZData?.key?.window_tokens_remaining === 5000000);

  // Clean up fresh test key
  await supabase.from('api_keys').delete().eq('key_token', freshKeyToken);
}

// ---------------------------------------------------------------------
// TEST GROUP 5: Invalid Keys (Unknown / Nonexistent)
// ---------------------------------------------------------------------
console.log('\n--- 5. INVALID KEYS TESTS ---');
{
  const { req, res } = createMockReqRes({ body: { key: 'opm-live-invalid-token-does-not-exist-12345' } });
  await handleKeyStatusInspection(req, res);
  record('Nonexistent key returns HTTP 404', res.statusCode === 404);
  record('Returns code KEY_NOT_FOUND', res.bodyData?.code === 'KEY_NOT_FOUND');
  record('Returns clear error message', typeof res.bodyData?.error === 'string' && res.bodyData.error.includes('Key not found'));

  // Empty string key returns 400 Bad Request
  const { req: rEmpty, res: sEmpty } = createMockReqRes({ body: { key: '   ' } });
  await handleKeyStatusInspection(rEmpty, sEmpty);
  record('Empty key string returns HTTP 400 Bad Request', sEmpty.statusCode === 400);
}

// ---------------------------------------------------------------------
// TEST GROUP 6: Revoked Keys
// ---------------------------------------------------------------------
console.log('\n--- 6. REVOKED KEYS TESTS ---');
{
  const revokedToken = 'opm-live-5x-revoked-test-key-999';
  await supabase.from('api_keys').insert({
    id: '00000000-0000-0000-0000-000000000088',
    name: 'Revoked Test Key',
    key_prefix: 'opm-live-5x',
    key_token: revokedToken,
    tier: '5x',
    status: 'revoked',
    rate_limit_rpm: 60,
    rate_limit_tpm: 400000,
    window_token_limit: 25000000,
    window_tokens_used: 1000,
    window_started_at: new Date().toISOString(),
    window_resets_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    total_tokens_consumed: 1000,
    total_requests: 1,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400 * 1000).toISOString()
  });

  const { req, res } = createMockReqRes({ body: { key: revokedToken } });
  await handleKeyStatusInspection(req, res);
  const data = res.bodyData;
  record('Revoked key is found and returns HTTP 200 (not 404)', res.statusCode === 200);
  record('Key status reports revoked', data?.keyStatus === 'revoked');
  record('Root key.status reports revoked', data?.key?.status === 'revoked');
  record('isActive is false for revoked key', data?.isActive === false);
  record('windowActive is false for revoked key', data?.windowActive === false);

  // Clean up revoked test key
  await supabase.from('api_keys').delete().eq('key_token', revokedToken);
}

// ---------------------------------------------------------------------
// TEST GROUP 7: Database Failure Handling
// ---------------------------------------------------------------------
console.log('\n--- 7. DATABASE FAILURE TESTS ---');
{
  // Temporarily stub supabase.from to simulate database down/failure
  const originalFrom = supabase.from;
  try {
    supabase.from = function (table) {
      if (table === 'api_keys') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: null,
                error: { message: 'Connection to Supabase PostgreSQL cluster timed out (503)' }
              })
            })
          })
        };
      }
      return originalFrom.call(supabase, table);
    };

    const { req, res } = createMockReqRes({ body: { key: 'nonexistent-db-failure-key-token-xyz' } });
    await handleKeyStatusInspection(req, res);
    record('Database failure returns HTTP 503 Service Unavailable', res.statusCode === 503);
    record('Database failure returns code DATABASE_ERROR', res.bodyData?.code === 'DATABASE_ERROR');
    record('Database failure does NOT return 404 KEY_NOT_FOUND', res.statusCode !== 404);
  } finally {
    // Restore original supabase client
    supabase.from = originalFrom;
  }
}

// ---------------------------------------------------------------------
// TEST GROUP 8: Security & Redaction
// ---------------------------------------------------------------------
console.log('\n--- 8. SECURITY & CREDENTIAL REDACTION TESTS ---');
{
  const masterKey = process.env.UPSTREAM_API_KEY;
  const { req, res } = createMockReqRes({ body: { key: 'opm-live-5x-9f8a3c2e1b4d7f0a' } });
  await handleKeyStatusInspection(req, res);
  const jsonStr = JSON.stringify(res.bodyData);
  if (masterKey) {
    record('Upstream master API key is never exposed in inspector response', !jsonStr.includes(masterKey));
  } else {
    record('Upstream master API key check skipped (unset in env)', true);
  }
  record('Inspector returns masked_token with middle characters redacted', res.bodyData?.masked_token.includes('...'));
}

// ---------------------------------------------------------------------
// SUMMARY REPORT
// ---------------------------------------------------------------------
const total = results.length;
const passed = results.filter(r => r.pass).length;
const failed = total - passed;

console.log(`\n=======================================================`);
console.log(`Check Usage Regression Suite: ${passed}/${total} passed (${failed} failed)`);
console.log(`=======================================================`);

process.exit(failed > 0 ? 1 : 0);
