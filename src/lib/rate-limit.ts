/**
 * In-memory sliding-window rate limiter.
 * Works per-process (single Azure App Service instance / local DGX).
 * No external dependencies required.
 */

interface RLWindow {
  count: number;
  resetAt: number;
}

interface LockoutEntry {
  lockedUntil: number;
  failCount: number;
  firstFailAt: number;
}

// Store keyed by "<route>:<ip>"
const windows = new Map<string, RLWindow>();
const lockouts = new Map<string, LockoutEntry>();

// Track lockout hits per IP (for auto-block escalation)
const lockoutHits = new Map<string, { count: number; since: number }>();

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** For login: max failed attempts before lockout */
  maxFails?: number;
  /** Lockout duration in ms (default 15 min) */
  lockoutMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Set when IP is locked out (login endpoint) */
  lockedUntil?: number;
  /** How many lockout episodes hit in the last hour (used for auto-block) */
  lockoutHits?: number;
}

/**
 * Check and increment rate limit for a given IP + route key.
 */
export function checkRateLimit(
  ip: string,
  routeKey: string,
  config: RateLimitConfig,
): RateLimitResult {
  const key = `${routeKey}:${ip}`;
  const now = Date.now();

  // ── Lockout check (login endpoint) ──────────────────────────────────────────
  if (config.maxFails !== undefined) {
    const lockout = lockouts.get(key);
    if (lockout && now < lockout.lockedUntil) {
      return { allowed: false, remaining: 0, resetAt: lockout.lockedUntil, lockedUntil: lockout.lockedUntil };
    }
  }

  // ── Sliding window ───────────────────────────────────────────────────────────
  let win = windows.get(key);
  if (!win || now >= win.resetAt) {
    win = { count: 0, resetAt: now + config.windowMs };
    windows.set(key, win);
  }

  if (win.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: win.resetAt };
  }

  win.count++;
  return { allowed: true, remaining: config.max - win.count, resetAt: win.resetAt };
}

/**
 * Record a failed login attempt for the given IP.
 * Returns the updated lockout entry if a lockout was triggered.
 */
export function recordFailedLogin(
  ip: string,
  routeKey = 'login',
  maxFails = 5,
  lockoutMs = 15 * 60 * 1000,
): { locked: boolean; lockedUntil?: number; lockoutHitCount?: number } {
  const key = `${routeKey}:${ip}`;
  const now = Date.now();

  let entry = lockouts.get(key);
  if (!entry) {
    entry = { lockedUntil: 0, failCount: 0, firstFailAt: now };
  }

  // Reset if previous lockout expired
  if (entry.lockedUntil > 0 && now >= entry.lockedUntil) {
    entry = { lockedUntil: 0, failCount: 0, firstFailAt: now };
  }

  entry.failCount++;
  lockouts.set(key, entry);

  if (entry.failCount >= maxFails) {
    entry.lockedUntil = now + lockoutMs;
    lockouts.set(key, entry);

    // Track lockout episodes per IP for auto-block
    const hitKey = `lockouthits:${ip}`;
    let hits = lockoutHits.get(hitKey) ?? { count: 0, since: now };
    if (now - hits.since > 60 * 60 * 1000) hits = { count: 0, since: now }; // reset after 1h
    hits.count++;
    lockoutHits.set(hitKey, hits);

    return { locked: true, lockedUntil: entry.lockedUntil, lockoutHitCount: hits.count };
  }

  return { locked: false };
}

/**
 * Clear a login lockout for an IP (on successful login).
 */
export function clearLoginLockout(ip: string, routeKey = 'login'): void {
  lockouts.delete(`${routeKey}:${ip}`);
}

/**
 * Purge expired entries to prevent unbounded memory growth.
 * Call periodically or on startup.
 */
export function purgeExpired(): void {
  const now = Date.now();
  for (const key of Array.from(windows.keys())) {
    const win = windows.get(key)!;
    if (now >= win.resetAt) windows.delete(key);
  }
  for (const key of Array.from(lockouts.keys())) {
    const entry = lockouts.get(key)!;
    if (entry.lockedUntil > 0 && now >= entry.lockedUntil && entry.failCount < 5) {
      lockouts.delete(key);
    }
  }
}

// Auto-purge every 10 minutes (only in Node.js runtime)
if (typeof setInterval !== 'undefined') {
  setInterval(purgeExpired, 10 * 60 * 1000);
}
