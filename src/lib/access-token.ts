/**
 * Access Token (v2.0)
 *
 * After a user successfully pays the ₱5 unlock fee, the server issues a signed
 * JWT containing only the GCash ref number + amount + expiry. The token is
 * stored in the user's browser and unlocks the local PDF download — no form
 * data ever touches the server.
 *
 * Secret is derived from FORM_DATA_ENCRYPTION_KEY (already provisioned).
 */

import { SignJWT, jwtVerify } from 'jose';

const TOKEN_TTL_SECONDS = 48 * 60 * 60; // 48 hours

function getSecret(): Uint8Array {
  const hex = process.env.FORM_DATA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'FORM_DATA_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).',
    );
  }
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

export interface AccessTokenResult {
  token: string;
  /** Expiry as ms since epoch (suitable for Date constructor). */
  expiresAt: number;
}

export async function issueAccessToken(
  refNo: string,
  amount: number,
): Promise<AccessTokenResult> {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + TOKEN_TTL_SECONDS;
  const token = await new SignJWT({ ref: refNo, amt: amount })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(nowSec)
    .setExpirationTime(expSec)
    .sign(getSecret());
  return { token, expiresAt: expSec * 1000 };
}

/**
 * Verify a previously issued access token. Returns the decoded payload when
 * valid (and unexpired), or null otherwise. Used by the Kuya Quim chat
 * endpoint to gate AI access to donors only.
 */
export async function verifyAccessToken(
  token: string,
): Promise<{ ref: string; amt: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.ref !== 'string') return null;
    return { ref: payload.ref, amt: typeof payload.amt === 'number' ? payload.amt : 0 };
  } catch {
    return null;
  }
}
