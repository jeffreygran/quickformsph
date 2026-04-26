import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph');
const CONFIG_FILE = path.join(CONFIG_DIR, 'storage-config.json');

export interface StorageConfig {
  backend: 'local' | 'azure';
  connectionString?: string;
  containerName?: string;
}

export function readStorageConfig(): StorageConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as StorageConfig;
    }
  } catch { /* fall through */ }
  return { backend: 'local' };
}

export function writeStorageConfig(config: StorageConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/** Return config safe for sending to client — connection string is masked */
export function readStorageConfigMasked(): { backend: string; containerName: string; hasConnectionString: boolean; connectionStringHint: string } {
  const cfg = readStorageConfig();
  const cs = cfg.connectionString ?? '';
  return {
    backend: cfg.backend,
    containerName: cfg.containerName ?? 'quickformsph',
    hasConnectionString: cs.length > 0,
    connectionStringHint: cs.length > 20 ? `${cs.slice(0, 30)}…` : '',
  };
}
