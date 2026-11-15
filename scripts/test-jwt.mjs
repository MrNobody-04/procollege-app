// scripts/test-jwt.mjs
// Unit tests for Web Crypto HS256 JWT & Legacy Token Rules

import assert from 'node:assert/strict';
import { signJwt, verifyJwt, validateLegacyTokenPayload, base64UrlEncode } from '../src/lib/jwt.ts';

const TEST_SECRET = 'test-secret-key-32-chars-long-example!';

async function runTests() {
  console.log('--- Running JWT & Token Unit Tests ---');

  // 1. Sign & Verify Valid Token
  const payload = {
    id: 'user_123',
    email: 'test@example.com',
    role: 'admin',
    institution_id: 'col_padmashree',
    college_id: 'col_padmashree',
  };

  const token = await signJwt(payload, TEST_SECRET);
  assert(token.split('.').length === 3, 'JWT must have 3 parts');

  const verifyRes = await verifyJwt(token, TEST_SECRET);
  assert.equal(verifyRes.valid, true, 'Verification must succeed for genuine token');
  assert.equal(verifyRes.payload?.id, 'user_123');
  assert.equal(verifyRes.payload?.role, 'admin');
  assert.equal(verifyRes.payload?.institution_id, 'col_padmashree');
  assert(verifyRes.payload?.iat, 'iat must be populated');
  assert(verifyRes.payload?.exp, 'exp must be populated');
  assert.equal(verifyRes.payload.exp - verifyRes.payload.iat, 7 * 86400, 'Session length must be 7 days');
  console.log('✓ 1. Valid HS256 token sign & verify passed');

  // 2. Signature Tampering Detection
  const tamperedToken = token.slice(0, -5) + 'abcde';
  const tamperRes = await verifyJwt(tamperedToken, TEST_SECRET);
  assert.equal(tamperRes.valid, false, 'Tampered signature must be rejected');
  console.log('✓ 2. Tampered signature rejection passed');

  // 3. Payload Tampering Detection
  const parts = token.split('.');
  const forgedPayload = JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url').toString()), role: 'developer' });
  const forgedPayloadB64 = base64UrlEncode(new TextEncoder().encode(forgedPayload));
  const forgedToken = `${parts[0]}.${forgedPayloadB64}.${parts[2]}`;
  const forgeRes = await verifyJwt(forgedToken, TEST_SECRET);
  assert.equal(forgeRes.valid, false, 'Tampered payload with original signature must be rejected');
  console.log('✓ 3. Tampered payload rejection passed');

  // 4. Token Expiration
  const expiredToken = await signJwt(
    { id: 'usr_exp', role: 'student', iat: 1000, exp: 2000 },
    TEST_SECRET
  );
  const expRes = await verifyJwt(expiredToken, TEST_SECRET, 3000);
  assert.equal(expRes.valid, false, 'Expired token must be rejected');
  assert.equal(expRes.error, 'Token has expired');
  console.log('✓ 4. Expiration check passed');

  // 5. Fail Loudly on Missing Secret
  await assert.rejects(
    async () => signJwt(payload, ''),
    /JWT_SECRET environment variable is missing/,
    'Must throw on empty secret when signing'
  );
  await assert.rejects(
    async () => verifyJwt(token, undefined),
    /JWT_SECRET environment variable is missing/,
    'Must throw on empty secret when verifying'
  );
  console.log('✓ 5. Fail loudly on missing secret passed');

  // 6. Legacy Token: Valid when ALLOW_LEGACY_TOKENS=true
  const legacyPayload = { id: 'usr_legacy', role: 'student', ts: Date.now() - 1000 };
  const legacyTokenStr = 'tok_' + Buffer.from(JSON.stringify(legacyPayload)).toString('base64');
  const legRes1 = validateLegacyTokenPayload(legacyTokenStr, { allowLegacyTokens: true });
  assert.equal(legRes1.valid, true);
  assert.equal(legRes1.userId, 'usr_legacy');
  console.log('✓ 6. Legacy token acceptance when allowed passed');

  // 7. Legacy Token: Rejected when ALLOW_LEGACY_TOKENS=false
  const legRes2 = validateLegacyTokenPayload(legacyTokenStr, { allowLegacyTokens: false });
  assert.equal(legRes2.valid, false);
  console.log('✓ 7. Legacy token rejection when disabled passed');

  // 8. Legacy Token: Rejected after Cutoff
  const pastCutoff = Date.now() - 5000;
  const legRes3 = validateLegacyTokenPayload(legacyTokenStr, {
    allowLegacyTokens: true,
    legacyTokenCutoff: pastCutoff,
  });
  assert.equal(legRes3.valid, false);
  assert.match(legRes3.error || '', /sunset window has expired/);
  console.log('✓ 8. Legacy token rejection after cutoff passed');

  // 9. Legacy Token: Rejected if > 30 days old
  const oldLegacyPayload = { id: 'usr_old', role: 'student', ts: Date.now() - (35 * 86400 * 1000) };
  const oldTokenStr = 'tok_' + Buffer.from(JSON.stringify(oldLegacyPayload)).toString('base64');
  const legRes4 = validateLegacyTokenPayload(oldTokenStr, { allowLegacyTokens: true });
  assert.equal(legRes4.valid, false);
  assert.match(legRes4.error || '', /older than 30 days/);
  console.log('✓ 9. Legacy token rejection when > 30 days passed');

  console.log('ALL 9 JWT & TOKEN UNIT TESTS PASSED!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
