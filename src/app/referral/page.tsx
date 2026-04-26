'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const REFERRAL_EMAIL_KEY = 'qfph_referral_email';

interface StatusData {
  registered: boolean;
  email?: string;
  ref_token?: string;
  count?: number;
  required?: number;
  promo_expiry_hours?: number;
  earned_codes?: { key_code: string; used: boolean; expired: boolean; expires_at: number | null }[];
}

function formatExpiry(ms: number | null): string {
  if (ms === null) return 'No expiry';
  const diff = ms - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function ReferralPage() {
  const [email, setEmail]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [status, setStatus]         = useState<StatusData | null>(null);
  const [copied, setCopied]         = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = useCallback(async (em: string) => {
    setLoadingStatus(true);
    try {
      const res  = await fetch(`/api/referral/status?email=${encodeURIComponent(em)}`);
      const data = await res.json() as StatusData;
      setStatus(data);
    } catch { /* ignore */ } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Auto-load if previously registered
  useEffect(() => {
    const saved = localStorage.getItem(REFERRAL_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      fetchStatus(saved);
    }
  }, [fetchStatus]);

  const handleRegister = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res  = await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      localStorage.setItem(REFERRAL_EMAIL_KEY, trimmed);
      await fetchStatus(trimmed);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const refLink = status?.ref_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${status.ref_token}`
    : '';

  const handleCopy = () => {
    if (!refLink) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(refLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = refLink;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ } finally {
      document.body.removeChild(ta);
    }
  };

  const progress   = status?.count ?? 0;
  const required   = status?.required ?? 5;
  const pct        = Math.min(100, Math.round((progress % required || (progress > 0 && progress % required === 0 ? required : 0)) / required * 100));
  const totalEarned = status?.earned_codes?.length ?? 0;
  const unusedCodes = status?.earned_codes?.filter((c) => !c.used && !c.expired) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/quickformsph-logo-transparent-slogan.png" alt="QuickFormsPH" width={140} height={36} className="h-8 w-auto" />
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-blue-700 transition-colors">← Back to Forms</Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
            <span className="text-4xl">🤝</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Refer a Friend</h1>
          <p className="text-sm text-gray-500">
            Refer <strong>{required}</strong> friends and earn a free promo code for QuickFormsPH.
            {status?.promo_expiry_hours && (
              <span className="text-gray-400"> (Code valid for {status.promo_expiry_hours}h)</span>
            )}
          </p>
        </div>

        {/* Registration / Status card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          {!status?.registered ? (
            <>
              <h2 className="text-sm font-bold text-gray-700 mb-3">Enter your email to get started</h2>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  placeholder="you@email.com"
                  className="flex-1 rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none px-3 py-2.5 text-sm transition"
                  disabled={submitting || loadingStatus}
                />
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={submitting || loadingStatus}
                  className="rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  {submitting ? '…' : 'Join'}
                </button>
              </div>
              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              <p className="text-[11px] text-gray-400 mt-2">No account needed — your email just identifies your referrals.</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-500 text-lg">✅</span>
                <div>
                  <div className="text-xs text-gray-400">Registered as</div>
                  <div className="text-sm font-bold text-gray-900">{status.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem(REFERRAL_EMAIL_KEY); setStatus(null); setEmail(''); }}
                  className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 underline"
                >
                  Change
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress this cycle</span>
                  <span className="font-bold">{progress % required || (progress > 0 && progress % required === 0 ? required : 0)} / {required}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Total referred: <strong>{progress}</strong> · Promo codes earned: <strong>{totalEarned}</strong>
                </div>
              </div>

              {/* Referral link */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-1.5">Your referral link</div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={refLink}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors"
                  >
                    {copied ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {/* Earned codes */}
              {unusedCodes.length > 0 && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                  <div className="text-xs font-bold text-green-800 mb-2">🎉 You earned a promo code!</div>
                  {unusedCodes.map((c) => (
                    <div key={c.key_code} className="flex items-center justify-between mb-1.5 last:mb-0">
                      <span className="font-mono text-base font-black tracking-widest text-green-900">{c.key_code}</span>
                      <span className="text-[11px] text-green-600">{formatExpiry(c.expires_at)}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-green-600 mt-2">Enter this code in the promo code box when filling a form.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-3">How it works</h2>
          <ol className="space-y-3">
            {[
              'Enter your email to get your referral link.',
              'Share it with friends — each acceptance counts as one referral.',
              `Reach ${required} referrals to earn a free promo code and keep earning more.`,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
