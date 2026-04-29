/**
 * src/lib/ai-settings.ts (server-only)
 *
 * Persists "Kuya Quim" AI assistant configuration as JSON at
 *   <DATA_DIR>/ai-settings.json
 *
 * The api_key is encrypted at rest (AES-256-GCM) using a key derived from
 * FORM_DATA_ENCRYPTION_KEY. Plaintext keys never leave this module — the
 * admin UI only sees a masked preview (`••••<last4>`).
 *
 * Resolution order at request time:
 *   1. settings file (encrypted key decrypted in-process)
 *   2. env vars  (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY)  — fallback
 */

import 'server-only';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const SETTINGS_DIR =
  process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'ai-settings.json');

export type AIProvider = 'azure_openai' | 'openai';

export interface AISettings {
  enabled: boolean;
  provider: AIProvider;
  /** Full Azure deployment URL (chat completions) or OpenAI base URL */
  endpoint: string;
  /** Plaintext (resolved). Never serialize. */
  apiKey: string;
  /** Display only for OpenAI; Azure encodes deployment in URL */
  model: string;
  maxTokens: number;
  temperature: number;
}

interface PersistedSettings {
  enabled: boolean;
  provider: AIProvider;
  endpoint: string;
  /** AES-GCM ciphertext: <iv:hex>:<tag:hex>:<ct:hex> — empty when not set */
  apiKeyEnc: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

const DEFAULTS: PersistedSettings = {
  enabled: true,
  provider: 'azure_openai',
  endpoint: '',
  apiKeyEnc: '',
  model: '',
  maxTokens: 400,
  temperature: 0.3,
};

// ── Encryption helpers ───────────────────────────────────────────────────────

function getCryptoKey(): Buffer {
  const hex = process.env.FORM_DATA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'FORM_DATA_ENCRYPTION_KEY must be a 64-char hex string for AI settings encryption.',
    );
  }
  return Buffer.from(hex, 'hex');
}

function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getCryptoKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

function decrypt(blob: string): string {
  if (!blob) return '';
  const parts = blob.split(':');
  if (parts.length !== 3) return '';
  try {
    const [ivHex, tagHex, ctHex] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getCryptoKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctHex, 'hex')),
      decipher.final(),
    ]);
    return pt.toString('utf8');
  } catch {
    return '';
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

function readPersisted(): PersistedSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = JSON.parse(
        fs.readFileSync(SETTINGS_FILE, 'utf8'),
      ) as Partial<PersistedSettings>;
      return { ...DEFAULTS, ...raw };
    }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULTS };
}

function writePersisted(s: PersistedSettings): void {
  fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf8');
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Resolved settings for runtime use (DB → env fallback). */
export function getAISettings(): AISettings {
  const p = readPersisted();
  const apiKey = decrypt(p.apiKeyEnc) || process.env.AZURE_OPENAI_KEY || '';
  const endpoint = p.endpoint || process.env.AZURE_OPENAI_ENDPOINT || '';
  return {
    enabled: p.enabled,
    provider: p.provider,
    endpoint,
    apiKey,
    model: p.model,
    maxTokens: p.maxTokens,
    temperature: p.temperature,
  };
}

/** Admin-safe view: never returns plaintext API key. */
export interface AISettingsAdminView {
  enabled: boolean;
  provider: AIProvider;
  endpoint: string;
  apiKeyMask: string;  // "" or "••••abcd"
  apiKeyFromEnv: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
}

export function getAISettingsForAdmin(): AISettingsAdminView {
  const p = readPersisted();
  const decrypted = decrypt(p.apiKeyEnc);
  const fromEnv = !decrypted && !!process.env.AZURE_OPENAI_KEY;
  const effective = decrypted || process.env.AZURE_OPENAI_KEY || '';
  return {
    enabled: p.enabled,
    provider: p.provider,
    endpoint: p.endpoint || process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKeyMask: effective ? '••••' + effective.slice(-4) : '',
    apiKeyFromEnv: fromEnv,
    model: p.model,
    maxTokens: p.maxTokens,
    temperature: p.temperature,
  };
}

export interface AISettingsUpdate {
  enabled?: boolean;
  provider?: AIProvider;
  endpoint?: string;
  /** New plaintext key. Empty string ⇒ no change. "__CLEAR__" ⇒ remove. */
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export function updateAISettings(patch: AISettingsUpdate): AISettingsAdminView {
  const cur = readPersisted();
  const next: PersistedSettings = { ...cur };

  if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  if (patch.provider === 'azure_openai' || patch.provider === 'openai') {
    next.provider = patch.provider;
  }
  if (typeof patch.endpoint === 'string') next.endpoint = patch.endpoint.trim();
  if (typeof patch.model === 'string') next.model = patch.model.trim();
  if (typeof patch.maxTokens === 'number' && patch.maxTokens >= 1 && patch.maxTokens <= 4000) {
    next.maxTokens = Math.floor(patch.maxTokens);
  }
  if (typeof patch.temperature === 'number' && patch.temperature >= 0 && patch.temperature <= 2) {
    next.temperature = patch.temperature;
  }
  if (typeof patch.apiKey === 'string') {
    if (patch.apiKey === '__CLEAR__') {
      next.apiKeyEnc = '';
    } else if (patch.apiKey.length > 0) {
      next.apiKeyEnc = encrypt(patch.apiKey);
    }
    /* empty string => no change */
  }

  writePersisted(next);
  return getAISettingsForAdmin();
}
