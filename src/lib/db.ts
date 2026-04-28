/**
 * src/lib/db.ts
 * SQLite database singleton for QuickFormsPH reporting.
 *
 * Two tables, independently manageable:
 *   generated_pdfs  — one row per PDF code (form, user, expiry)
 *   payment_refs    — one row per payment (ref_no, amount) linked by code
 *
 * DB location:
 *   DATA_DIR env → <DATA_DIR>/qfph.db
 *   fallback     → <os.tmpdir()>/qfph/qfph.db
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

const DB_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : path.join(os.tmpdir(), 'qfph');

const DB_PATH = path.join(DB_DIR, 'qfph.db');

let _db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS generated_pdfs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL UNIQUE,
      slug        TEXT    NOT NULL,
      form_name   TEXT    NOT NULL,
      form_code   TEXT    NOT NULL,
      agency      TEXT    NOT NULL,
      full_name   TEXT    NOT NULL,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_generated_pdfs_created_at
      ON generated_pdfs (created_at DESC);

    CREATE TABLE IF NOT EXISTS payment_refs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      code       TEXT    NOT NULL,
      ref_no     TEXT,
      amount     REAL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (code) REFERENCES generated_pdfs(code) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_payment_refs_code   ON payment_refs (code);
    CREATE INDEX IF NOT EXISTS idx_payment_refs_ref_no ON payment_refs (ref_no);

    CREATE TABLE IF NOT EXISTS suggestions (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL DEFAULT '',
      email      TEXT    NOT NULL DEFAULT '',
      suggestion TEXT    NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_suggestions_status     ON suggestions (status);

    CREATE TABLE IF NOT EXISTS license_keys (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      key_code   TEXT    NOT NULL UNIQUE,
      label      TEXT    NOT NULL DEFAULT '',
      used_at    INTEGER,
      used_by_ip TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_license_keys_key_code   ON license_keys (key_code);
    CREATE INDEX IF NOT EXISTS idx_license_keys_created_at ON license_keys (created_at DESC);

    -- Referral program tables
    CREATE TABLE IF NOT EXISTS referral_config (
      id                  INTEGER PRIMARY KEY CHECK (id = 1),
      required_referrals  INTEGER NOT NULL DEFAULT 5,
      promo_expiry_hours  INTEGER NOT NULL DEFAULT 24,
      updated_at          INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS referral_users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      ref_token  TEXT    NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_referral_users_token ON referral_users (ref_token);
    CREATE INDEX IF NOT EXISTS idx_referral_users_email ON referral_users (email);

    CREATE TABLE IF NOT EXISTS referral_events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_email  TEXT    NOT NULL,
      referred_email  TEXT    NOT NULL UNIQUE,
      ip              TEXT    NOT NULL DEFAULT '',
      accepted_at     INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events (referrer_email);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT    NOT NULL,
      slug       TEXT    NOT NULL DEFAULT '',
      session_id TEXT    NOT NULL DEFAULT '',
      ip_hash    TEXT    NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_type_time ON analytics_events (event_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_slug_time ON analytics_events (slug, event_type, created_at DESC);
  `);

  // ── Migration: if generated_pdfs still has ref_no/amount columns from the
  //    old single-table schema, move the data and drop the columns.
  const cols = (_db.prepare('PRAGMA table_info(generated_pdfs)').all() as { name: string }[])
    .map((c) => c.name);
  if (cols.includes('ref_no')) {
    _db.exec(`
      INSERT OR IGNORE INTO payment_refs (code, ref_no, amount, created_at)
        SELECT code, ref_no, amount, created_at
        FROM   generated_pdfs
        WHERE  ref_no IS NOT NULL OR amount IS NOT NULL;

      ALTER TABLE generated_pdfs DROP COLUMN ref_no;
      ALTER TABLE generated_pdfs DROP COLUMN amount;
    `);
  }

  // Migration: add expires_at to license_keys if missing
  const lkCols = (_db.prepare('PRAGMA table_info(license_keys)').all() as { name: string }[]).map((c) => c.name);
  if (!lkCols.includes('expires_at')) {
    _db.exec(`ALTER TABLE license_keys ADD COLUMN expires_at INTEGER;`);
  }

  // Seed referral_config default row if not present
  _db.prepare(`
    INSERT OR IGNORE INTO referral_config (id, required_referrals, promo_expiry_hours, updated_at)
    VALUES (1, 5, 24, ?)
  `).run(Date.now());

  return _db;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDFRecord {
  id: number;
  code: string;
  slug: string;
  form_name: string;
  form_code: string;
  agency: string;
  full_name: string;
  /** Joined from payment_refs — null when no payment row exists */
  ref_no: string | null;
  amount: number | null;
  created_at: number;
  expires_at: number;
  expired: boolean;
}

