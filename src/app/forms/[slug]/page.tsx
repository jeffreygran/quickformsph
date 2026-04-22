'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFormBySlug, FormField, FormSchema } from '@/data/forms';

const GCASH_NUMBER = process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-551-4822';
const GCASH_NAME   = process.env.NEXT_PUBLIC_GCASH_NAME   ?? 'JE****Y JO*N G.';

// ─── Types ───────────────────────────────────────────────────────────────────
type FormValues = Record<string, string>;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;   // 0-based, supports up to 6 steps

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
  const [mode, setMode]                 = useState<'form' | 'review' | 'preview'>('form');
  const [previewing, setPreviewing]     = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Privacy & payment modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadCode, setDownloadCode]         = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Populate today's date for the date field
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setValues((v) => ({ ...v, date: v.date ?? today }));
  }, []);

  // Clear any saved draft on mount — always start fresh
  useEffect(() => {
    if (!slug) return;
    clearDraft(slug);
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
    const hqpSamples = [
      {
        mp2_account_no: '01-2345-6789-0', last_name: 'DELA CRUZ', first_name: 'JUAN',
        middle_name: 'SANTOS', name_ext: 'Jr.', mid_no: '1234-5678-9012',
        street: 'Unit 4B, 123 Rizal Street', barangay: 'Brgy. San Jose',
        city: 'Quezon City', province: 'Metro Manila (NCR)', zip: '1100',
        cellphone: '09171234567', email: 'juan.delacruz@gmail.com',
        home_tel: '028123-4567', biz_tel: '028765-4321',
        bank_name: 'BDO Unibank', bank_account_no: '001234567890',
        bank_branch: 'Quezon Ave. Branch', bank_address: '123 Quezon Ave., Quezon City',
        date: new Date().toISOString().split('T')[0],
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
        date: new Date().toISOString().split('T')[0],
      },
    ];
    const pmrfSamples = [
      {
        pin: '12-345-678-9012',
        last_name: 'DELA CRUZ', first_name: 'JUAN ANDRES', middle_name: 'REYES', name_ext: 'Jr.',
        dob_month: '03', dob_day: '15', dob_year: '1990',
        place_of_birth: 'Quezon City, Metro Manila',
        sex: 'Male', civil_status: 'Single', citizenship: 'Filipino',
        mother_last_name: 'REYES', mother_first_name: 'MARIA', mother_middle_name: 'SANTOS',
        spouse_last_name: 'N/A', spouse_first_name: 'N/A', spouse_middle_name: 'N/A',
        perm_unit: 'Unit 4B', perm_building: 'Sunrise Tower', perm_lot: 'Lot 12',
        perm_street: 'Rizal Street', perm_subdivision: 'Loyola Grand Villas',
        perm_barangay: 'Brgy. San Jose', perm_city: 'Quezon City',
        perm_province: 'Metro Manila (NCR)', perm_zip: '1100',
        mobile: '09171234567', home_phone: '028123-4567', email: 'juan.delacruz@gmail.com',
        member_type: 'Employed Private', profession: 'Engineer', monthly_income: '55000',
      },
      {
        pin: '09-876-543-2109',
        last_name: 'SANTOS', first_name: 'ANNA MARIE', middle_name: 'GARCIA', name_ext: 'N/A',
        dob_month: '07', dob_day: '22', dob_year: '1985',
        place_of_birth: 'Cebu City, Cebu',
        sex: 'Female', civil_status: 'Married', citizenship: 'Filipino',
        mother_last_name: 'GARCIA', mother_first_name: 'LUCIA', mother_middle_name: 'VIDAL',
        spouse_last_name: 'SANTOS', spouse_first_name: 'PEDRO', spouse_middle_name: 'LIM',
        perm_unit: 'Unit 3A', perm_building: 'Greenfield Residences', perm_lot: 'Blk 5 Lot 7',
        perm_street: 'Mabini Street', perm_subdivision: 'Greenfield Village',
        perm_barangay: 'Brgy. Poblacion', perm_city: 'Makati',
        perm_province: 'Metro Manila (NCR)', perm_zip: '1210',
        mobile: '09281234567', home_phone: '028765-4321', email: 'anna.santos@gmail.com',
        member_type: 'Self-Earning Individual', profession: 'Freelance Designer', monthly_income: '25000',
      },
    ];

    const samplesBySlug: Record<string, Record<string, string>[]> = {
      'hqp-pff-356': hqpSamples,
      'philhealth-pmrf': pmrfSamples,
    };
    const samples = samplesBySlug[slug] ?? hqpSamples;
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setValues(pick as Record<string, string>);
    saveDraft(slug, pick as Record<string, string>);
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
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, values }),
    });
    if (!res.ok) throw new Error('PDF generation failed');

    const code    = res.headers.get('X-Download-Code') ?? '';
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const firstName = (values.first_name ?? '').trim();
    const lastName  = (values.last_name  ?? '').trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
    const safeName  = fullName.replace(/[\u0000-\u001F\u007F-\uFFFF]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
    const a    = document.createElement('a');
    a.href     = blobUrl;
    a.download = `${safeName} - ${form.agency} - ${form.code}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    // Save code to localStorage so home page download widget auto-populates
    try {
      localStorage.setItem('qfph_last_code', JSON.stringify({
        code,
        expires_at: Date.now() + 2 * 24 * 60 * 60 * 1000,
      }));
    } catch { /* ignore */ }

    setDownloadCode(code);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    clearDraft(slug);
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
            {slug === 'hqp-pff-356' && currentStep === 2 && (
              <span className="ml-2 text-xs font-normal text-gray-400">(Optional)</span>
            )}
          </h2>
          {slug === 'hqp-pff-356' && currentStep === 2 && (
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

        {/* Progress note — shift+click triggers auto-populate */}
        <p
          className="mt-3 text-center text-xs text-gray-400 cursor-default select-none"
          onClick={(e) => { if (e.shiftKey) autoPopulate(); }}
        >
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
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start gap-2">
          <span className="text-sm shrink-0 mt-0.5">⚠️</span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            <span className="font-bold">Review carefully before proceeding.</span> Make sure all details are correct — once you generate and pay for your PDF, changes are not possible without re-submitting.
          </p>
        </div>
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
          ⬇️ Download PDF
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
              Processed securely over HTTPS — your form data is only retained for up to 48 hours to allow PDF re-downloads, then permanently deleted once your download code expires.
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
type PaymentStep = 'details' | 'verifying' | 'verified' | 'failed' | 'generating' | 'gen_failed';

const GEN_STEPS = [
  { icon: '📋', label: 'Reading form data…' },
  { icon: '🖊️', label: 'Filling in your details…' },
  { icon: '📄', label: 'Composing PDF pages…' },
  { icon: '🔒', label: 'Finalizing document…' },
  { icon: '⬇️', label: 'Almost ready…' },
];

function GeneratingScreen() {
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 900);
    return () => clearInterval(interval);
  }, []);

  // Smoothly animate progress up to 92% over the steps
  useEffect(() => {
    const target = Math.min(((tick + 1) / GEN_STEPS.length) * 92, 92);
    setProgress(target);
  }, [tick]);

  const activeIdx = Math.min(tick, GEN_STEPS.length - 1);

  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center gap-2 text-center py-2">
        <div className="text-3xl animate-pulse">{GEN_STEPS[activeIdx]?.icon}</div>
        <div className="text-sm font-bold text-gray-900">Generating your PDF…</div>
        <div className="text-xs text-gray-500">{GEN_STEPS[activeIdx]?.label}</div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>Processing</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {GEN_STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-2.5 text-xs ${
            i < activeIdx ? 'text-gray-400' : i === activeIdx ? 'text-gray-900 font-semibold' : 'text-gray-300'
          }`}>
            <span className="text-sm">{s.icon}</span>
            <span>{s.label}</span>
            {i < activeIdx && <span className="ml-auto text-green-500 font-bold">✓</span>}
            {i === activeIdx && (
              <span className="ml-auto inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 text-center">Please don't close this window…</p>
    </div>
  );
}

