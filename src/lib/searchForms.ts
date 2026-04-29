/**
 * Shared search helper used by both the landing page (`/`) and the All-Forms
 * page (`/forms`) so they always behave the same.
 *
 * Match rules:
 *   - empty / whitespace-only query → match everything
 *   - case-insensitive substring on name | code | agency
 */
export interface SearchableForm {
  name:   string;
  code:   string;
  agency: string;
}

export function normalizeQuery(q: string | null | undefined): string {
  return (q ?? '').trim().toLowerCase();
}

export function matchesQuery<T extends SearchableForm>(form: T, q: string): boolean {
  const needle = normalizeQuery(q);
  if (!needle) return true;
  const name   = form.name.toLowerCase();
  const code   = form.code.toLowerCase();
  const agency = form.agency.toLowerCase();
  // Direct substring on name | code | agency.
  if (name.includes(needle) || code.includes(needle) || agency.includes(needle)) {
    return true;
  }
  // Tolerate agency-prefixed code queries like "SSS RET-01925" or
  // "Pag-IBIG HQP-PFF-356" — the chat assistant sometimes prefixes the
  // agency in the search query even though the catalog stores only the
  // bare form code. Match if the query is "<agency> <code>" or
  // "<code> <agency>" with one or more spaces.
  const combinedAC = `${agency} ${code}`;
  const combinedCA = `${code} ${agency}`;
  if (combinedAC.includes(needle) || combinedCA.includes(needle)) return true;
  // Also strip any leading "<agency> " from the needle and retry on code.
  if (needle.startsWith(agency + ' ')) {
    const rest = needle.slice(agency.length + 1).trim();
    if (rest && (code.includes(rest) || name.includes(rest))) return true;
  }
  return false;
}
