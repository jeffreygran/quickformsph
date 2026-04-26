/**
 * screenshot-storage.ts
 *
 * Unified storage abstraction for payment screenshots.
 * - If storage-config.json has backend='azure' + connectionString → uploads to Azure Blob Storage
 * - Otherwise → saves to local filesystem (DATA_DIR/paymentscreenshot/)
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readStorageConfig } from './storage-config';

export const LOCAL_SCREENSHOT_DIR = path.join(
  process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph'),
  'paymentscreenshot',
);

const CONTAINER_SUBDIR = 'paymentscreenshot';

function getAzureClient() {
  const cfg = readStorageConfig();
  if (cfg.backend !== 'azure' || !cfg.connectionString) return null;
  // Lazy import to avoid bundling if not used
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { BlobServiceClient } = require('@azure/storage-blob') as typeof import('@azure/storage-blob');
  const containerName = cfg.containerName ?? 'quickformsph';
  const client = BlobServiceClient.fromConnectionString(cfg.connectionString);
  return { containerClient: client.getContainerClient(containerName), containerName };
}

/** Upload a buffer. Returns the blob name (azure) or filename (local). */
export async function uploadScreenshot(filename: string, buffer: Buffer, mimeType: string): Promise<void> {
  const azure = getAzureClient();
  if (azure) {
    const blobName = `${CONTAINER_SUBDIR}/${filename}`;
    const blockBlob = azure.containerClient.getBlockBlobClient(blobName);
    // Ensure container exists
    await azure.containerClient.createIfNotExists();
    await blockBlob.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
  } else {
    fs.mkdirSync(LOCAL_SCREENSHOT_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_SCREENSHOT_DIR, filename), buffer);
  }
}

export interface ScreenshotEntry {
  filename: string;
  size: number;
  uploadedAt: string;
  url: string;
}

/** List all screenshots, newest first. */
export async function listScreenshots(): Promise<ScreenshotEntry[]> {
  const azure = getAzureClient();
  if (azure) {
    const results: ScreenshotEntry[] = [];
    const prefix = `${CONTAINER_SUBDIR}/`;
    for await (const blob of azure.containerClient.listBlobsFlat({ prefix })) {
      const filename = blob.name.slice(prefix.length);
      if (!filename) continue;
      results.push({
        filename,
        size: blob.properties.contentLength ?? 0,
        uploadedAt: (blob.properties.lastModified ?? new Date()).toISOString(),
        url: `/api/admin/payment-screenshots/${encodeURIComponent(filename)}`,
      });
    }
    return results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Local
  if (!fs.existsSync(LOCAL_SCREENSHOT_DIR)) return [];
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  return fs.readdirSync(LOCAL_SCREENSHOT_DIR)
    .filter((f) => allowed.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const stat = fs.statSync(path.join(LOCAL_SCREENSHOT_DIR, f));
      return {
        filename: f,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        url: `/api/admin/payment-screenshots/${encodeURIComponent(f)}`,
      };
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

/** Download screenshot bytes + mime type. Returns null if not found. */
export async function getScreenshot(filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const MIME: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  };
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME[ext] ?? 'application/octet-stream';

  const azure = getAzureClient();
  if (azure) {
    try {
      const blobName = `${CONTAINER_SUBDIR}/${filename}`;
      const blockBlob = azure.containerClient.getBlockBlobClient(blobName);
      const download = await blockBlob.download(0);
      const chunks: Buffer[] = [];
      for await (const chunk of (download.readableStreamBody as AsyncIterable<Buffer>)) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
      }
      return { buffer: Buffer.concat(chunks), mimeType };
    } catch {
      return null;
    }
  }

  // Local
  const fullPath = path.join(LOCAL_SCREENSHOT_DIR, path.basename(filename));
  if (!fs.existsSync(fullPath)) return null;
  return { buffer: fs.readFileSync(fullPath), mimeType };
}

/** Delete a screenshot. Returns true if deleted. */
export async function deleteScreenshot(filename: string): Promise<boolean> {
  const safe = path.basename(filename);
  const azure = getAzureClient();
  if (azure) {
    const blobName = `${CONTAINER_SUBDIR}/${safe}`;
    const res = await azure.containerClient.getBlockBlobClient(blobName).deleteIfExists();
    return res.succeeded;
  }

  // Local
  const fullPath = path.join(LOCAL_SCREENSHOT_DIR, safe);
  if (!fs.existsSync(fullPath)) return false;
  fs.unlinkSync(fullPath);
  return true;
}