export interface PaymentRef {
  id: number;
  code: string;
  ref_no: string | null;
  amount: number | null;
  created_at: number;
}

// ─── generated_pdfs CRUD ──────────────────────────────────────────────────────

export function insertPDFRecord(
  record: Omit<PDFRecord, 'id' | 'expired' | 'ref_no' | 'amount'>,
): void {
  getDB().prepare(`
    INSERT OR REPLACE INTO generated_pdfs
      (code, slug, form_name, form_code, agency, full_name, created_at, expires_at)
    VALUES
      (@code, @slug, @form_name, @form_code, @agency, @full_name, @created_at, @expires_at)
  `).run(record);
}

export function getAllPDFRecords(): PDFRecord[] {
  const db  = getDB();
  const now = Date.now();
  const rows = db.prepare(`
    SELECT g.*, p.ref_no, p.amount
    FROM   generated_pdfs g
    LEFT JOIN payment_refs p ON p.code = g.code
    ORDER BY g.created_at DESC
  `).all() as Omit<PDFRecord, 'expired'>[];
  return rows.map((r) => ({ ...r, expired: r.expires_at < now }));
}

export function deletePDFRecord(code: string): boolean {
  const result = getDB().prepare('DELETE FROM generated_pdfs WHERE code = ?').run(code);
  return result.changes > 0;
}

export function deleteExpiredPDFRecords(): number {
  return getDB()
    .prepare('DELETE FROM generated_pdfs WHERE expires_at < ?')
    .run(Date.now()).changes;
}

export function deleteAllPDFRecords(): number {
  return getDB().prepare('DELETE FROM generated_pdfs').run().changes;
}

// ─── payment_refs CRUD ────────────────────────────────────────────────────────

export function insertPaymentRef(
  ref: Omit<PaymentRef, 'id'>,
): void {
  getDB().prepare(`
    INSERT INTO payment_refs (code, ref_no, amount, created_at)
    VALUES (@code, @ref_no, @amount, @created_at)
  `).run(ref);
}

export function getAllPaymentRefs(): PaymentRef[] {
  return getDB()
    .prepare('SELECT * FROM payment_refs ORDER BY created_at DESC')
    .all() as PaymentRef[];
}

export function deletePaymentRef(code: string): boolean {
  const result = getDB()
    .prepare('DELETE FROM payment_refs WHERE code = ?')
    .run(code);
  return result.changes > 0;
}

export function deleteAllPaymentRefs(): number {
  return getDB().prepare('DELETE FROM payment_refs').run().changes;
}

// ─── suggestions CRUD ─────────────────────────────────────────────────────────

export interface Suggestion {
  id: string;
  name: string;
  email: string;
  suggestion: string;
  status: 'pending' | 'reviewed' | 'done';
  created_at: number;
}

export function insertSuggestion(s: Suggestion): void {
  getDB().prepare(`
    INSERT OR REPLACE INTO suggestions (id, name, email, suggestion, status, created_at)
    VALUES (@id, @name, @email, @suggestion, @status, @created_at)
  `).run(s);
}

