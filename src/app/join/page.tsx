'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

const ANON_KEY = 'qfph_anon_id';

function getOrCreateAnonId(): string {
  try {
    const existing = localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const id = 'anon-' + crypto.randomUUID().replace(/-/g, '').slice(0, 16) + '@quickformsph.anon';
    localStorage.setItem(ANON_KEY, id);
    return id;
  } catch {
    return 'anon-' + Math.random().toString(36).slice(2, 18) + '@quickformsph.anon';
  }
}

function JoinContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const ref_token = params.get('ref') ?? '';

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [accepted, setAccepted]     = useState(false);
  const hasAttempted = useRef(false);

  if (!ref_token) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Invalid referral link.</p>
        <Link href="/" className="text-blue-700 underline text-sm">Go to QuickFormsPH</Link>
      </div>
    );
  }

  const handleAccept = async () => {
    if (hasAttempted.current || submitting) return;
    hasAttempted.current = true;
    setSubmitting(true);
    setError(null);

    const anonEmail = getOrCreateAnonId();

    try {
      const res  = await fetch('/api/referral/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_token, email: anonEmail }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        // "already recorded" errors are fine — still redirect
        if (data.error && !data.error.toLowerCase().includes('already')) {
          setError(data.error ?? 'Something went wrong.');
          hasAttempted.current = false;
          setSubmitting(false);
          return;
        }
      }
      setAccepted(true);
      setTimeout(() => router.replace('/'), 1500);
    } catch {
      setError('Network error. Please try again.');
      hasAttempted.current = false;
      setSubmitting(false);
    }
  };

  if (accepted) {
    return (
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">Invitation accepted!</h1>
        <p className="text-sm text-gray-500">Redirecting you to QuickFormsPH…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
        <span className="text-4xl">👋</span>
      </div>
      <h1 className="text-xl font-black text-gray-900 mb-2">You&apos;ve been invited!</h1>
      <p className="text-sm text-gray-500 mb-6">
        A friend shared QuickFormsPH with you. Accept the invitation to help them earn a free promo code — no sign-up required.
      </p>
      <button
        type="button"
        onClick={handleAccept}
        disabled={submitting}
        className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-5 py-3 text-sm font-bold text-white transition-colors mb-3"
      >
        {submitting ? '…' : '✅ Accept Invitation'}
      </button>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <p className="text-[11px] text-gray-400">No account or payment needed.</p>
    </>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
          <Link href="/">
            <Image src="/quickformsph-logo-transparent-slogan2.png" alt="QuickFormsPH" width={140} height={36} className="h-8 w-auto" />
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-blue-700 transition-colors">← Back to Forms</Link>
        </div>
      </header>
      <main className="mx-auto max-w-sm px-4 py-14 text-center">
        <Suspense fallback={<div className="text-gray-400 text-sm">Loading…</div>}>
          <JoinContent />
        </Suspense>
      </main>
    </div>
  );
}

