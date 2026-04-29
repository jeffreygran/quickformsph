'use client';

import React, { useState, useMemo, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import DonateButton from '@/components/DonateButton';
import SuggestionModal from '@/components/SuggestionModal';
import KuyaQuimChat from '@/components/KuyaQuimChat';
import { matchesQuery } from '@/lib/searchForms';

// Real PNG logos for big-3 agencies; everything else falls back to a
// flat colored monogram badge derived from the agency initials.
const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'BIR': { src: '/logos/bir.png',       w: 40, h: 40 },
  'Pag-IBIG':              { src: '/logos/pagibig.png',   w: 40, h: 40 },
  'PhilHealth':                 { src: '/logos/philhealth.png?v=3', w: 40, h: 40 },
  'DFA':                        { src: '/logos/dfa.png',        w: 40, h: 40 },
  'SSS':                        { src: '/logos/sss.png',        w: 40, h: 40 },
  'GSIS':                       { src: '/logos/gsis.png',       w: 40, h: 40 },
  'PRC':                        { src: '/logos/prc.png',        w: 40, h: 40 },
};

const AGENCY_BADGE_COLOR: Record<string, { bg: string; fg: string; abbr: string }> = {};

function AgencyBadge({ agency }: { agency: string }) {
  const c = AGENCY_BADGE_COLOR[agency];
  if (!c) return <span className="text-2xl">📄</span>;
  return (
    <div
      className="inline-flex items-center justify-center rounded-md font-black tracking-tight"
      style={{ width: 40, height: 40, background: c.bg, color: c.fg, fontSize: c.abbr.length >= 4 ? 11 : 13 }}
      aria-label={agency}
    >
      {c.abbr}
    </div>
  );
}

export interface PublicFormEntry {
  slug: string;
  code: string;
  name: string;
  agency: string;
  pdfPath: string;
  description?: string | null;
  hasFormEditor: boolean;
  isPaid: boolean;
  upVote: number;
}

