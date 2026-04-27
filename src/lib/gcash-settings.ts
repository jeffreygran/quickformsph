import fs from 'fs';
import path from 'path';
import os from 'os';

export const SETTINGS_DIR = process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph');
export const SETTINGS_FILE = path.join(SETTINGS_DIR, 'gcash-settings.json');

export interface GCashSettings {
  gcash_number: string;
  gcash_name: string;
  qr_url: string | null;
  maya_qr_url: string | null;
  payment_mode: 'process' | 'upload_only';
}

export function getDefaults(): GCashSettings {
  return {
    gcash_number: process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-551-4822',
    gcash_name:   process.env.NEXT_PUBLIC_GCASH_NAME   ?? 'JE****Y JO*N G.',
    qr_url:       null,
    maya_qr_url:  null,
    payment_mode: 'process',
  };
}

export function readGCashSettings(): GCashSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) as Partial<GCashSettings>;
      return { ...getDefaults(), ...raw };
    }
  } catch { /* fall through */ }
  return getDefaults();
}

export function writeGCashSettings(settings: GCashSettings): void {
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}
