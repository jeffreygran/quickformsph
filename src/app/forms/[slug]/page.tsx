'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFormBySlug, FormField, FormSchema } from '@/data/forms';

const GCASH_NUMBER = process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-XXX-XXXX';
const GCASH_NAME   = process.env.NEXT_PUBLIC_GCASH_NAME   ?? 'J. Gran';

// ─── Types ───────────────────────────────────────────────────────────────────
type FormValues = Record<string, string>;
type StepIndex = 0 | 1 | 2;   // 0-based

// ─── Draft persistence ───────────────────────────────────────────────────────
function draftKey(slug: string) { return `qfph_draft_${slug}`; }

function saveDraft(slug: string, values: FormValues) {
  try { localStorage.setItem(draftKey(slug), JSON.stringify(values)); } catch {}
}

function loadDraft(slug: string): FormValues | null {
  try {
    const raw = localStorage.getItem(draftKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft(slug: string) {
  try { localStorage.removeItem(draftKey(slug)); } catch {}
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FormWizardPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const router = useRouter();

  const form = getFormBySlug(slug);

  const [currentStep, setCurrentStep] = useState<StepIndex>(0);
  const [values, setValues]             = useState<FormValues>({});
  const [hasDraft, setHasDraft]         = useState(false);
  const [mode, setMode]                 = useState<'form' | 'review' | 'preview'>('form');
  const [previewing, setPreviewing]     = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Privacy & payment modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadCode, setDownloadCode]         = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paying, setPaying]                     = useState(false);

  // Populate today's date for the date field
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setValues((v) => ({ ...v, date: v.date ?? today }));
  }, []);

  // Load draft on mount
  useEffect(() => {
    if (!slug) return;
    const draft = loadDraft(slug);
    if (draft && Object.keys(draft).length > 0) {
      setValues(draft);
      setHasDraft(true);
    }
  }, [slug]);

  // Auto-save draft on every change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback((id: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraft(slug, next), 600);
      return next;
    });
  }, [slug]);

  // ── Step completion check ────────────────────────────────────────────────
  function stepFilledCount(stepIdx: number) {
    if (!form) return 0;
    const stepFields = form.fields.filter((f) => f.step === stepIdx + 1 && f.required);
    return stepFields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
  }

  function stepRequiredCount(stepIdx: number) {
    if (!form) return 0;
    return form.fields.filter((f) => f.step === stepIdx + 1 && f.required).length;
  }

  function totalFilled() {
    if (!form) return 0;
    return form.fields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
  }

  // ── Auto-populate (dev helper) ───────────────────────────────────────────
  function autoPopulate() {
    const today = new Date().toISOString().split('T')[0];
    const samples = [
      {
        mp2_account_no: '01-2345-6789-0', last_name: 'DELA CRUZ', first_name: 'JUAN',
        middle_name: 'SANTOS', name_ext: 'Jr.', mid_no: '1234-5678-9012',
        street: 'Unit 4B, 123 Rizal Street', barangay: 'Brgy. San Jose',
        city: 'Quezon City', province: 'Metro Manila (NCR)', zip: '1100',
        cellphone: '09171234567', email: 'juan.delacruz@gmail.com',
        home_tel: '028123-4567', biz_tel: '028765-4321',
        bank_name: 'BDO Unibank', bank_account_no: '001234567890',
        bank_branch: 'Quezon Ave. Branch', bank_address: '123 Quezon Ave., Quezon City',
        date: today,
      },
      {
        mp2_account_no: '02-9876-5432-1', last_name: 'REYES', first_name: 'MARIA',
        middle_name: 'GARCIA', name_ext: 'N/A', mid_no: '9876-5432-1098',
        street: 'Blk 5 Lot 12, Maharlika Village', barangay: 'Brgy. Bagumbayan',
        city: 'Taguig', province: 'Metro Manila (NCR)', zip: '1630',
        cellphone: '09281234567', email: 'maria.reyes@yahoo.com',
        home_tel: '', biz_tel: '',
        bank_name: 'Bank of the Philippine Islands (BPI)', bank_account_no: '9876543210',
        bank_branch: 'Bonifacio Global City Branch', bank_address: '32nd St., BGC, Taguig',
        date: today,
      },
      {
        mp2_account_no: '03-1111-2222-3', last_name: 'SANTOS', first_name: 'PEDRO',
        middle_name: 'LIM', name_ext: 'III', mid_no: '1111-2222-3333',
        street: '456 Mabini Street', barangay: 'Brgy. Poblacion',
        city: 'Makati', province: 'Metro Manila (NCR)', zip: '1210',
        cellphone: '09321234567', email: 'pedro.santos@outlook.com',
        home_tel: '028822-1234', biz_tel: '',
        bank_name: 'Metrobank', bank_account_no: '1112223334440',
        bank_branch: 'Ayala Ave. Branch', bank_address: 'Sen. Gil Puyat Ave., Makati City',
        date: today,
      },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setValues(pick as Record<string, string>);
    saveDraft(slug, pick as Record<string, string>);
    setHasDraft(true);
  }

  // ── Privacy gate — check acknowledgement before preview ──────────────────
  function handlePreviewRequest() {
    try {
      if (localStorage.getItem('qfph_privacy_ack') === '1') {
        handlePreviewInPDF();
      } else {
        setShowPrivacyModal(true);
      }
    } catch {
      setShowPrivacyModal(true);
    }
  }

  function handlePrivacyAck() {
    try { localStorage.setItem('qfph_privacy_ack', '1'); } catch {}
    setShowPrivacyModal(false);
    handlePreviewInPDF();
  }

  // ── Preview in PDF: generate PDF → render page 1 as image with watermark ──
  async function handlePreviewInPDF() {
    setPreviewing(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, values }),
      });
      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      // blob used only for PDF.js preview rendering — actual download goes via /api/payment/confirm

      // Render PDF page 1 to canvas
      const arrayBuffer = await blob.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx as never, viewport }).promise;

      // Apply tiled watermark
      const fSize = Math.max(22, Math.round(canvas.width / 11));
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = '#1d4ed8';
      ctx.font = `bold ${fSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const gapY = fSize * 3.8;
      const gapX = canvas.width * 0.55;
      for (let row = -1; row * gapY < canvas.height + gapY; row++) {
        for (let col = -1; col * gapX < canvas.width + gapX; col++) {
          ctx.save();
          ctx.translate(
            col * gapX + (row % 2 === 0 ? 0 : gapX / 2),
            row * gapY
          );
          ctx.rotate(-Math.PI / 6);
          ctx.fillText('QuickFormsPH', 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();

      setPreviewImageUrl(canvas.toDataURL('image/jpeg', 0.92));
      setMode('preview');
    } catch (err) {
      console.error(err);
      alert('Could not generate preview. Please try again.');
    } finally {
      setPreviewing(false);
    }
  }

  // ── Payment confirmed → generate final PDF + return 5-digit code ──────────
  async function handlePaymentConfirm() {
    if (!form) return;
    setPaying(true);
    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, values }),
      });
      if (!res.ok) throw new Error('Payment confirmation failed');

      const code    = res.headers.get('X-Download-Code') ?? '';
      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const firstName = (values.first_name ?? '').trim();
      const lastName  = (values.last_name  ?? '').trim();
      const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
      const safeName  = fullName.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
      const a    = document.createElement('a');
      a.href     = blobUrl;
      a.download = `${safeName} - ${form.agency} - ${form.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      setDownloadCode(code);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      clearDraft(slug);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <div className="text-5xl mb-4">🤔</div>
          <h2 className="text-lg font-semibold text-gray-900">Form not found</h2>
          <p className="text-sm text-gray-500 mt-2">
            The form <code className="bg-gray-100 px-1 rounded">{slug}</code> does not exist yet.
          </p>
          <button
            className="btn-primary mt-5"
            onClick={() => router.push('/')}
          >
            ← Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <>
        <ReviewScreen
          form={form}
          values={values}
          onEdit={(stepIdx) => {
            if (stepIdx !== undefined) setCurrentStep(stepIdx as StepIndex);
            setMode('form');
          }}
          onPreview={handlePreviewRequest}
          previewing={previewing}
        />
        {showPrivacyModal && (
          <PrivacyConsentModal
            onAck={handlePrivacyAck}
            onClose={() => setShowPrivacyModal(false)}
          />
        )}
      </>
    );
  }

  if (mode === 'preview') {
    return (
      <>
        <PreviewScreen
          form={form}
          imageUrl={previewImageUrl}
          onDownload={() => setShowPaymentModal(true)}
          onBack={() => setMode('review')}
        />
        {showPaymentModal && (
          <PaymentModal
            gcashNumber={GCASH_NUMBER}
            gcashName={GCASH_NAME}
            onConfirm={handlePaymentConfirm}
            onClose={() => setShowPaymentModal(false)}
            paying={paying}
          />
        )}
        {showSuccessModal && (
          <SuccessCodeModal
            code={downloadCode}
            onClose={() => { setShowSuccessModal(false); router.push('/'); }}
          />
        )}
      </>
    );
  }

  const stepDef = form.steps[currentStep];
  const stepFields = form.fields.filter((f) => f.step === currentStep + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep((s) => (s - 1) as StepIndex) : router.push('/')}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Back"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-gray-400 truncate">{form.code}</div>
            <div className="text-xs font-medium text-gray-700 truncate">{form.name}</div>
          </div>
          <button
            onClick={() => setMode('review')}
            className="btn-primary py-2 px-4 text-xs"
          >
            Review →
          </button>
        </div>
      </header>

      {/* Draft resume banner */}
      {hasDraft && (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="text-xs text-amber-800 font-medium">
              💾 Draft resumed — {totalFilled()}/{form.fields.length} fields filled
            </span>
            <button
              onClick={() => {
                setValues({});
                clearDraft(slug);
                setHasDraft(false);
              }}
              className="text-xs text-amber-600 underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Step progress bar */}
      <div className="mx-auto max-w-lg px-4 pt-4 pb-2">
        <div className="flex items-center">
          {form.steps.map((step, i) => {
            const filled = stepFilledCount(i);
            const required = stepRequiredCount(i);
            const done = filled >= required && required > 0;
            const active = i === currentStep;
            return (
              <div key={i} className="flex flex-1 items-center">
                <button
                  onClick={() => setCurrentStep(i as StepIndex)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`step-dot ${
                      done ? 'step-dot-done' : active ? 'step-dot-active' : 'step-dot-idle'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      active ? 'text-blue-700' : done ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                <div className="flex-1 h-0.5 mx-1 bg-gray-200 rounded" />
              </div>
            );
          })}
          {/* Review pseudo-step */}
          <div className="flex flex-col items-center gap-1">
            <div className="step-dot step-dot-idle">✎</div>
            <span className="text-[10px] font-medium text-gray-400">Review</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="mx-auto max-w-lg px-4 pb-32">
        <div className="mt-2 mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Step {currentStep + 1}: {stepDef.label}
            {currentStep === 2 && (
              <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
            )}
          </h2>
          {currentStep === 2 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Leave blank if you don&apos;t want to prefill bank info.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {stepFields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id] ?? ''}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}
        </div>

        {/* Step nav */}
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <button
              className="btn-secondary flex-1"
              onClick={() => setCurrentStep((s) => (s - 1) as StepIndex)}
            >
              ← Back
            </button>
          )}
          {currentStep < form.steps.length - 1 ? (
            <button
              className="btn-primary flex-1"
              onClick={() => setCurrentStep((s) => (s + 1) as StepIndex)}
            >
              Next: {form.steps[currentStep + 1].label} →
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              onClick={() => setMode('review')}
            >
              Next: Review →
            </button>
          )}
        </div>

        {/* Auto-populate dev helper */}
        <div className="mt-3 text-center">
          <button
            onClick={autoPopulate}
            className="text-xs text-blue-400 underline underline-offset-2 hover:text-blue-600"
          >
            auto-populate
          </button>
        </div>

        {/* Progress note */}
        <p className="mt-2 text-center text-xs text-gray-400">
          {totalFilled()} of {form.fields.length} fields filled &mdash; Empty fields will be left blank on the PDF.
        </p>
      </main>

    </div>
  );
}

// ─── FieldInput ───────────────────────────────────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isOptional = !field.required;
  const labelText = field.label;

  const commonProps = {
    id: field.id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const v = field.autoUppercase ? e.target.value.toUpperCase() : e.target.value;
      onChange(v);
    },
    placeholder: field.placeholder ?? '',
    className: field.type === 'dropdown' ? 'select-field' : field.type === 'textarea' ? 'input-field min-h-[80px] resize-none' : 'input-field',
    inputMode: field.inputMode as never,
    maxLength: field.maxLength,
    autoComplete: 'off',
  };

  return (
    <div>
      <label htmlFor={field.id} className="field-label">
        {labelText}
        {isOptional ? (
          <span className="badge-optional">(optional)</span>
        ) : (
          <span className="text-red-500 ml-0.5 text-xs">*</span>
        )}
      </label>

      {field.type === 'dropdown' ? (
        <div className="relative">
          <select {...commonProps}>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt || `— Select ${field.label} —`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ▾
          </span>
        </div>
      ) : field.type === 'textarea' ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input type={field.type} {...commonProps} />
      )}

      {field.hint && (
        <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
      )}
    </div>
  );
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({
  totalFilled,
  totalFields,
  onConfirm,
  onCancel,
  loading,
}: {
  totalFilled: number;
  totalFields: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const unfilled = totalFields - totalFilled;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center text-3xl mb-3">📄</div>
        <h3 className="text-base font-bold text-gray-900 text-center">Generate PDF?</h3>
        <p className="mt-2 text-sm text-center text-gray-600">
          {totalFilled} of {totalFields} fields are filled.
          {unfilled > 0 && (
            <span className="block text-amber-600 mt-1">
              {unfilled} empty {unfilled === 1 ? 'field' : 'fields'} will be left blank on the PDF.
            </span>
          )}
        </p>
        <p className="mt-2 text-xs text-center text-gray-400">
          Your saved progress will be cleared after generating.
        </p>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Generating…' : 'Generate & Download'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewScreen ─────────────────────────────────────────────────────────────
function ReviewScreen({
  form,
  values,
  onEdit,
  onPreview,
  previewing,
}: {
  form: FormSchema;
  values: FormValues;
  onEdit: (stepIdx?: number) => void;
  onPreview: () => void;
  previewing: boolean;
}) {
  const totalFilled = form.fields.filter((f) => (values[f.id] ?? '').trim() !== '').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            onClick={() => onEdit(2)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-gray-400 truncate">{form.code}</div>
            <div className="text-xs font-medium text-gray-700">Review Your Entries</div>
          </div>
          <div className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
            {totalFilled}/{form.fields.length} filled
          </div>
        </div>
      </header>

      {/* Progress — all form steps done, Review active */}
      <div className="mx-auto max-w-lg px-4 pt-4 pb-2">
        <div className="flex items-center">
          {form.steps.map((step, i) => (
            <div key={i} className="flex flex-1 items-center">
              <button onClick={() => onEdit(i)} className="flex flex-col items-center gap-1">
                <div className="step-dot step-dot-done">{i + 1}</div>
                <span className="text-[10px] font-medium text-green-600">{step.label}</span>
              </button>
              <div className="flex-1 h-0.5 mx-1 bg-green-200 rounded" />
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <div className="step-dot step-dot-active">✎</div>
            <span className="text-[10px] font-medium text-blue-700">Review</span>
          </div>
        </div>
      </div>

      {/* Field groups */}
      <div className="mx-auto max-w-lg px-4 pt-2 pb-44 space-y-4">
        <p className="text-xs text-gray-400 text-center pt-1">
          Review your entries. Tap &quot;Edit&quot; on any section to make changes.
        </p>

        {form.steps.map((step, stepIdx) => {
          const stepFields = form.fields.filter((f) => f.step === stepIdx + 1);
          const filledCount = stepFields.filter((f) => (values[f.id] ?? '').trim() !== '').length;
          return (
            <div key={stepIdx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-800">{step.label}</span>
                  <span className="text-[10px] text-blue-400">
                    {filledCount}/{stepFields.length}
                  </span>
                </div>
                <button
                  onClick={() => onEdit(stepIdx)}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {stepFields.map((field) => {
                  const val = (values[field.id] ?? '').trim();
                  return (
                    <div
                      key={field.id}
                      className="flex items-baseline justify-between px-4 py-2.5 gap-4"
                    >
                      <span className="text-[11px] text-gray-500 w-2/5 shrink-0 leading-snug">
                        {field.label}
                      </span>
                      <span
                        className={`text-[11px] text-right leading-snug break-all ${
                          val ? 'text-gray-900 font-medium' : 'text-gray-300 italic'
                        }`}
                      >
                        {val || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6 shadow-lg">
        <button
          className="w-full rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={onPreview}
          disabled={previewing}
        >
          {previewing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating preview…
            </>
          ) : (
            '🔍 Preview in PDF'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────
function PreviewScreen({
  form,
  imageUrl,
  onDownload,
  onBack,
}: {
  form: FormSchema;
  imageUrl: string;
  onDownload: () => void;
  onBack: () => void;
}) {
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 truncate">{form.code}</div>
          <div className="text-xs font-medium text-white">PDF Preview</div>
        </div>
        <div className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-1 rounded">
          WATERMARKED
        </div>
      </header>

      {/* Preview image */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-lg">
          <button
            onClick={() => setLightbox(true)}
            className="w-full block rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-700 active:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="PDF Preview" className="w-full block" />
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Tap to view full screen
          </p>
          <p className="text-center text-[10px] text-gray-600 mt-0.5">
            Watermark will not appear on the downloaded PDF.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 pt-3 pb-8 space-y-2">
        <button
          onClick={onDownload}
          className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800"
        >
          ⬇️ Generate &amp; Download PDF
        </button>
        <button
          onClick={onBack}
          className="w-full rounded-xl border border-gray-600 py-3 text-sm text-gray-400 hover:bg-gray-800"
        >
          ← Back to Editor
        </button>
      </div>

      {/* Fullscreen lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2"
          onClick={() => setLightbox(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="PDF Preview" className="max-w-full max-h-full object-contain" />
          <button
            className="absolute top-4 right-4 text-white text-xl bg-gray-800/80 rounded-full w-9 h-9 flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PrivacyConsentModal ──────────────────────────────────────────────────────
function PrivacyConsentModal({
  onAck,
  onClose,
}: {
  onAck: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-white font-bold text-sm">Privacy Notice</div>
              <div className="text-blue-200 text-[11px]">Republic Act No. 10173 — Data Privacy Act of 2012</div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            To generate your PDF, QuickFormsPH will use the personal information you entered — your
            name, address, and other form details — <strong>solely to pre-fill the official government
            form template</strong>.
          </p>
          <ul className="text-xs text-gray-600 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              Processed securely over HTTPS — not logged or retained on our servers.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              Draft data stays in your browser (localStorage) only.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              Your data is never sold or shared with third parties.
            </li>
          </ul>
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Read full Privacy Policy ↗
          </Link>
        </div>
        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAck}
            className="flex-1 rounded-xl bg-blue-700 py-3 text-sm text-white font-semibold hover:bg-blue-800"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PaymentModal ─────────────────────────────────────────────────────────────
function PaymentModal({
  gcashNumber,
  gcashName,
  onConfirm,
  onClose,
  paying,
}: {
  gcashNumber: string;
  gcashName: string;
  onConfirm: () => void;
  onClose: () => void;
  paying: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b7c3e] to-[#00a651] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💚</span>
              <div>
                <div className="text-white font-bold text-sm">Support QuickFormsPH</div>
                <div className="text-green-100 text-[11px]">One-time ₱5.00 via GCash</div>
              </div>
            </div>
            <button onClick={onClose} className="text-green-200 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
          </div>
        </div>
        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Heartfelt note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-800 leading-relaxed">
              This site was built over countless sleepless nights to help Filipinos fill government
              forms <strong>for free</strong>. A small ₱5 tip goes a long way to cover hosting and
              keep this running. <span className="font-medium text-blue-700">Salamat sa suporta! 🙏</span>
            </p>
          </div>
          {/* GCash details */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GCash Payment Details</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Number</span>
              <span className="text-sm font-black text-gray-900 font-mono tracking-wide">{gcashNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Name</span>
              <span className="text-sm font-semibold text-gray-900">{gcashName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="text-base font-black text-green-700">₱5.00</span>
            </div>
          </div>
          {/* Steps */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">How to Pay</div>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>1.</strong> Open GCash and send ₱5 to the number above.<br />
              <strong>2.</strong> Upload your payment screenshot at{' '}
              <a
                href="https://marketplace.jeffreygran.com/orders"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-semibold"
              >
                marketplace.jeffreygran.com/orders ↗
              </a><br />
              <strong>3.</strong> Click the button below to download your clean PDF.
            </p>
          </div>
        </div>
        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={onConfirm}
            disabled={paying}
            className="w-full rounded-xl bg-[#00a651] py-3.5 text-sm font-bold text-white hover:bg-[#008c44] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {paying ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF…
              </>
            ) : (
              "✅ I've Paid — Download My PDF"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={paying}
            className="w-full rounded-xl border border-gray-300 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SuccessCodeModal ─────────────────────────────────────────────────────────
function SuccessCodeModal({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const expiry    = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const expiryStr = expiry.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-700 px-5 py-5 text-center">
          <div className="text-4xl mb-1">🎉</div>
          <div className="text-white font-bold text-base">Thank you for the support!</div>
          <div className="text-blue-200 text-xs mt-0.5">Your PDF is downloading now</div>
        </div>
        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-500 text-center mb-2">
              Save this code to re-download your PDF anytime within 2 days:
            </p>
            {/* Code display */}
            <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-3">
              <div className="flex-1 text-center">
                <span className="text-2xl font-black tracking-[0.3em] text-white font-mono">
                  {code || '—'}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-center text-red-500 mt-2 font-medium">
              ⏰ Expires: {expiryStr} — Note it down!
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
            To re-download using this code, go to{' '}
            <span className="font-semibold">quickformsph.com</span> and enter your code in the
            &quot;Download by Code&quot; section on the home page.
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            Done — Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
