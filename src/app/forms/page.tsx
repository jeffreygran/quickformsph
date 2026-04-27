'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS } from '@/data/forms';
import DonateButton from '@/components/DonateButton';

const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'Bureau of Internal Revenue': { src: '/logos/bir.png',       w: 40, h: 40 },
  'Pag-IBIG Fund':              { src: '/logos/pagibig.png',   w: 40, h: 40 },
  'PhilHealth':                 { src: '/logos/philhealth.png?v=3', w: 40, h: 40 },
};

export default function FormsPage() {
  const [search, setSearch] = useState('');
  const [confirmForm, setConfirmForm] = useState<typeof FORMS[0] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FORMS;
    return FORMS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.agency.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center">
            <Image
              src="/quickformsph-logo-transparent-slogan2.png"
              alt="QuickFormsPH"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 flex-1">
        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              Available Forms
            </h1>
            <DonateButton />
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forms by name, code, or agency…"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          {search.trim() && (
            <p className="mt-2 text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search.trim()}&rdquo;
            </p>
          )}
        </div>

        {/* Form cards */}
        {filtered.length === 0 ? (
          <div className="mt-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No forms match your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((form, i) => {
              const logo = AGENCY_LOGO[form.agency];
              return (
                <div
                  key={form.slug}
                  className="form-list-item overflow-hidden"
                  style={{
                    animationDelay: `${i * 1.2}s`,
                    borderRadius: '20px',
                    background: '#fff',
                    border: '1px solid rgba(226,232,240,0.8)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(59,130,246,0.10), 0 24px 48px rgba(59,130,246,0.06)',
                    transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s cubic-bezier(0.16,1,0.3,1)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = 'translateY(-6px) scale(1.01)';
                    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.08), 0 20px 40px rgba(59,130,246,0.16), 0 32px 64px rgba(59,130,246,0.10)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.transform = '';
                    el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(59,130,246,0.10), 0 24px 48px rgba(59,130,246,0.06)';
                  }}
                >
                  <div className="p-5">
                    {/* Logo + agency badge row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex-shrink-0 flex items-center h-10">
                        {logo ? (
                          <Image
                            src={logo.src}
                            alt={form.agency}
                            width={logo.w}
                            height={logo.h}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-2xl">📄</span>
                        )}
                      </div>
                      {/* Minimal light label — fades in after 1.3s */}
                      <span className="meta-fade-in-1300 text-[10px] font-normal text-gray-400 whitespace-nowrap tracking-wide">
                        {form.agency}
                      </span>
                    </div>

                    {/* Code + Form name */}
                    <div className="text-xs font-mono text-gray-400 mb-0.5">{form.code}</div>
                    <h2 className="text-base font-black text-gray-900 leading-tight mb-4">
                      {form.name}
                    </h2>

                    {/* Actions — Facebook-style flat buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/forms/${form.slug}`}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-1.5 text-sm font-semibold text-white transition-colors"
                      >
                        Fill Out Form
                      </Link>
                      <button
                        onClick={() => setConfirmForm(form)}
                        className="inline-flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors"
                      >
                        Download Form
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* More coming soon */}
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <div className="text-2xl mb-1">🔜</div>
          <p className="text-sm font-semibold text-gray-700">More forms coming soon…</p>
          <p className="text-xs text-gray-400 mt-1">BIR, SSS, PSA, DFA, LTO and more</p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-400">
        <div className="inline-flex items-center justify-center gap-0">
          <Link href="/about" className="px-3 text-gray-500 hover:text-blue-700 transition-colors">About</Link>
          <span className="text-gray-300">|</span>
          <Link href="/donate" className="px-3 inline-flex items-center gap-1 text-gray-500 hover:text-blue-700 transition-colors">
            💚 Donate
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/privacy" className="px-3 text-gray-500 hover:text-blue-700 transition-colors">Privacy Policy</Link>
        </div>
      </footer>

      {/* ── Download confirmation dialog ── */}
      {confirmForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 dialog-fade-in">
            <div className="text-3xl text-center mb-3">📄</div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-2">
              Download Blank Form
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed text-center mb-3">
              You&apos;re about to download the blank official form for:
            </p>
            <div className="text-center mb-3">
              <span className="text-[11px] font-bold tracking-widest text-blue-500 uppercase block mb-1">{confirmForm.code}</span>
              <p className="text-lg font-black text-gray-900 leading-snug">{confirmForm.name}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed text-center mb-5 bg-gray-50 rounded-xl px-4 py-3">
              {confirmForm.description ?? 'This is the official blank government form. You can print it and fill it out by hand.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmForm(null)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <a
                href={`/forms/${encodeURIComponent(confirmForm.pdfPath)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setConfirmForm(null)}
                className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800 py-2.5 text-sm font-bold text-white text-center transition-colors"
              >
                Yes, Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
