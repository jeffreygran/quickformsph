import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import DevSection from './DevSection';

export const metadata: Metadata = {
  title: 'About — QuickFormsPH',
  description:
    'QuickFormsPH is a private, offline-first tool for filling Philippine government forms. No account, no uploads, no server.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
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
          <Link href="/" className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors tracking-wide">
            ← Back to Forms
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-blue-300 mb-7">
            Independent · Philippines-based · No Government Affiliation
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl mb-5">
            QuickFormsPH
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            A private, offline-first tool that helps Filipinos fill Philippine government forms
            and generate print-ready PDFs — entirely inside their browser.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            {[
              'No account required',
              'No data uploaded',
              'Works on any device',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Pillars ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-6">

          {/* Privacy */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 mb-5">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Private by Design</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              All form data is processed entirely within your browser. No information is ever sent to,
              stored on, or processed by any external server.
            </p>
          </div>

          {/* Official Forms */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 mb-5">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Official Templates</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Forms are sourced directly from publicly available templates published by Philippine
              government agencies — accurately reproduced for correctness.
            </p>
          </div>

          {/* Instant PDF */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 mb-5">
              <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Instant PDF Download</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              PDFs are generated offline on your device and downloaded instantly. No waiting, no cloud
              processing — just a clean, ready-to-print file.
            </p>
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2">Process</p>
            <h2 className="text-2xl font-black text-gray-900">How It Works</h2>
          </div>
          <div className="grid sm:grid-cols-4 gap-8 text-center">
            {[
              { step: '01', title: 'Pick a Form', body: 'Choose from the list of available Philippine government forms.' },
              { step: '02', title: 'Fill It In',  body: 'Complete the fields in your browser. Auto-save keeps your draft safe.' },
              { step: '03', title: 'Generate PDF', body: 'Hit "Generate PDF" — everything is processed locally on your device.' },
              { step: '04', title: 'Print & Submit', body: 'Download your print-ready PDF and submit to the relevant agency.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-black text-sm mb-4 shadow-sm">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fee Note ── */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col sm:flex-row gap-6 items-start shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1.5">A Minimal Fee, Transparently Used</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              QuickFormsPH charges a small <strong>₱5 fee</strong> to cover operating costs, new form additions,
              and ongoing improvements. There is no subscription — you only pay when you generate.
              Every peso goes directly into making the service better for all Filipinos.{' '}
              <span className="font-semibold text-gray-800">Salamat po!</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <p className="text-xs text-yellow-800 leading-relaxed">
            <strong>Disclaimer:</strong> QuickFormsPH is a private, independent tool and is{' '}
            <strong>not affiliated with, endorsed by, or connected to any Philippine government agency</strong>.
            Forms are reproduced from publicly available official templates solely to help users complete them accurately.
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-t border-gray-200" />
      </div>

      {/* ── Developer ── */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <DevSection />
      </section>

    </div>
  );
}
