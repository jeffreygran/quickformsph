import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import DevSection from './DevSection';

export const metadata: Metadata = {
  title: 'About — QuickFormsPH',
  description:
    'Learn about QuickFormsPH — a free tool for filling Philippine government forms fast — and its developer, Jeffrey John Gran.',
};

export default function AboutPage() {
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
          <Link href="/" className="text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors">
            ← Back to Forms
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-10">

        {/* ── About QuickFormsPH ── */}
        <section>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs text-blue-700 font-semibold mb-4">
            📄 About This App
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight mb-3">
            QuickFormsPH
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            A simple tool that helps Filipinos fill out Philippine government forms — right on their phone or browser — and download a clean, print-ready PDF. No account. No uploads. Everything stays on your device.
          </p>

          {/* Quick notes */}
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-2.5">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-3">How It Works</div>
            {[
              ['📱', 'Works entirely in your browser — no app download required'],
              ['🔒', 'Everything you type stays on your device. Nothing is sent to any server.'],
              ['⬇️', 'The PDF is generated offline on your device and downloaded directly to you'],
              ['🏛️', 'Forms are sourced from official Philippine government agency templates'],
            ].map(([icon, text]) => (
              <div key={String(text)} className="flex items-start gap-2.5 text-sm text-blue-900">
                <span className="text-base shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Non-affiliation notice */}
          <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
            <strong>⚠️ Disclaimer:</strong> QuickFormsPH is a private, independent tool. It is <strong>not affiliated with, endorsed by, or connected to any Philippine government agency</strong>.
            Forms are reproduced from publicly available official templates for the sole purpose of helping users complete them correctly.
          </div>
        </section>

        {/* ── Fee note ── */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3 items-start">
          <span className="text-xl shrink-0">☕</span>
          <p className="text-sm text-amber-900 leading-relaxed">
            The small ₱5 fee helps keep QuickFormsPH running — covering costs, new form additions, and ongoing improvements.
            Every peso goes directly back into making the app better for everyone. <span className="font-semibold">Salamat Po!</span>
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-gray-200" />

        {/* ── About the Developer ── */}
        <DevSection />

      </main>

    </div>
  );
}
