'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DevSection from './DevSection';
import DonationModal from '@/components/DonationModal';

export default function AboutContent() {
  const [vis, setVis] = useState({
    p1: false, p2: false, p3: false,
    how: false, s1: false, s2: false, s3: false, s4: false,
    fee: false,
    dev: false,
  });
  const [showMore, setShowMore] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showBuiltBy, setShowBuiltBy] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  function handleLearnMore() {
    const opening = !showMore;
    // Collapse others
    setShowDonation(false); setVis(v => ({ ...v, fee: false }));
    setShowBuiltBy(false);  setVis(v => ({ ...v, dev: false }));
    if (!opening) { setShowMore(false); setVis(v => ({ ...v, p1: false, p2: false, p3: false })); return; }
    setShowMore(true);
    setTimeout(() => setVis(v => ({ ...v, p1: true })), 50);
    setTimeout(() => setVis(v => ({ ...v, p2: true })), 450);
    setTimeout(() => setVis(v => ({ ...v, p3: true })), 850);
  }

  function handleDonation() {
    const opening = !showDonation;
    // Collapse others
    setShowMore(false);    setVis(v => ({ ...v, p1: false, p2: false, p3: false }));
    setShowBuiltBy(false); setVis(v => ({ ...v, dev: false }));
    if (!opening) { setShowDonation(false); setVis(v => ({ ...v, fee: false })); return; }
    setShowDonation(true);
    setTimeout(() => setVis(v => ({ ...v, fee: true })), 50);
  }

  function handleBuiltBy() {
    const opening = !showBuiltBy;
    // Collapse others
    setShowMore(false);    setVis(v => ({ ...v, p1: false, p2: false, p3: false }));
    setShowDonation(false); setVis(v => ({ ...v, fee: false }));
    if (!opening) { setShowBuiltBy(false); setVis(v => ({ ...v, dev: false })); return; }
    setShowBuiltBy(true);
    setTimeout(() => setVis(v => ({ ...v, dev: true })), 50);
  }

  useEffect(() => {
    const timers = [
      setTimeout(() => setVis(v => ({ ...v, how: true })),  1000),
      setTimeout(() => setVis(v => ({ ...v, s1: true  })),  1800),
      setTimeout(() => setVis(v => ({ ...v, s2: true  })),  2400),
      setTimeout(() => setVis(v => ({ ...v, s3: true  })),  3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const fd = (v: boolean) =>
    `transition-all duration-[900ms] ease-out ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`;

  const STEPS = [
    { step: '1', title: 'Pick a Form',    body: 'Choose from the list of available Philippine government forms.',             vk: 's1' as const },
    { step: '2', title: 'Fill It In w/ Smart Assistance',     body: 'Complete the form with auto-complete support for faster data entry (e.g. Cities, Branches, etc).',                                       vk: 's2' as const },
    { step: '3', title: 'Generate PDF',   body: 'Generated PDF is processed locally on your device.',                          vk: 's3' as const },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
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
          <Link href="/" className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors tracking-wide">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12 text-center">
          {/* Logo-styled wordmark: matches /public/quickformsph-logo-transparent-slogan2.png */}
          <h1 className="font-black uppercase leading-none tracking-tight text-3xl sm:text-4xl mb-2">
            <span className="text-white">QUICKFORMS</span>
            <span className="text-blue-500"> PH</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 mb-4">
            Government Forms, Done Fast.
          </p>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Offline-first tool that helps Filipinos fill government forms and generate print-ready PDFs directly in the browser.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-slate-400">
            {['No account required', 'No data uploaded', 'Works on any device'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className={`text-center mb-7 ${fd(vis.how)}`}>
            <h2 className="text-2xl font-black text-gray-900">How It Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {STEPS.map(({ step, title, body, vk }) => (
              <div key={step} className={`flex flex-col items-center ${fd(vis[vk])}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-black text-sm mb-4 shadow-sm">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dropdown row ── */}
      <section className="mx-auto max-w-5xl px-6 pt-2 pb-2">
        <div className={`flex items-center justify-center gap-3 transition-opacity duration-700 ${vis.s3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Learn more */}
          <button
            type="button"
            onClick={handleLearnMore}
            aria-expanded={showMore}
            disabled={!vis.s3}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showMore ? 'Show less' : 'Learn more'}
            <svg className={`h-3.5 w-3.5 transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <span className="text-gray-200 select-none">|</span>

          {/* Donation */}
          <button
            type="button"
            onClick={handleDonation}
            disabled={!vis.s3}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Donation
            <svg className={`h-3.5 w-3.5 transition-transform duration-300 ${showDonation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <span className="text-gray-200 select-none">|</span>

          {/* Built by Filipino */}
          <button
            type="button"
            onClick={handleBuiltBy}
            disabled={!vis.s3}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Built by Filipino
            <svg className={`h-3.5 w-3.5 transition-transform duration-300 ${showBuiltBy ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {showMore && (
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-6">

          {/* Privacy */}
          <div className={`rounded-2xl border border-gray-100 bg-white p-7 shadow-sm ${fd(vis.p1)}`}>
            {/* Flat illustration: browser window with shield+lock — data stays inside the browser */}
            <div className="mb-5 flex items-center justify-center rounded-xl bg-gray-50 h-28">
              <svg viewBox="0 0 200 100" className="h-24 w-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* browser frame */}
                <rect x="20" y="18" width="160" height="70" rx="6" fill="#ffffff" stroke="#bfdbfe" strokeWidth="2"/>
                <rect x="20" y="18" width="160" height="14" rx="6" fill="#dbeafe"/>
                <circle cx="29" cy="25" r="2" fill="#93c5fd"/>
                <circle cx="36" cy="25" r="2" fill="#93c5fd"/>
                <circle cx="43" cy="25" r="2" fill="#93c5fd"/>
                {/* shield */}
                <path d="M100 42 L120 50 V64 C120 74 110 80 100 84 C90 80 80 74 80 64 V50 Z" fill="#2563eb"/>
                {/* lock body */}
                <rect x="93" y="60" width="14" height="12" rx="2" fill="#ffffff"/>
                <path d="M96 60 V56 a4 4 0 0 1 8 0 V60" fill="none" stroke="#ffffff" strokeWidth="2"/>
                <circle cx="100" cy="66" r="1.5" fill="#2563eb"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Private by Design</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              All form data is processed entirely within your browser. No information is ever sent to,
              stored on, or processed by any external server.
            </p>
          </div>

          {/* Official Forms */}
          <div className={`rounded-2xl border border-gray-100 bg-white p-7 shadow-sm ${fd(vis.p2)}`}>
            {/* Flat illustration: official document with seal + verified check */}
            <div className="mb-5 flex items-center justify-center rounded-xl bg-gray-50 h-28">
              <svg viewBox="0 0 200 100" className="h-24 w-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* document */}
                <rect x="55" y="15" width="80" height="74" rx="4" fill="#ffffff" stroke="#bbf7d0" strokeWidth="2"/>
                <line x1="65" y1="30" x2="115" y2="30" stroke="#86efac" strokeWidth="2" strokeLinecap="round"/>
                <line x1="65" y1="40" x2="125" y2="40" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
                <line x1="65" y1="48" x2="120" y2="48" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
                <line x1="65" y1="56" x2="110" y2="56" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
                <line x1="65" y1="64" x2="118" y2="64" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round"/>
                {/* official seal/badge */}
                <circle cx="140" cy="68" r="18" fill="#16a34a"/>
                <path d="M132 68 l6 6 l12 -12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {/* small star = government */}
                <path d="M75 78 l2 4 l4 .5 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -.5 z" fill="#22c55e"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Official Templates</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Forms are based on official Philippine government templates, accurately reproduced for correctness.
            </p>
          </div>

          {/* Instant PDF */}
          <div className={`rounded-2xl border border-gray-100 bg-white p-7 shadow-sm ${fd(vis.p3)}`}>
            {/* Flat illustration: PDF file with download arrow */}
            <div className="mb-5 flex items-center justify-center rounded-xl bg-gray-50 h-28">
              <svg viewBox="0 0 200 100" className="h-24 w-auto" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* PDF document */}
                <path d="M70 12 H115 L135 32 V78 a4 4 0 0 1 -4 4 H70 a4 4 0 0 1 -4 -4 V16 a4 4 0 0 1 4 -4 z" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2"/>
                <path d="M115 12 V32 H135" fill="#ede9fe" stroke="#ddd6fe" strokeWidth="2"/>
                {/* PDF label */}
                <rect x="74" y="48" width="32" height="16" rx="2" fill="#7c3aed"/>
                <text x="90" y="60" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700">PDF</text>
                {/* download arrow */}
                <line x1="100" y1="78" x2="100" y2="92" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"/>
                <path d="M92 86 L100 94 L108 86" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {/* tray */}
                <line x1="80" y1="96" x2="120" y2="96" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Instant PDF Download</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              PDFs are generated offline, ready to print and no external processing needed.
            </p>
          </div>

        </div>
      </section>
      )}

      {/* ── Fee Note (Donation dropdown) ── */}
      {showDonation && (
      <section className="mx-auto max-w-5xl px-6 py-6">
        <div
          className={`rounded-2xl bg-gray-50/50 p-8 cursor-pointer select-none ${fd(vis.fee)}`}
          style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
          onClick={() => setShowDonationModal(true)}
          onMouseMove={(e) => {
            const el = e.currentTarget;
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
            const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -14;
            el.style.transform = `rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
            el.style.boxShadow = `${-x * 2}px ${y * 2}px 32px rgba(0,0,0,0.10)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <div style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
            <h3 className="font-bold text-gray-900 mb-1.5">Small Donation</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              QuickFormsPH accepts <strong>donation</strong> to help cover maintenance, add new forms,
              and support ongoing improvements. Every peso helps keep the service running for Filipinos.{' '}
              <strong>Salamat po!</strong>
            </p>
            <p className="mt-3 text-xs text-green-400 font-semibold">Tap to donate →</p>
          </div>
        </div>
      </section>
      )}

      {showDonationModal && <DonationModal onClose={() => setShowDonationModal(false)} />}

      {/* ── Developer (Built by Filipino dropdown) ── */}
      {showBuiltBy && (
      <section className="mx-auto max-w-5xl px-6 pb-6">
        <DevSection forceVisible={vis.dev} />
      </section>
      )}

    </div>
  );
}
