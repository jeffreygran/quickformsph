'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS, FormSchema } from '@/data/forms';
import SuggestionModal from '@/components/SuggestionModal';
import DonationModal from '@/components/DonationModal';

const HERO_CATEGORIES = ['Pag-IBIG', 'PhilHealth', 'BIR', 'SSS', 'DFA', 'LTO', 'Government'];
const HERO_INTERVAL_MS = 3500; // 3.5 seconds

const HERO_ANIMATIONS = ['anim-fade', 'anim-flip', 'anim-slide-up', 'anim-blur', 'anim-scale'] as const;
type HeroAnim = typeof HERO_ANIMATIONS[number];

const IS_DEV = process.env.NEXT_PUBLIC_APP_ENV === 'dev';
const AGENCY_FILTERS = ['All', ...Array.from(new Set(FORMS.map((f) => f.agency)))];
const PAGE_SIZE = 6;

interface SavedCode { code: string; expires_at: number; }

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0)   return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function HomePage() {
  const [search, setSearch]   = useState('');
  const [agency, setAgency]   = useState('All');
  const router = useRouter();

  // Download code widget state
  const [showCodePanel, setShowCodePanel]   = useState(false);
  const [codeInput, setCodeInput]           = useState('');
  const [savedCode, setSavedCode]           = useState<SavedCode | null>(null);
  const [codeError, setCodeError]           = useState('');
  const [codeLoading, setCodeLoading]       = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const codePanelRef = useRef<HTMLDivElement>(null);

  // Suggestion modal state
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Donation modal state
  const [showDonation, setShowDonation] = useState(false);

  // Privacy notice — show only on first visit
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Hero category animation
  const [heroCategoryIdx, setHeroCategoryIdx] = useState(0);
  const [heroAnim, setHeroAnim]               = useState<HeroAnim>('anim-fade');
  const [heroVisible, setHeroVisible]         = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Pick random next animation
      const next = HERO_ANIMATIONS[Math.floor(Math.random() * HERO_ANIMATIONS.length)];
      setHeroVisible(false);
      setTimeout(() => {
        setHeroCategoryIdx((i) => (i + 1) % HERO_CATEGORIES.length);
        setHeroAnim(next);
        setHeroVisible(true);
      }, 350);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem('qfph_privacy_ack')) {
        setShowPrivacyModal(true);
      }
    } catch { /* ignore */ }
  }, []);

  const handlePrivacyAck = () => {
    try { localStorage.setItem('qfph_privacy_ack', '1'); } catch { /* ignore */ }
    setShowPrivacyModal(false);
  };

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore]   = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load saved code from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('qfph_last_code');
      if (raw) {
        const parsed = JSON.parse(raw) as SavedCode;
        if (parsed.expires_at > Date.now()) {
          setSavedCode(parsed);
          setCodeInput(parsed.code);
        } else {
          localStorage.removeItem('qfph_last_code');
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Close code panel on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (codePanelRef.current && !codePanelRef.current.contains(e.target as Node)) {
        setShowCodePanel(false);
      }
    }
    if (showCodePanel) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showCodePanel]);

  // Secret: Shift + double-click on logo → Admin login
  const lastClickRef = useRef<number>(0);
  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (!e.shiftKey) return;
    const now = Date.now();
    if (now - lastClickRef.current < 400) router.push('/mc/login');
    lastClickRef.current = now;
  }, [router]);

  // Reset visible count whenever filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, agency]);

  const filtered = FORMS.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.agency.toLowerCase().includes(search.toLowerCase());
    const matchAgency = agency === 'All' || f.agency === agency;
    return matchSearch && matchAgency;
  });

  async function executeDownload(code: string) {
    setCodeError('');
    setCodeLoading(true);
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/download/${code}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setCodeError(body.error ?? 'Code not found or expired.');
        return;
      }
      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = blobUrl;
      const cd      = res.headers.get('Content-Disposition') ?? '';
      const match   = cd.match(/filename="([^"]+)"/);
      a.download    = match ? match[1] : `QuickFormsPH-${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setShowCodePanel(false);
    } catch {
      setCodeError('Download failed. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  function handleDownloadClick(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase().replace(/\s/g, '');
    if (code.length !== 5) { setCodeError('Enter a valid 5-character code.'); return; }
    setShowConfirm(true);
  }

  const visibleForms = filtered.slice(0, visibleCount);
  const hasMore       = visibleCount < filtered.length;

  // IntersectionObserver — load next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((c) => c + PAGE_SIZE);
            setLoadingMore(false);
          }, 500);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  const timeLeft   = savedCode ? savedCode.expires_at - Date.now() : 0;
  const hasValid   = !!savedCode && timeLeft > 0;
  const expiryText = hasValid ? formatTimeLeft(timeLeft) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-default select-none"
            aria-label="QuickFormsPH"
          >
            <Image
              src="/quickformsph-logo-transparent-slogan.png"
              alt="QuickFormsPH"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
            {IS_DEV && (
              <span className="inline-flex items-center rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-900 ring-1 ring-yellow-500/40">
                DEV
              </span>
            )}
          </button>

          {/* Right nav */}
          <nav className="flex items-center gap-2">
            {/* ── Forms link ── */}
            <Link
              href="/forms"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Forms</span>
            </Link>

            {/* ── Download Code Button (hidden) ── */}
            <div className="relative hidden" ref={codePanelRef}>
              <button
                onClick={() => { setShowCodePanel((v) => !v); setCodeError(''); setShowConfirm(false); }}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  hasValid
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Re-download your PDF"
              >
                🔑
                <span className="hidden sm:inline">My PDF</span>
                {hasValid && (
                  <span className="ml-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none">1</span>
                )}
              </button>

              {/* Dropdown panel */}
              {showCodePanel && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-gray-200 shadow-xl p-4 z-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🔑</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900">Re-download PDF</div>
                      <div className="text-[10px] text-gray-400">Enter your 5-character code</div>
                    </div>
                  </div>

                  {hasValid && (
                    <div className="mb-2.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide">Previously generated</div>
                        <div className="text-sm font-black font-mono tracking-widest text-blue-800">{savedCode!.code}</div>
                      </div>
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                        ⏰ {expiryText}
                      </span>
                    </div>
                  )}

                  {!showConfirm ? (
                    <form onSubmit={handleDownloadClick} className="space-y-2">
                      <input
                        type="text"
                        maxLength={5}
                        autoFocus
                        placeholder="e.g. D98EE"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono uppercase tracking-widest text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                      />
                      {codeError && <p className="text-xs text-red-500">{codeError}</p>}
                      <button
                        type="submit"
                        disabled={codeLoading}
                        className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 py-2 text-xs font-bold text-white transition-colors"
                      >
                        {codeLoading ? 'Downloading…' : '⬇️ Download PDF'}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                        <div className="font-bold mb-1">Confirm Download</div>
                        <div>Code: <span className="font-mono font-black tracking-widest">{codeInput}</span></div>
                        {hasValid && codeInput === savedCode?.code && (
                          <div className="mt-1 text-orange-600 font-semibold">⏰ {expiryText}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowConfirm(false)}
                          className="flex-1 rounded-lg border border-gray-200 py-2 text-xs text-gray-500 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => executeDownload(codeInput.trim().toUpperCase())}
                          disabled={codeLoading}
                          className="flex-1 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 py-2 text-xs font-bold text-white"
                        >
                          {codeLoading ? '…' : 'Yes, Download'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-blue-700 px-4 pt-12 pb-14 text-center text-white">
        {/* Graphical background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-40px] -translate-x-1/2 w-[700px] h-[420px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(ellipse at center, #93c5fd 0%, #1d4ed8 50%, transparent 75%)' }} />
          <div className="absolute -left-16 -top-8 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #bfdbfe, transparent 70%)' }} />
          <div className="absolute -right-12 top-4 w-48 h-48 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a5b4fc, transparent 70%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="100%" x2="55%" y2="0" stroke="#ffffff" strokeWidth="1"/>
            <line x1="45%" y1="100%" x2="100%" y2="0" stroke="#bfdbfe" strokeWidth="1"/>
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-blue-100 font-medium mb-5">
            <span className="text-sm">🔒</span>
            Runs fully offline — your data never leaves your device
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            Fill{' '}
            <span
              key={heroCategoryIdx}
              className={`inline-block ${heroVisible ? heroAnim : 'opacity-0'}`}
              style={{ animationDuration: '0.45s', animationFillMode: 'both' }}
            >
              {HERO_CATEGORIES[heroCategoryIdx]}
            </span>{' '}Forms
            <br />
            <span className="text-blue-200">in Minutes</span>
          </h1>
          <p className="mt-3 text-sm text-blue-200 max-w-md mx-auto leading-relaxed">
            Fill it out and get a print-ready PDF. No erasures, no hassle.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input
                type="search"
                placeholder="Search forms (e.g. MP2, Pag-IBIG, BIR…)"
                className="w-full rounded-xl border-0 bg-white py-3.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

        </div>
      </section>

      {/* ── Agency Filters + Count ── */}
      {search.trim() && <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {AGENCY_FILTERS.map((a) => (
            <button
              key={a}
              onClick={() => setAgency(a)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors flex-shrink-0 ${
                agency === a
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {a}
            </button>
          ))}
          <span className="ml-auto flex-shrink-0 whitespace-nowrap rounded-full bg-gray-100 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500">
            {filtered.length} form{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>}

      {/* ── Form Cards ── */}
      <main className="mx-auto max-w-5xl px-4 pb-12">
        {!search.trim() ? null : filtered.length === 0 ? (
          <div className="mt-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No forms match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {search.trim() && visibleForms.map((form, i) => (
              <div key={form.slug} className="form-card-animate" style={{ animationDelay: `${i * 50}ms` }}>
                <FormCard form={form} />
              </div>
            ))}
            {/* Skeleton cards while loading more */}
            {loadingMore && Array.from({ length: Math.min(PAGE_SIZE, filtered.length - visibleCount) }).map((_, i) => (
              <div key={`skel-${i}`} className="rounded-2xl bg-white border border-gray-100 p-5 animate-pulse">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="w-16 h-5 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="h-3 w-12 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Sentinel for IntersectionObserver */}
        <div ref={sentinelRef} className="h-1" />

        {/* ── Coming Soon ── */}
        {search.trim() && <div className="mt-6 px-4 py-4 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-gray-500">More forms coming soon …</p>
          <button
            onClick={() => setShowSuggestion(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Suggest a form &amp; feedback
          </button>
        </div>}
      </main>

      {/* ── Suggestion Modal ── */}
      {showSuggestion && (
        <SuggestionModal onClose={() => setShowSuggestion(false)} />
      )}

      {/* ── Donation Modal ── */}
      {showDonation && (
        <DonationModal onClose={() => setShowDonation(false)} />
      )}

      {/* ── Privacy Notice (first visit only) ── */}
      {showPrivacyModal && (
        <PrivacyNoticeModal onAck={handlePrivacyAck} />
      )}

      <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-400">
        <div className="mb-1.5 text-[11px] text-gray-400">
          QuickFormsPH is a private tool and is <strong className="text-gray-500">not affiliated with any Philippine government agency</strong>.
        </div>
        <Link href="/about" className="text-gray-500 hover:text-blue-700 transition-colors">About</Link>
        <span className="mx-2 text-gray-300">·</span>
        <Link href="/privacy" className="text-gray-500 hover:text-blue-700 transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}

// ─── PrivacyNoticeModal ───────────────────────────────────────────────────────
function PrivacyNoticeModal({ onAck }: { onAck: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-white font-bold text-sm">Privacy Notice</div>
              <div className="text-blue-200 text-[11px]">Republic Act No. 10173 — Data Privacy Act of 2012</div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Your details are used only to prefill the official form and create your PDF, and the process runs offline so you can safely disconnect from the internet.
          </p>
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Read full Privacy Policy ↗
          </Link>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onAck}
            className="w-full rounded-xl bg-blue-700 py-3 text-sm text-white font-semibold hover:bg-blue-800"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Agency logo map ─────────────────────────────────────────────────────────
const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'Bureau of Internal Revenue': { src: '/logos/bir.png', w: 40, h: 40 },
  'Pag-IBIG Fund':              { src: '/logos/pagibig.png', w: 40, h: 40 },
  'PhilHealth':                 { src: '/logos/philhealth.png', w: 80, h: 24 },
};

// ─── FormCard ─────────────────────────────────────────────────────────────────
function FormCard({ form }: { form: FormSchema }) {
  const logo = AGENCY_LOGO[form.agency];
  return (
    <Link href={`/forms/${form.slug}`} className="form-card p-5 block">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-shrink-0">
          {logo ? (
            <Image src={logo.src} alt={form.agency} width={logo.w} height={logo.h} className="object-contain" />
          ) : (
            <span className="text-2xl">📄</span>
          )}
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide whitespace-nowrap">{form.agency}</span>
      </div>
      <div className="mt-3">
        <div className="text-xs font-mono text-gray-400 mb-0.5">{form.code}</div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3">{form.name}</h3>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">{form.fields.length} fields</span>
        <span className="text-xs font-semibold text-blue-700">Fill Now →</span>
      </div>
    </Link>
  );
}