export default function FormsListClient({ forms }: { forms: PublicFormEntry[] }) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const [search, setSearch] = useState(() => searchParams?.get('q') ?? '');
  const [agencyFilter, setAgencyFilter] = useState<string>(() => searchParams?.get('agency') ?? '');
  const [confirmForm, setConfirmForm] = useState<PublicFormEntry | null>(null);
  const [upvoted, setUpvoted] = useState<Record<string, number>>({});
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [, startTransition] = useTransition();

  // Keep ?q= and ?agency= in sync with the active filters so deep-links
  // from the landing page (`/forms?q=foo`) stay shareable and back/forward
  // navigation restores the right view.
  useEffect(() => {
    const trimmed = search.trim();
    const params = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
    if (trimmed) params.set('q', trimmed); else params.delete('q');
    if (agencyFilter) params.set('agency', agencyFilter); else params.delete('agency');
    const qs = params.toString();
    const desired = qs ? `${pathname}?${qs}` : pathname;
    const current = (searchParams?.toString() ?? '');
    if (current === qs) return;
    router.replace(desired, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, agencyFilter]);

  // Listen for "kuya-quim:search" events dispatched by the chat assistant
  // when the user clicks a form-name link inside an assistant reply. This
  // pre-fills the search bar so the user can pick + download the form
  // straight from the listing.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      const q = (detail?.query ?? '').trim();
      if (!q) return;
      setSearch(q);
      setAgencyFilter('');
      // Bring the listing into view (chat panel may be tall on mobile).
      setTimeout(() => {
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* ignore */ }
      }, 0);
    };
    window.addEventListener('kuya-quim:search', handler as EventListener);
    return () => window.removeEventListener('kuya-quim:search', handler as EventListener);
  }, []);

  // Per-agency counts for filter pill badges (full catalog, not filtered).
  const agencyCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of forms) m.set(f.agency, (m.get(f.agency) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [forms]);

  const filtered = useMemo(() => {
    const matched = forms.filter((f) => {
      if (agencyFilter && f.agency !== agencyFilter) return false;
      return matchesQuery(f, search);
    });
    // Prioritize fillable forms (hasFormEditor=true) at the top of the list,
    // preserving the original order within each group.
    return matched
      .map((f, i) => ({ f, i }))
      .sort((a, b) => {
        const aFill = a.f.hasFormEditor ? 0 : 1;
        const bFill = b.f.hasFormEditor ? 0 : 1;
        if (aFill !== bFill) return aFill - bFill;
        return a.i - b.i;
      })
      .map((x) => x.f);
  }, [search, agencyFilter, forms]);

  // ── Infinite scroll ──
  // Render `visibleCount` cards at a time; reveal more when the sentinel
  // enters the viewport. Resets to PAGE_SIZE whenever the filter changes.
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset paging when the active filter changes (search/agency).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, agencyFilter]);

  // Observe sentinel; load more when it scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (visibleCount >= filtered.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '600px 0px' }, // pre-load before fully visible
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, visibleCount]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  function handleUpvote(slug: string) {
    if (upvoted[slug] !== undefined) return;
    // Optimistic +1; tolerate failure silently.
    setUpvoted((u) => ({ ...u, [slug]: 1 }));
    startTransition(() => {
      fetch(`/api/forms/${encodeURIComponent(slug)}/upvote`, { method: 'POST' })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && typeof data.upVote === 'number') {
            setUpvoted((u) => ({ ...u, [slug]: data.upVote }));
          }
        })
        .catch(() => {});
    });
  }

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
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-24 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-medium tabular-nums">
              {search.trim() ? `${filtered.length} / ${forms.length}` : `Total: ${forms.length}`}
            </span>
          </div>

          {search.trim() && (
            <p className="mt-2 text-xs text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search.trim()}&rdquo;
            </p>
          )}

          {/* Agency filter pills */}
          {agencyCounts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAgencyFilter('')}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  agencyFilter === ''
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                All <span className="ml-1 opacity-70">{forms.length}</span>
              </button>
              {agencyCounts.map(([agency, count]) => {
                const active = agencyFilter === agency;
                const short  = AGENCY_BADGE_COLOR[agency]?.abbr ?? agency;
                return (
                  <button
                    key={agency}
                    type="button"
                    onClick={() => setAgencyFilter(active ? '' : agency)}
                    title={agency}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {short} <span className="ml-1 opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
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
            {visible.map((form, i) => {
              const logo = AGENCY_LOGO[form.agency];
              return (
                <div
                  key={form.slug}
                  className="form-list-item overflow-hidden"
                  style={{
                    animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
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
                          <AgencyBadge agency={form.agency} />
                        )}
                      </div>
                      {/* Minimal light label — fades in after 1.3s */}
                      <span className="meta-fade-in-1300 text-[10px] font-normal text-gray-400 whitespace-nowrap tracking-wide">
                        {form.agency}
                      </span>
                    </div>

                    {/* Code + Form name */}
                    <div className="text-xs font-mono text-gray-400 mb-0.5">{form.code}</div>
                    <h2 className="text-base font-black text-gray-900 leading-tight mb-2">
                      {form.name}
                    </h2>
                    {form.description && (
                      <p className="text-xs text-gray-600 leading-snug mb-4 line-clamp-3">
                        {form.description}
                      </p>
                    )}
                    {!form.description && <div className="mb-4" />}

                    {/* Actions — Facebook-style flat buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {form.hasFormEditor ? (
                        <Link
                          href={`/forms/${form.slug}`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-1.5 text-sm font-semibold text-white transition-colors"
                        >
                          Fill Out Form
                        </Link>
                      ) : (
                        <>
                          <span
                            className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
                            title="Online form editor coming soon"
                          >
                            Soon
                          </span>
                          <button
                            onClick={() => handleUpvote(form.slug)}
                            disabled={upvoted[form.slug] !== undefined}
                            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                              upvoted[form.slug] !== undefined
                                ? 'bg-green-50 text-green-700 cursor-default'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                            title="Upvote so we prioritize this form"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              className="w-4 h-4"
                            >
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                            {upvoted[form.slug] ?? form.upVote}
                          </button>
                        </>
                      )}
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

        {/* Infinite-scroll sentinel + loading hint */}
        {filtered.length > 0 && visibleCount < filtered.length && (
          <div ref={sentinelRef} className="py-6 text-center text-xs text-gray-400">
            Loading more… ({visibleCount} / {filtered.length})
          </div>
        )}

        {/* More coming soon */}
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <div className="text-2xl mb-1">🔜</div>
          <p className="text-sm font-semibold text-gray-700">More forms coming soon…</p>
          <button
            type="button"
            onClick={() => setShowSuggestion(true)}
            className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            Suggest a form &amp; feedback
          </button>
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

      {/* Kuya Quim AI chat assistant (floating; gated to ₱5 donors server-side) */}
      <KuyaQuimChat />

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
                href={`/forms/${confirmForm.pdfPath.split('/').map(encodeURIComponent).join('/')}`}
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

      {showSuggestion && (
        <SuggestionModal onClose={() => setShowSuggestion(false)} />
      )}
    </div>
  );
}
