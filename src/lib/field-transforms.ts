/**
 * Centralised field-value transforms.
 *
 * Any normalisation that is currently implied by a `FormField` schema flag
 * (e.g. `autoUppercase`) MUST be applied through `applyFieldTransforms` so it
 * runs identically across:
 *   1. autoPopulate() — sample loader
 *   2. <input onChange> — manual typing
 *   3. autocomplete onMouseDown — picking a suggestion
 *   4. any future dropdown/programmatic setter
 *
 * Adding a new transform: add the schema flag in `FormField`, then handle it
 * here. Do NOT inline `value.toUpperCase()` (or similar) at call sites; that
 * pattern caused L-AUTOPOP-01 — autoPopulate bypassed autoUppercase because
 * the transform lived only in the input onChange.
 *
 * See ~/mcp-dashboard/docs/quickformsph/QuickFormsPH-PDFGenerationLearnings.md
 * §L-AUTOPOP-01 and §L-FIELDXFORM-01.
 */
import type { FormField } from '@/data/forms';

/**
 * Apply every schema-driven transform to a single field value. Non-string
 * inputs are passed through unchanged so callers can pipe arbitrary values.
 */
export function applyFieldTransforms(field: FormField | undefined, value: unknown): string {
  if (typeof value !== 'string') return value as unknown as string;
  let v = value;
  if (field?.autoUppercase) v = v.toUpperCase();
  // Future: if (field?.trim) v = v.trim();
  // Future: if (field?.digitsOnly) v = v.replace(/\D/g, '');
  return v;
}

/**
 * Transform an entire {fieldId -> value} record using the form's schema.
 * Used by autoPopulate() to apply transforms to every sample value at once.
 */
export function applyFieldTransformsRecord(
  fields: ReadonlyArray<FormField> | undefined,
  record: Record<string, unknown>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(record)) {
    const field = fields?.find(f => f.id === key);
    out[key] = applyFieldTransforms(field, val);
  }
  return out;
}
