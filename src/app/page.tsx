'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FORMS, FormSchema } from '@/data/forms';

const AGENCY_FILTERS = ['All', ...Array.from(new Set(FORMS.map((f) => f.agency)))];

export default function HomePage() {
  const [search, setSearch]         = useState('');
  const [agency, setAgency]         = useState('All');
  const [codeInput, setCodeInput]   = useState('');
  const [codeError, setCodeError]   = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const router = useRouter();

  // Secret: Shift + double-click on the logo → Admin login
  const lastClickRef = useRef<number>(0);
  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (!e.shiftKey) return;
    const now = Date.now();
    if (now - lastClickRef.current < 400) router.push('/admin/login');
    lastClickRef.current = now;
  }, [router]);

  const filtered = FORMS.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.agency.toLowerCase().includes(search.toLowerCase());
    const matchAgency = agency === 'All' || f.agency === agency;
    return matchSearch && matchAgency;
  });

  async function handleCodeDownload(e: React.FormEvent) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase().replace(/\s/g, '');
    if (code.length !== 5) { setCodeError('Enter a valid 5-character code.'); return; }
    setCodeError('');
    setCodeLoading(true);
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
      setCodeInput('');
    } catch {
      setCodeError('Download failed. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#050d1f' }}>
      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: 'rgba(5,13,31,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <button
            onClick={handleLogoClick}
            className="flex items-center cursor-default select-none"
            aria-label="QuickFormsPH"
          >
            <Image
              src="/quickformsph-logo-transparent-slogan.png"
              alt="QuickFormsPH"
              width={160}
              height={44}
              className="h-9 w-auto object-contain"
              priority
            />
          </button>
          <nav className="flex items-center gap-3">
            <Link href="/privacy" className="text-xs text-blue-300 hover:text-white transition-colors">Privacy</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-14 pb-16 text-center">
        {/* Graphical background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large radial glow center */}
          <div className="absolute left-1/2 top-[-60px] -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, #1e5cdb 0%, #0a2060 50%, transparent 75%)' }} />
          {/* Top-left accent */}
          <div className="absolute -left-24 -top-16 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
          {/* Top-right accent */}
          <div className="absolute -right-16 top-8 w-56 h-56 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Diagonal accent lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="100%" x2="60%" y2="0" stroke="#3b82f6" strokeWidth="1"/>
            <line x1="40%" y1="100%" x2="100%" y2="0" stroke="#6366f1" strokeWidth="1"/>
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-900/30 px-3 py-1 text-xs text-blue-300 font-medium mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Free · No sign-up · Works on mobile
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
            Philippine Government
            <br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #38bdf8 100%)' }}>
              Forms, Done Fast
            </span>
          </h1>
          <p className="mt-4 text-sm text-blue-200/80 max-w-md mx-auto leading-relaxed">
            Select a form, fill it in on your phone, and get a print-ready PDF in minutes.
            No account needed.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-md">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 text-base">🔍</span>
              <input
                type="search"
                placeholder="Search — MP2, Pag-IBIG, BIR…"
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3.5 pl-10 pr-4 text-sm text-white placeholder-blue-300/60 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition backdrop-blur"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Feature chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['📄 PDF Auto-Fill', '🔒 Privacy Protected', '📱 Mobile-Friendly', '⚡ Instant Download'].map((c) => (
              <span key={c} className="text-xs bg-white/5 border border-white/10 text-blue-200 px-3 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download by Code strip ── */}
      <div className="border-y border-white/5 bg-white/[0.02] px-4 py-4">
        <form onSubmit={handleCodeDownload} className="mx-auto max-w-md flex items-center gap-2">
          <span className="text-base shrink-0">🔑</span>
          <input
            type="text"
            maxLength={5}
            placeholder="Enter 5-digit download code"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-400/50 font-mono uppercase tracking-widest transition"
            value={codeInput}
            onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
          />
          <button
            type="submit"
            disabled={codeLoading}
            className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {codeLoading ? '…' : 'Download'}
          </button>
        </form>
        {codeError && <p className="mt-1.5 text-center text-xs text-red-400">{codeError}</p>}
        {!codeError && <p className="mt-1 text-center text-[10px] text-blue-400/60">Re-download your paid PDF using the code you received</p>}
      </div>

      {/* ── Agency Filters ── */}
      <div className="mx-auto max-w-5xl overflow-x-auto px-4 pt-5 pb-2">
        <div className="flex gap-2">
          {AGENCY_FILTERS.map((a) => (
            <button
              key={a}
              onClick={() => setAgency(a)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                agency === a
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-700/30'
                  : 'bg-white/5 border border-white/10 text-blue-300 hover:bg-white/10'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ── Form Cards ── */}
      <main className="mx-auto max-w-5xl px-4 pt-3 pb-8">
        {filtered.length === 0 ? (
          <div className="mt-12 text-center text-blue-300/60">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">No forms match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((form) => (
              <FormCard key={form.slug} form={form} />
            ))}
          </div>
        )}

        {/* ── Coming Soon + Suggestion Form ── */}
        <div className="mt-10 space-y-4">
          {/* Coming soon banner */}
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
            <div className="text-2xl mb-2">🔜</div>
            <p className="text-sm font-semibold text-blue-200">More forms coming soon …</p>
            <p className="text-xs text-blue-300/60 mt-1">BIR, SSS, PhilHealth, PSA, DFA, LTO and more</p>
          </div>

          {/* Suggestion form */}
          <SuggestionForm />
        </div>
      </main>
    </div>
  );
}