function PaymentModal({
  gcashNumber,
  gcashName,
  onConfirm,
  onClose,
}: {
  gcashNumber: string;
  gcashName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [step, setStep]                   = useState<PaymentStep>('details');
  const [verifyErrors, setVerifyErrors]   = useState<string[]>([]);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [amount] = useState<number>(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show thumbnail
    setScreenshotUrl(URL.createObjectURL(file));
    setStep('verifying');
    setVerifyErrors([]);

    const fd = new FormData();
    fd.append('screenshot', file);
    fd.append('amount', String(Math.max(amount, 5)));
    try {
      const res  = await fetch('/api/payment/verify-screenshot', { method: 'POST', body: fd });
      const data = await res.json() as { valid: boolean; errors: string[] };
      if (data.valid) {
        setStep('verified');
      } else {
        setVerifyErrors(data.errors ?? ['Verification failed']);
        setStep('failed');
      }
    } catch {
      setVerifyErrors(['Could not reach verification server. Please try again.']);
      setStep('failed');
    }
  }

  function handleRetry() {
    setStep('details');
    setVerifyErrors([]);
    setScreenshotUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
                <div className="text-green-100 text-[11px]">One-time ₱{amount.toFixed(2)} via GCash</div>
              </div>
            </div>
            {step !== 'generating' && (
              <button onClick={onClose} className="text-green-200 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            )}
          </div>
        </div>

        {/* ── STEP: details ── */}
        {step === 'details' && (
          <div className="p-5 space-y-4">
            {/* Heartfelt note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                Built with a lot of time and effort to make it easier for Filipinos to fill out government forms. Your ₱5 or any amount above that helps cover hosting and supports future improvements. Any additional support would be greatly appreciated. Maraming salamat Po🙏
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
                <span className="text-xs text-gray-500">Account Name</span>
                <span className="text-sm font-semibold text-gray-900">{gcashName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount</span>
                <div className="flex items-center gap-1">
                  <span className="text-base font-black text-green-700">₱</span>
                  <span className="text-base font-black text-green-700">{amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Open GCash deep-link */}
              <a
                href="gcash://"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a651] py-3 text-sm font-bold text-white hover:bg-[#008c44] transition-colors"
              >
                📱 Open GCash
              </a>

              {/* Attach screenshot */}
              <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 py-3 text-sm font-semibold text-blue-700 cursor-pointer transition-colors">
                📎 Attach Payment Screenshot
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-gray-200 py-2.5 text-xs text-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: verifying ── */}
        {step === 'verifying' && (
          <VerifyingScreen screenshotUrl={screenshotUrl} />
        )}

        {/* ── STEP: generating ── */}
        {step === 'generating' && (
          <GeneratingScreen />
        )}

        {/* ── STEP: gen_failed ── */}
        {step === 'gen_failed' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">⚠️</div>
              <div className="text-sm font-bold text-red-700">PDF Generation Failed</div>
              <div className="text-xs text-gray-500">
                Something went wrong while generating your PDF.
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 leading-relaxed">
              Don't worry — your payment has already been verified. Please try again and your PDF will be generated. If the issue persists, contact support with your GCash Ref No.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('verified')}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: verified ── */}
        {step === 'verified' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">✅</div>
              <div className="text-sm font-bold text-green-700">Payment Verified!</div>
              <div className="text-xs text-gray-500 text-center">
                Your GCash receipt has been confirmed.<br />
                Salamat po ❤️ 🙏
              </div>
            </div>
            {screenshotUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={screenshotUrl} alt="Receipt" className="w-full max-h-48 object-contain rounded-xl border border-green-200" />
            )}
            <button
              onClick={async () => {
                setStep('generating');
                try {
                  await onConfirm();
                } catch {
                  setStep('gen_failed');
                }
              }}
              className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-60 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
            >
              ⬇️ Download PDF
            </button>
          </div>
        )}

        {/* ── STEP: failed ── */}
        {step === 'failed' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="text-3xl">❌</div>
              <div className="text-sm font-bold text-red-700">Verification Failed</div>
              <div className="text-xs text-gray-500">Your screenshot did not pass the checks below:</div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1.5">
              {verifyErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="shrink-0 font-bold mt-0.5">✗</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 leading-relaxed">
              Make sure the screenshot is from today&apos;s GCash payment of <strong>₱{amount.toFixed(2)}</strong> to{' '}
              <strong>{gcashNumber}</strong> and is taken immediately after paying.
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800 py-2.5 text-xs font-bold text-white"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VerifyingScreen ──────────────────────────────────────────────────────────
const VERIFY_STEPS = [
  { icon: '📸', label: 'Reading screenshot…' },
  { icon: '🔍', label: 'Scanning receipt text…' },
  { icon: '👤', label: 'Checking account name…' },
  { icon: '📱', label: 'Verifying mobile number…' },
  { icon: '💰', label: 'Confirming amount…' },
  { icon: '🕐', label: 'Checking transaction time…' },
  { icon: '✅', label: 'Finalizing…' },
];

const WAITING_MSGS = [
  'Still processing, hang tight…',
  'OCR is working hard…',
  'Almost there, just a moment…',
  'Taking a bit longer than usual…',
];

function VerifyingScreen({ screenshotUrl }: { screenshotUrl: string }) {
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(interval);
  }, []);

  const allDone = tick >= VERIFY_STEPS.length;
  const activeIdx = allDone ? VERIFY_STEPS.length : Math.min(tick, VERIFY_STEPS.length - 1);
  const waitingMsg = WAITING_MSGS[(tick - VERIFY_STEPS.length) % WAITING_MSGS.length] ?? WAITING_MSGS[0];

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      {/* Thumbnail */}
      {screenshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshotUrl}
          alt="Screenshot"
          className="w-20 rounded-xl border-2 border-blue-200 shadow-sm"
        />
      )}

      {/* Active step or extended-wait message */}
      {!allDone ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-2xl">{VERIFY_STEPS[activeIdx]?.icon}</div>
          <div className="text-sm font-bold text-gray-900">{VERIFY_STEPS[activeIdx]?.label}</div>
          <div className="text-[11px] text-gray-400">Verifying your GCash payment…</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="text-sm font-bold text-gray-800">{waitingMsg}</div>
          <div className="text-[11px] text-gray-400">Please don&apos;t close this window.</div>
        </div>
      )}

      {/* Step progress dots */}
      <div className="flex items-center gap-1.5">
        {VERIFY_STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-500 ${
              allDone || i < activeIdx
                ? 'w-2 h-2 bg-green-500'
                : i === activeIdx
                ? 'w-3 h-3 bg-blue-600 animate-pulse'
                : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Show details toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-[11px] text-blue-500 hover:text-blue-700 underline underline-offset-2"
      >
        {expanded ? 'Hide details ▲' : 'Show details ▼'}
      </button>

      {/* Expanded step list */}
      {expanded && (
        <div className="w-full space-y-1.5">
          {VERIFY_STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-300 ${
                allDone || i < activeIdx
                  ? 'bg-green-50 text-green-700'
                  : i === activeIdx
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-300'
              }`}
            >
              <span className={`text-sm ${!allDone && i > activeIdx ? 'opacity-30' : ''}`}>{s.icon}</span>
              <span>{s.label}</span>
              {(allDone || i < activeIdx) && <span className="ml-auto text-green-500 font-bold">✓</span>}
              {!allDone && i === activeIdx && (
                <span className="ml-auto">
                  <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
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
