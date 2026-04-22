/**
 * Append-only security audit log.
 * Writes to /tmp/qfph/security/audit.jsonl (one JSON object per line).
 * Also keeps last 500 events in memory for the admin UI.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const SECURITY_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'security')
  : path.join(os.tmpdir(), 'qfph', 'security');

const AUDIT_FILE = path.join(SECURITY_DIR, 'audit.jsonl');
const MAX_MEMORY = 500;

export type AuditEventType =
  | 'login_success'
  | 'login_fail'
  | 'login_lockout'
  | 'logout'
  | 'rate_limit_hit'
  | 'ip_blocked'
  | 'ip_unblocked'
  | 'upload_attempt'
  | 'admin_action'
  | 'request_blocked';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  ip: string;
  detail: string;
  ts: string; // ISO 8601
}

const recentEvents: AuditEvent[] = [];
// Counters reset lazily (loaded from memory only — not persisted between restarts)
let rateLimitHits24h = 0;
let failedLogins24h = 0;
const counterResetAt = Date.now() + 24 * 60 * 60 * 1000;

function ensureDir() {
  if (!fs.existsSync(SECURITY_DIR)) fs.mkdirSync(SECURITY_DIR, { recursive: true });
}

function resetCountersIfNeeded() {
  if (Date.now() > counterResetAt) {
    rateLimitHits24h = 0;
    failedLogins24h = 0;
  }
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function auditLog(
  type: AuditEventType,
  ip: string,
  detail: string,
): AuditEvent {
  resetCountersIfNeeded();

  const event: AuditEvent = {
    id: generateId(),
    type,
    ip,
    detail,
    ts: new Date().toISOString(),
  };

  // In-memory ring buffer
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_MEMORY) recentEvents.pop();

  // Counter updates
  if (type === 'rate_limit_hit') rateLimitHits24h++;
  if (type === 'login_fail' || type === 'login_lockout') failedLogins24h++;

  // Persist to disk (non-blocking, best-effort)
  try {
    ensureDir();
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // non-fatal
  }

  return event;
}

export function getRecentEvents(limit = 100): AuditEvent[] {
  return recentEvents.slice(0, limit);
}

export function getSecurityStats(): {
  rateLimitHits24h: number;
  failedLogins24h: number;
  lastEventTs: string | null;
} {
  return {
    rateLimitHits24h,
    failedLogins24h,
    lastEventTs: recentEvents[0]?.ts ?? null,
  };
}
