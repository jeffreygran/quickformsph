/**
 * src/lib/catalog.ts  (server-only)
 *
 * Bridges the SQLite `forms` table (catalog metadata: visibility, upvotes,
 * source URL, "old form" flag) with the static `FORMS` array in
 * `src/data/forms.ts` (per-form render schema: fields, coordinates,
 * validation, smart-assistance config).
 *
 * Used by Server Components (`/`, `/forms`) to honor the v2.0 gating spec:
 *   - Landing  → only rows with has_form_editor = 1
 *   - Listing  → all active rows; rows without an editor render as "Soon"
 *                with an upvote button.
 *
 * The TS schema is still the source of truth for *how* a live form is
 * rendered. The DB is the source of truth for *which* forms appear and in
 * what state.
 */

import 'server-only';
import { listFormCatalog } from './db';
import { FORMS, type FormSchema } from '@/data/forms';

export interface CatalogEntry {
  slug: string;
  formCode: string;
  formName: string;
  agency: string;
  pdfPath: string;
  sourceUrl: string | null;
  hasFormEditor: boolean;
  isOldFormReported: boolean;
  isPaid: boolean;
  upVote: number;
  /** TS render schema, present iff a fillable form is wired up for this slug. */
  schema: FormSchema | null;
}

export function getPublicCatalog(
  opts: { onlyWithEditor?: boolean } = {},
): CatalogEntry[] {
  const rows = listFormCatalog({ onlyWithEditor: opts.onlyWithEditor });
  return rows.map((r) => ({
    slug:               r.slug,
    formCode:           r.form_code,
    formName:           r.form_name,
    agency:             r.agency,
    pdfPath:            r.pdf_path,
    sourceUrl:          r.source_url,
    hasFormEditor:      Boolean(r.has_form_editor),
    isOldFormReported:  Boolean(r.is_old_form_reported),
    isPaid:             Boolean(r.is_paid),
    upVote:             r.up_vote,
    schema:             FORMS.find((f) => f.slug === r.slug) ?? null,
  }));
}
