/**
 * GET  /api/admin/storage-config — load current config (connection string masked)
 * POST /api/admin/storage-config — save or test storage config
 */
import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import {
  readStorageConfig,
  readStorageConfigMasked,
  writeStorageConfig,
} from '@/lib/storage-config';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/storage-config */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(readStorageConfigMasked());
}

/** POST /api/admin/storage-config */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string; backend?: string; connectionString?: string; containerName?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action ?? 'save';
  const backend = body.backend === 'azure' ? 'azure' : 'local';
  const containerName = (body.containerName ?? 'quickformsph').trim().toLowerCase() || 'quickformsph';

  // For azure, connection string is either provided fresh or falls back to saved value
  let connectionString = (body.connectionString ?? '').trim();
  if (backend === 'azure' && !connectionString) {
    connectionString = readStorageConfig().connectionString ?? '';
  }

  // ── TEST ────────────────────────────────────────────────────────────────────
  if (action === 'test') {
    if (backend === 'local') {
      return NextResponse.json({ ok: true, message: '✅ Local filesystem accessible' });
    }
    if (!connectionString) {
      return NextResponse.json({ ok: false, message: '❌ Connection string is required' }, { status: 400 });
    }
    try {
      const client = BlobServiceClient.fromConnectionString(connectionString);
      // List first container to validate credentials
      const iter = client.listContainers();
      await iter.next(); // throws if creds are invalid
      return NextResponse.json({ ok: true, message: '✅ Azure Blob Storage connected successfully' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, message: `❌ Azure connection failed: ${msg}` }, { status: 400 });
    }
  }

  // ── SAVE ────────────────────────────────────────────────────────────────────
  if (action === 'save') {
    if (backend === 'azure' && !connectionString) {
      return NextResponse.json({ error: 'connectionString is required for Azure backend' }, { status: 400 });
    }
    writeStorageConfig({
      backend,
      ...(backend === 'azure' ? { connectionString, containerName } : {}),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
