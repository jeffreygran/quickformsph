#!/usr/bin/env tsx
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';
import { writeFileSync, mkdirSync } from 'fs';
import type { FormField, FormSchema } from '../src/data/forms';

mkdirSync('/tmp/audit_pdfs', { recursive: true });

function val(f: FormField): string {
  const id = f.id, t = f.type;
  const opts = (f as any).options as string[] | undefined;
  if (opts?.length) {
    const real = opts.filter(o => o && o.toUpperCase() !== 'N/A');
    return real[0] || opts[0];
  }
  if (t === 'date' || /date|dob|birth/i.test(id)) return '01/15/1990';
  if (t === 'email' || /email/i.test(id)) return 'test@example.com';
  if (t === 'tel' || /cell|phone|mobile/i.test(id)) return '09171234567';
  if (/mid_no/i.test(id)) return '1234-5678-9012';
  if (/^tin$|_tin/i.test(id)) return '123-456-789-000';
  if (/pin|philhealth/i.test(id)) return '123456789012';
  if (/zip/i.test(id)) return '1100';
  if (/amount|salary|income|loan.*(desired|requested|amount)/i.test(id)) return '1500000';
  if (/age/i.test(id)) return '35';
  if (/height/i.test(id)) return '170';
  if (/weight/i.test(id)) return '70';
  if (/years/i.test(id)) return '5';
  return 'TEST VALUE';
}

async function main() {
  for (const form of FORMS) {
    const values: Record<string, string> = {};
    for (const f of form.fields) values[f.id] = val(f);
    try {
      const buf = await generatePDF(form, values);
      writeFileSync(`/tmp/audit_pdfs/${form.slug}.pdf`, buf);
      writeFileSync(`/tmp/audit_pdfs/${form.slug}.values.json`, JSON.stringify(values, null, 2));
      console.log(`✓ ${form.slug}  ${buf.length}B  fields=${form.fields.length}`);
    } catch (e) {
      console.log(`✗ ${form.slug}  ${(e as Error).message}`);
    }
  }
}
main();
