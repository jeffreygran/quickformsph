/**
 * Input sanitization utilities.
 * Used on all user-supplied text before processing or persisting.
 */

/** Strip HTML/script tags and trim whitespace */
export function stripTags(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')          // remove HTML tags
    .replace(/javascript:/gi, '')      // strip JS protocol
    .replace(/on\w+\s*=/gi, '')        // strip inline event handlers
    .trim();
}

/** Sanitize a free-text field: strip tags + truncate */
export function sanitizeText(input: unknown, maxLen = 2000): string {
  if (typeof input !== 'string') return '';
  return stripTags(input).slice(0, maxLen);
}

/** Sanitize an email address */
export function sanitizeEmail(input: unknown, maxLen = 200): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.trim().slice(0, maxLen);
  // Basic RFC 5321 rough check — reject if obviously malformed
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : '';
}

/** Sanitize a form slug: alphanumeric + hyphens only */
export function sanitizeSlug(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 100);
}

/** Sanitize a payment reference code: digits and spaces only */
export function sanitizeRef(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^0-9\s]/g, '').trim().slice(0, 20);
}

/**
 * Validate that a slug exists in the known FORMS list.
 * Import lazily to avoid circular deps.
 */
export function isValidSlug(slug: string, formSlugs: string[]): boolean {
  return formSlugs.includes(slug);
}

/** Validate uploaded file is actually a PDF by magic bytes */
export function isPdfBuffer(buffer: Buffer | Uint8Array): boolean {
  // PDF magic bytes: %PDF
  return (
    buffer.length > 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  );
}

/** Max allowed upload size: 10 MB */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
