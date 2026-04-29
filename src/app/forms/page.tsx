/**
 * /forms — Server Component
 *
 * Reads the live forms catalog from SQLite (DB is the source of truth for
 * "which forms appear and in what state") and hands it to the client UI.
 *
 * Forms with `has_form_editor = 1` get a "Fill Out Form" button.
 * Forms without an editor render as "Soon" with a 👍 Upvote button.
 */
import FormsListClient, { type PublicFormEntry } from './FormsListClient';
import { getPublicCatalog, ensureCatalogSeeded } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function FormsPage() {
  await ensureCatalogSeeded();
  const catalog = getPublicCatalog();
  const forms: PublicFormEntry[] = catalog.map((c) => ({
    slug:           c.slug,
    code:           c.formCode,
    name:           c.formName,
    agency:         c.agency,
    pdfPath:        c.pdfPath,
    description:    c.description,
    hasFormEditor:  c.hasFormEditor,
    isPaid:         c.isPaid,
    upVote:         c.upVote,
  }));
  return <FormsListClient forms={forms} />;
}