// ─── FormCard ─────────────────────────────────────────────────────────────────
function FormCard({ form }: { form: FormSchema }) {
  return (
    <Link
      href={`/forms/${form.slug}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.07] hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-xl shrink-0">📄</div>
        <span className="rounded-full bg-blue-900/40 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase tracking-wide whitespace-nowrap">{form.agency}</span>
      </div>
      <div className="mt-3 flex-1">
        <div className="text-[10px] font-mono text-blue-400/70 mb-1">{form.code}</div>
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-3 group-hover:text-blue-200 transition-colors">
          {form.name}
        </h3>
        <p className="mt-2 text-xs text-blue-300/60 line-clamp-2">{form.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-blue-400/60">{form.fields.length} fields</span>
        <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">Fill Now →</span>
      </div>
    </Link>
  );
}

// ─── SuggestionForm ───────────────────────────────────────────────────────────
function SuggestionForm() {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [suggestion, setSuggestion]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestion.trim()) { setError('Please enter a suggestion.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, suggestion }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-blue-500/30 bg-blue-900/20 p-6 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <p className="text-sm font-semibold text-blue-200">Suggestion received — thank you!</p>
        <p className="text-xs text-blue-300/60 mt-1">We&apos;ll review it and add it to the roadmap.</p>
        <button
          onClick={() => { setSubmitted(false); setSuggestion(''); setName(''); setEmail(''); }}
          className="mt-3 text-xs text-blue-400 underline"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💡</span>
        <div>
          <div className="text-sm font-bold text-white">Suggest a Form</div>
          <div className="text-xs text-blue-300/60">Which government form should we add next?</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-blue-300/70 uppercase tracking-wide font-semibold mb-1">Your Name <span className="normal-case font-normal opacity-60">(optional)</span></label>
            <input
              type="text"
              placeholder="Juan Dela Cruz"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-[10px] text-blue-300/70 uppercase tracking-wide font-semibold mb-1">Email <span className="normal-case font-normal opacity-60">(optional)</span></label>
            <input
              type="email"
              placeholder="you@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-blue-300/70 uppercase tracking-wide font-semibold mb-1">Your Suggestion <span className="text-red-400">*</span></label>
          <textarea
            placeholder="e.g. BIR Form 2316, SSS Contribution Form, PhilHealth MDR..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition resize-none"
            rows={3}
            value={suggestion}
            onChange={(e) => { setSuggestion(e.target.value); setError(''); }}
            maxLength={2000}
            required
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </>
          ) : '📬 Send Suggestion'}
        </button>
      </form>
    </div>
  );
}
