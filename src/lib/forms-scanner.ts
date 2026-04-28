/**
 * src/lib/forms-scanner.ts
 *
 * Stateless helpers for the Forms catalog scanner. Given the contents of
 * `public/forms/` and `public/forms/NoFormEditor/`, derives the row shape
 * the SQLite `forms` table expects.
 *
 * Filename convention (existing PDFs):
 *   "<Agency> - <FormCode>.pdf"   e.g.  "PhilHealth - ClaimForm3.pdf"
 *                                       "BIR - 2316.pdf"
 *                                       "Pag-IBIG - HLF-068.pdf"
 *
 * If the convention isn't followed we still produce sensible defaults so
 * the row gets created — the maintainer can rename in the DB later.
 */

import path from 'path';

export interface ParsedPdfFilename {
  /** Display name shown on the catalog card. */
  formName: string;
  /** Stable agency-prefixed code (UPPERCASE, kebab-style). */
  formCode: string;
  /** URL slug — `agency-formcode` (lowercased, kebab). */
  slug: string;
  /** Issuing agency. */
  agency: string;
}

/** Lowercase, replace non-alphanum with '-', collapse and trim dashes. */
function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Title-case helper — keeps numbers as-is. */
function pretty(s: string): string {
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export function parsePdfFilename(filename: string): ParsedPdfFilename {
  const base   = path.basename(filename, path.extname(filename));
  const dashIx = base.indexOf(' - ');

  let agency: string;
  let codeRaw: string;
  if (dashIx > 0) {
    agency  = base.slice(0, dashIx).trim();
    codeRaw = base.slice(dashIx + 3).trim();
  } else {
    agency  = 'Unknown';
    codeRaw = base;
  }

  const formCode = codeRaw.toUpperCase().replace(/\s+/g, '_');
  const formName = `${agency} ${pretty(codeRaw)}`.trim();
  const slug     = `${kebab(agency)}-${kebab(codeRaw)}`;

  return { formName, formCode, slug, agency };
}
