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
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_license_keys_key_code   ON license_keys (key_code);
    CREATE INDEX IF NOT EXISTS idx_license_keys_created_at ON license_keys (created_at DESC);
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
}

export function insertLicenseKey(key_code: string, label: string): void {
  getDB().prepare(`
    INSERT INTO license_keys (key_code, label, created_at)
    VALUES (?, ?, ?)
  `).run(key_code, label, Date.now());
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

