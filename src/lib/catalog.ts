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

/**
 * Self-heal helper: if the SQLite `forms` table is empty (e.g. fresh Azure
 * container with a wiped persisted volume, or first cold-start after a new
 * App Service Plan), trigger a one-time scan of public/forms/* to populate
 * the catalog. Idempotent — does nothing once any row exists.
 *
 * Must be awaited from Server Components BEFORE calling getPublicCatalog().
 * Kept out of getDB()/getPublicCatalog() so those stay sync and don't break
 * synchronous call sites (kuya-quim prompt builder).
 */
let _seedPromise: Promise<void> | null = null;
export async function ensureCatalogSeeded(): Promise<void> {
  if (listFormCatalog().length > 0) return;
  if (_seedPromise) return _seedPromise;
  _seedPromise = (async () => {
    try {
      const { runScan } = await import('./forms-scan');
      const r = await runScan();
      console.log(`[catalog] auto-seed complete: scanned=${r.scanned} inserted=${r.inserted} updated=${r.updated}`);
    } catch (err) {
      console.error('[catalog] auto-seed failed:', err);
      _seedPromise = null; // allow retry on next request
      throw err;
    }
  })();
  return _seedPromise;
}

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
  /** Short subtitle shown on the catalog card. */
  description: string | null;
  /** TS render schema, present iff a fillable form is wired up for this slug. */
  schema: FormSchema | null;
}

export function getPublicCatalog(
  opts: { onlyWithEditor?: boolean } = {},
): CatalogEntry[] {
  const rows = listFormCatalog({ onlyWithEditor: opts.onlyWithEditor });
  return rows.map((r) => {
    // Resolve the schema by pdf_path (the canonical key), NOT by slug — the
    // scanner-generated DB slug is derived from the filename and almost
    // never matches the hand-authored schema slug in src/data/forms.ts.
    const schema = FORMS.find((f) => f.pdfPath === r.pdf_path) ?? null;
    // The DB flag may say "has editor" but if no schema is wired the button
    // would 404. Trust the schema's existence as the actual signal.
    const hasFormEditor = Boolean(r.has_form_editor) && schema !== null;
    return {
      // Use the schema slug when an editor exists so /forms/[slug] resolves;
      // otherwise fall back to the DB slug (used as a stable upvote key).
      slug:               schema?.slug ?? r.slug,
      // For schema-backed rows the schema is the source of truth for the
      // human-readable name/code/agency — schemas are hand-curated, the DB
      // copies (filename-derived) are messy.
      formCode:           schema?.code   ?? r.form_code,
      formName:           schema?.name   ?? r.form_name,
      agency:             schema?.agency ?? r.agency,
      pdfPath:            r.pdf_path,
      sourceUrl:          r.source_url,
      hasFormEditor,
      isOldFormReported:  Boolean(r.is_old_form_reported),
      isPaid:             Boolean(r.is_paid),
      upVote:             r.up_vote,
      // DB description is the catalog subtitle for NoFormEditor rows that
      // don't have a wired TS schema yet. Schema wins when present.
      description:        schema?.description ?? r.description ?? null,
      schema,
    };
  });
}
