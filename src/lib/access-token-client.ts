/**
 * Browser-side access-token storage (v2.0).
 *
 * After paying ₱5 the user receives a signed token (issued by
 * /api/payment/verify-screenshot or /api/payment/validate-ref) that proves
 * payment for 48h. The token unlocks Local Mode + local PDF download — no
 * form data is ever sent back to the server.
 */

const KEY = 'qfph_access_token_v2';

export interface StoredAccessToken {
  token: string;
  refNo: string;
  amount: number;
  expiresAt: number; // ms since epoch
}

export function readAccessToken(): StoredAccessToken | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccessToken;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.expiresAt) return null;
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeAccessToken(t: StoredAccessToken): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* ignore quota */
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function formatTimeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
