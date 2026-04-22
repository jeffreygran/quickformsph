/**
 * In-memory IP blocklist with optional persistence to /tmp/qfph/security/blocklist.json.
 * Checked by middleware.ts before any route handler runs.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const SECURITY_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'security')
  : path.join(os.tmpdir(), 'qfph', 'security');

const BLOCKLIST_FILE = path.join(SECURITY_DIR, 'blocklist.json');

export interface BlockEntry {
  ip: string;
  reason: string;
  blockedAt: string;
  /** 'manual' | 'auto' */
  source: 'manual' | 'auto';
}

// In-memory set for O(1) lookups in middleware
const blockedIPs = new Set<string>();
// Full entries for admin UI
const blockEntries: BlockEntry[] = [];

function ensureDir() {
  if (!fs.existsSync(SECURITY_DIR)) fs.mkdirSync(SECURITY_DIR, { recursive: true });
}

function persist() {
  try {
    ensureDir();
    fs.writeFileSync(BLOCKLIST_FILE, JSON.stringify(blockEntries, null, 2), 'utf8');
  } catch {
    // non-fatal
  }
}

function load() {
  try {
    if (fs.existsSync(BLOCKLIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf8')) as BlockEntry[];
      for (const e of data) {
        if (e.ip && !blockedIPs.has(e.ip)) {
          blockedIPs.add(e.ip);
          blockEntries.push(e);
        }
      }
    }
  } catch {
    // non-fatal — start with empty list
  }
}

// Load on module init
load();

export function isBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

export function blockIP(ip: string, reason: string, source: 'manual' | 'auto' = 'manual'): void {
  if (blockedIPs.has(ip)) return; // already blocked
  blockedIPs.add(ip);
  blockEntries.push({ ip, reason, blockedAt: new Date().toISOString(), source });
  persist();
}

export function unblockIP(ip: string): boolean {
  if (!blockedIPs.has(ip)) return false;
  blockedIPs.delete(ip);
  const idx = blockEntries.findIndex((e) => e.ip === ip);
  if (idx !== -1) blockEntries.splice(idx, 1);
  persist();
  return true;
}

export function getBlockList(): BlockEntry[] {
  return [...blockEntries];
}

export function getBlockedIPCount(): number {
  return blockedIPs.size;
}