export function getAllSuggestions(): Suggestion[] {
  return getDB()
    .prepare('SELECT * FROM suggestions ORDER BY created_at DESC')
    .all() as Suggestion[];
}

export function updateSuggestionStatus(id: string, status: string): boolean {
  const result = getDB()
    .prepare('UPDATE suggestions SET status = ? WHERE id = ?')
    .run(status, id);
  return result.changes > 0;
}

export function deleteSuggestion(id: string): boolean {
  const result = getDB()
    .prepare('DELETE FROM suggestions WHERE id = ?')
    .run(id);
  return result.changes > 0;
}

export function deleteAllSuggestions(): number {
  return getDB().prepare('DELETE FROM suggestions').run().changes;
}

// ─── license_keys CRUD ────────────────────────────────────────────────────────

export interface LicenseKey {
  id: number;
  key_code: string;
  label: string;
  used_at: number | null;
  used_by_ip: string | null;
  created_at: number;
  expires_at: number | null;
}

export function insertLicenseKey(key_code: string, label: string, expires_at?: number | null): void {
  getDB().prepare(`
    INSERT INTO license_keys (key_code, label, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(key_code, label, Date.now(), expires_at ?? null);
}

export function getLicenseKey(key_code: string): LicenseKey | null {
  return (getDB()
    .prepare('SELECT * FROM license_keys WHERE key_code = ?')
    .get(key_code) as LicenseKey | undefined) ?? null;
}

export function markLicenseKeyUsed(key_code: string, ip: string): boolean {
  const result = getDB().prepare(`
    UPDATE license_keys SET used_at = ?, used_by_ip = ?
    WHERE key_code = ? AND used_at IS NULL
  `).run(Date.now(), ip, key_code);
  return result.changes > 0;
}

export function getAllLicenseKeys(): LicenseKey[] {
  return getDB()
    .prepare('SELECT * FROM license_keys ORDER BY created_at DESC')
    .all() as LicenseKey[];
}

export function deleteLicenseKey(id: number): boolean {
  const result = getDB().prepare('DELETE FROM license_keys WHERE id = ?').run(id);
  return result.changes > 0;
}

// ─── referral_config ──────────────────────────────────────────────────────────

export interface ReferralConfig {
  required_referrals: number;
  promo_expiry_hours: number;
}

export function getReferralConfig(): ReferralConfig {
  const row = getDB().prepare('SELECT required_referrals, promo_expiry_hours FROM referral_config WHERE id = 1').get() as ReferralConfig | undefined;
  return row ?? { required_referrals: 5, promo_expiry_hours: 24 };
}

export function setReferralConfig(cfg: ReferralConfig): void {
  getDB().prepare(`
    INSERT INTO referral_config (id, required_referrals, promo_expiry_hours, updated_at)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      required_referrals = excluded.required_referrals,
      promo_expiry_hours = excluded.promo_expiry_hours,
      updated_at         = excluded.updated_at
  `).run(cfg.required_referrals, cfg.promo_expiry_hours, Date.now());
}

// ─── referral_users ───────────────────────────────────────────────────────────

export interface ReferralUser {
  id: number;
  email: string;
  ref_token: string;
  created_at: number;
}

export function insertReferralUser(email: string, ref_token: string): ReferralUser {
  const db = getDB();
  db.prepare(`
    INSERT OR IGNORE INTO referral_users (email, ref_token, created_at)
    VALUES (?, ?, ?)
  `).run(email, ref_token, Date.now());
  return db.prepare('SELECT * FROM referral_users WHERE email = ?').get(email) as ReferralUser;
}

export function getReferralUserByEmail(email: string): ReferralUser | null {
  return (getDB().prepare('SELECT * FROM referral_users WHERE email = ?').get(email) as ReferralUser | undefined) ?? null;
}

export function getReferralUserByToken(ref_token: string): ReferralUser | null {
  return (getDB().prepare('SELECT * FROM referral_users WHERE ref_token = ?').get(ref_token) as ReferralUser | undefined) ?? null;
}

export function getAllReferralUsers(): ReferralUser[] {
  return getDB().prepare('SELECT * FROM referral_users ORDER BY created_at DESC').all() as ReferralUser[];
}

// ─── referral_events ──────────────────────────────────────────────────────────

export interface ReferralEvent {
  id: number;
  referrer_email: string;
  referred_email: string;
  ip: string;
  accepted_at: number;
}

/** Returns false if this referred_email or ip has already been counted (abuse prevention). */
export function insertReferralEvent(referrer_email: string, referred_email: string, ip: string): boolean {
  // Block self-referral
  if (referrer_email.toLowerCase() === referred_email.toLowerCase()) return false;
  // Block same IP referring twice for same referrer
  const existingIP = getDB().prepare(
    `SELECT id FROM referral_events WHERE referrer_email = ? AND ip = ?`
  ).get(referrer_email, ip);
  if (existingIP) return false;
  try {
    getDB().prepare(`
      INSERT INTO referral_events (referrer_email, referred_email, ip, accepted_at)
      VALUES (?, ?, ?, ?)
    `).run(referrer_email, referred_email, ip, Date.now());
    return true;
  } catch {
    // UNIQUE constraint on referred_email — already counted
    return false;
  }
}

export function getReferralCount(referrer_email: string): number {
  const row = getDB().prepare(
    `SELECT COUNT(*) AS cnt FROM referral_events WHERE referrer_email = ?`
  ).get(referrer_email) as { cnt: number };
  return row.cnt;
}

export function getReferralStats(): { email: string; count: number; earned_codes: number }[] {
  return getDB().prepare(`
    SELECT
      ru.email,
      COUNT(re.id) AS count,
      (SELECT COUNT(*) FROM license_keys lk WHERE lk.label LIKE 'referral:' || ru.email || '%') AS earned_codes
    FROM referral_users ru
    LEFT JOIN referral_events re ON re.referrer_email = ru.email
    GROUP BY ru.email
    ORDER BY count DESC
  `).all() as { email: string; count: number; earned_codes: number }[];
}

// ─── analytics_events CRUD ────────────────────────────────────────────────────

export type AnalyticsEventType = 'form_view' | 'demo_click' | 'payment_success';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  slug: string;
  session_id: string;
  ip_hash: string;
  created_at: number;
}

export function insertAnalyticsEvent(ev: AnalyticsEvent): void {
  getDB().prepare(`
    INSERT INTO analytics_events (event_type, slug, session_id, ip_hash, created_at)
    VALUES (@event_type, @slug, @session_id, @ip_hash, @created_at)
  `).run(ev);
}

/** Returns epoch ms cutoff for a given period filter. */
function periodCutoff(period: 'day' | 'week' | 'month'): number {
  const now = Date.now();
  if (period === 'day')   return now - 86_400_000;
  if (period === 'week')  return now - 7  * 86_400_000;
  return                         now - 30 * 86_400_000;
}

export interface FormAnalytics {
  slug: string;
  form_views: number;
  demo_clicks: number;
  payment_successes: number;
}

export interface DashboardStats {
  period: 'day' | 'week' | 'month';
  perForm: FormAnalytics[];
  totalFormViews: number;
  totalDemoClicks: number;
  totalPaymentSuccesses: number;
  /** Distinct visitors within the period — uses ip_hash (daily-salted SHA-256) as the de-dupe key. */
  uniqueVisitors: number;
  claimedCodes: number;
  unclaimedCodes: number;
  /** Daily buckets for line chart — last 30 calendar days */
  dailyBuckets: { date: string; form_views: number; demo_clicks: number; payment_successes: number }[];
}

export function getDashboardStats(period: 'day' | 'week' | 'month'): DashboardStats {
  const db = getDB();
  const since = periodCutoff(period);

  // Per-form breakdown
  const rows = db.prepare(`
    SELECT slug,
      SUM(CASE WHEN event_type = 'form_view'        THEN 1 ELSE 0 END) AS form_views,
      SUM(CASE WHEN event_type = 'demo_click'       THEN 1 ELSE 0 END) AS demo_clicks,
      SUM(CASE WHEN event_type = 'payment_success'  THEN 1 ELSE 0 END) AS payment_successes
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY slug
    ORDER BY form_views DESC
  `).all(since) as FormAnalytics[];

  const totalFormViews        = rows.reduce((s, r) => s + r.form_views, 0);
  const totalDemoClicks       = rows.reduce((s, r) => s + r.demo_clicks, 0);

  // Paid Users — derive from authoritative tables, not the analytics beacon.
  // The beacon insert was added later, so historical successful payments have
  // NO `payment_success` row. Source of truth is `payment_refs` (GCash/Maya
  // verifications) + `license_keys.used_at` (promo code redemptions). Both are
  // filtered to the active period. See L-PAID-COUNTER-01 in learnings.
  const { paid_refs }     = db.prepare(`SELECT COUNT(*) AS paid_refs    FROM payment_refs WHERE created_at >= ?`).get(since) as { paid_refs: number };
  const { paid_keys }     = db.prepare(`SELECT COUNT(*) AS paid_keys    FROM license_keys WHERE used_at IS NOT NULL AND used_at >= ?`).get(since) as { paid_keys: number };
  const beaconPayments    = rows.reduce((s, r) => s + r.payment_successes, 0);
  // Prefer the authoritative count; fall back to beacon if both source tables are empty.
  const totalPaymentSuccesses = (paid_refs + paid_keys) || beaconPayments;

  // Unique visitors within the period — distinct ip_hash (daily-salted SHA-256).
  // Falls back to session_id when ip_hash is empty (server-side events have no IP).
  const { unique_visitors } = db.prepare(`
    SELECT COUNT(DISTINCT CASE WHEN ip_hash <> '' THEN ip_hash ELSE session_id END) AS unique_visitors
    FROM analytics_events
    WHERE created_at >= ?
      AND (ip_hash <> '' OR session_id <> '')
  `).get(since) as { unique_visitors: number };

  // License key counts (always total, not period-filtered)
  const { claimed }   = db.prepare(`SELECT COUNT(*) AS claimed   FROM license_keys WHERE used_at IS NOT NULL`).get() as { claimed: number };
  const { unclaimed } = db.prepare(`SELECT COUNT(*) AS unclaimed FROM license_keys WHERE used_at IS NULL`).get()     as { unclaimed: number };

  // Daily buckets — last 30 days (regardless of period filter, for chart context)
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  const bucketRows = db.prepare(`
    SELECT
      strftime('%Y-%m-%d', datetime(created_at / 1000, 'unixepoch')) AS date,
      SUM(CASE WHEN event_type = 'form_view'        THEN 1 ELSE 0 END) AS form_views,
      SUM(CASE WHEN event_type = 'demo_click'       THEN 1 ELSE 0 END) AS demo_clicks,
      SUM(CASE WHEN event_type = 'payment_success'  THEN 1 ELSE 0 END) AS payment_successes
    FROM analytics_events
    WHERE created_at >= ?
    GROUP BY date
    ORDER BY date ASC
  `).all(thirtyDaysAgo) as { date: string; form_views: number; demo_clicks: number; payment_successes: number }[];

  return {
    period,
    perForm: rows,
    totalFormViews,
    totalDemoClicks,
    totalPaymentSuccesses,
    uniqueVisitors: unique_visitors ?? 0,
    claimedCodes: claimed,
    unclaimedCodes: unclaimed,
    dailyBuckets: bucketRows,
  };
}

