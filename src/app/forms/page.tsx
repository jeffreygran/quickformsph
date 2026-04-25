import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';
import DonateButton from '@/components/DonateButton';

export const metadata: Metadata = {
  title: 'Available Forms — QuickFormsPH',
  description: 'Browse all available Philippine government forms. Fill them out on your phone and download a print-ready PDF.',
};

const AGENCY_COLORS: Record<string, string> = {
  'Pag-IBIG Fund':  'bg-green-50 border-green-200 text-green-700',
  'PhilHealth':     'bg-blue-50 border-blue-200 text-blue-700',
  'SSS':            'bg-purple-50 border-purple-200 text-purple-700',
  'BIR':            'bg-orange-50 border-orange-200 text-orange-700',
  'DFA':            'bg-red-50 border-red-200 text-red-700',
};

const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'Bureau of Internal Revenue': { src: '/logos/bir.png',       w: 40, h: 40 },
  'Pag-IBIG Fund':              { src: '/logos/pagibig.png',   w: 40, h: 40 },
  'PhilHealth':                 { src: '/logos/philhealth.png', w: 80, h: 24 },
};

function agencyBadgeClass(agency: string) {
  return AGENCY_COLORS[agency] ?? 'bg-gray-100 border-gray-200 text-gray-600';
}

export default function FormsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/quickformsph-logo-transparent-slogan.png"
              alt="QuickFormsPH"
              width={160}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <DonateButton />
            <Link href="/" className="text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">
            Available Forms
          </h1>
        </div>

        {/* Form cards */}
        <div className="space-y-4">
          {FORMS.map((form) => (
            <div
              key={form.slug}
              className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                {/* Logo + agency badge row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex-shrink-0 flex items-center h-10">
                    {AGENCY_LOGO[form.agency] ? (
                      <Image
                        src={AGENCY_LOGO[form.agency].src}
                        alt={form.agency}
                        width={AGENCY_LOGO[form.agency].w}
                        height={AGENCY_LOGO[form.agency].h}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-2xl">📄</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${agencyBadgeClass(form.agency)}`}>
                    {form.agency}
                  </span>
                </div>

                {/* Code + Form name */}
                <div className="text-xs font-mono text-gray-400 mb-0.5">{form.code}</div>
                <h2 className="text-base font-black text-gray-900 leading-tight mb-4">
                  {form.name}
                </h2>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/forms/${form.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                  >
                    ✏️ Fill Out Form
                  </Link>
                  <a
                    href={`/forms/${encodeURIComponent(form.pdfPath)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-600 transition-colors"
                  >
                    ⬇️ Download Blank PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More coming soon */}
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <div className="text-2xl mb-1">🔜</div>
          <p className="text-sm font-semibold text-gray-700">More forms coming soon…</p>
          <p className="text-xs text-gray-400 mt-1">BIR, SSS, PSA, DFA, LTO and more</p>
        </div>
      </main>
    </div>
  );
}
