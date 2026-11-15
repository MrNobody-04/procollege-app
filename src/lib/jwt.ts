// src/lib/jwt.ts
// Standard HS256 JWT Implementation via Edge-Compatible Web Crypto

export interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

export interface JwtPayload {
  id: string;
  email?: string;
  role: string;
  institution_id?: string;
  college_id?: string;
  institution_name?: string;
  iat: number; // in seconds
  exp: number; // in seconds
  [key: string]: unknown;
}

export interface LegacyTokenPayload {
  id?: string;
  email?: string;
  role?: string;
  institution_id?: string;
  institution_name?: string;
  ts?: number; // legacy in milliseconds
  iat?: number; // fallback in seconds
  [key: string]: unknown;
}

export interface LegacyVerificationOptions {
  allowLegacyTokens?: boolean | string;
  legacyTokenCutoff?: string | number; // ISO string, ms, or seconds
  nowMs?: number;
}

export const JWT_SESSION_DURATION_SECONDS = 7 * 86400; // 7 days (604,800 seconds)

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign payload to produce standard HS256 JWT.
 * Fails loudly if secret is empty or unset.
 */
export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'> & Partial<Pick<JwtPayload, 'iat' | 'exp'>>,
  secret: string | undefined,
  expiresInSeconds: number = JWT_SESSION_DURATION_SECONDS
): Promise<string> {
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('[SECURITY FATAL] JWT_SECRET environment variable is missing or empty. Cannot issue signed tokens.');
  }

  const enc = new TextEncoder();
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    id: String(payload.id),
    role: String(payload.role),
    iat: payload.iat ?? nowSeconds,
    exp: payload.exp ?? (payload.iat ? payload.iat + expiresInSeconds : nowSeconds + expiresInSeconds),
  } as JwtPayload;

  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(fullPayload)));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verify HS256 JWT signature and expiration.
 * Fails loudly if secret is empty or unset.
 */
export async function verifyJwt(
  token: string,
  secret: string | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): Promise<{ valid: boolean; payload?: JwtPayload; error?: string }> {
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error('[SECURITY FATAL] JWT_SECRET environment variable is missing or empty. Cannot verify tokens.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT: Expected 3 dot-separated parts' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const enc = new TextEncoder();
  const dataToVerify = `${headerB64}.${payloadB64}`;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(dataToVerify)
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as JwtPayload;

    if (payload.exp && typeof payload.exp === 'number' && nowSeconds > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `JWT verification failed: ${message}` };
  }
}

/**
 * Validates legacy tok_ token rules:
 * - Controlled by ALLOW_LEGACY_TOKENS (default false)
 * - Must be before LEGACY_TOKEN_CUTOFF (deploy time + 24 hours)
 * - Must have ts not older than 30 days (ts is in milliseconds, compared against 30 days in ms)
 * - Returns only the userId; claims must be resolved from DB.
 */
export function validateLegacyTokenPayload(
  rawToken: string,
  options: LegacyVerificationOptions = {}
): { valid: boolean; userId?: string; error?: string } {
  const allowLegacy = options.allowLegacyTokens === true || String(options.allowLegacyTokens).toLowerCase() === 'true';
  if (!allowLegacy) {
    return { valid: false, error: 'Legacy tokens are no longer accepted. Please log in again.' };
  }

  const nowMs = options.nowMs ?? Date.now();

  // Check hard cutoff: Must be set and valid, otherwise reject legacy tokens immediately
  if (!options.legacyTokenCutoff) {
    return { valid: false, error: 'Legacy token cutoff is not configured. Legacy tokens are rejected.' };
  }

  let cutoffMs: number;
  if (typeof options.legacyTokenCutoff === 'number') {
    cutoffMs = options.legacyTokenCutoff < 1e12 ? options.legacyTokenCutoff * 1000 : options.legacyTokenCutoff;
  } else {
    cutoffMs = new Date(String(options.legacyTokenCutoff)).getTime();
  }

  if (isNaN(cutoffMs) || nowMs > cutoffMs) {
    return { valid: false, error: 'Legacy token sunset window has expired or cutoff is invalid. Please log in again.' };
  }

  // Parse payload
  let payload: LegacyTokenPayload;
  try {
    const stripped = rawToken.replace(/^tok_/, '').trim();
    const base64 = stripped.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    payload = JSON.parse(jsonStr);
  } catch {
    return { valid: false, error: 'Malformed legacy token' };
  }

  if (!payload || typeof payload !== 'object' || !payload.id) {
    return { valid: false, error: 'Legacy token does not contain a valid user ID' };
  }

  // Unit difference handling:
  // Legacy tokens use `ts` in milliseconds. If `iat` is present instead, it is in seconds.
  const tokenTimeMs = payload.ts
    ? Number(payload.ts)
    : payload.iat
    ? Number(payload.iat) * 1000
    : 0;

  const THIRTY_DAYS_MS = 30 * 86400 * 1000;
  if (tokenTimeMs > 0 && (nowMs - tokenTimeMs > THIRTY_DAYS_MS)) {
    return { valid: false, error: 'Legacy token is older than 30 days. Please log in again.' };
  }

  // Return strictly userId; never trust roles or tenant claims from legacy payload
  return { valid: true, userId: String(payload.id) };
}
