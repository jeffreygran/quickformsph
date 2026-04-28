'use client';

/**
 * PaymentGate (v3.0) — Step 0 pre-flight.
 *
 * Shows a 3-option choice screen when the user has no valid access token:
 *   [Demo]  [Pay ₱5]  [License Key]
 *
 * Demo     → proceeds straight to the form (no token written)
 * Pay ₱5   → opens PaymentModal (existing GCash flow)
 * License Key → inline key-entry form → POST /api/payment/redeem-key
 *
 * Once a token or demo mode is active, renders children.
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  readAccessToken,
  writeAccessToken,
  formatTimeLeft,
  type StoredAccessToken,
} from '@/lib/access-token-client';
import { trackEvent } from '@/lib/analytics-client';

type Mode = 'choice' | 'pay' | 'key';

interface Props {
  formName: string;
  formCode: string;
  formSlug: string;
  agency: string;
  /** Called when the user selects an access method. isDemo=true when Demo is chosen. */
  onAccessGranted?: (isDemo: boolean) => void;
  /** Render PaymentModal — keeps PaymentGate decoupled from its concrete UI. */
  renderPaymentModal: (args: {
    onSuccess: (token: StoredAccessToken) => void;
    onClose: () => void;
  }) => React.ReactNode;
  /** Called when user dismisses the gate (e.g. navigates back). */
  onClose?: () => void;
  /** Children render only when a valid token or demo mode is active. */
  children: React.ReactNode;
}

export default function PaymentGate({
  formName,
  formCode,
  formSlug,
  agency,
  onAccessGranted,
  onClose,
  renderPaymentModal,
  children,
}: Props) {
  const [hydrated, setHydrated]           = useState(false);
  const [demoMode, setDemoMode]             = useState(false);
  const [mode, setMode]                     = useState<Mode>('choice');
  const [existingToken, setExistingToken]   = useState<StoredAccessToken | null>(null);
  const [isExiting, setIsExiting]           = useState(false);

  useEffect(() => {
    setHydrated(true);
    setExistingToken(readAccessToken());
  }, []);

  // Avoid SSR/hydration flash.
  if (!hydrated) return null;

  // ── Demo mode (no token needed) ───────────────────────────────────────────
  if (demoMode) {
    return <>{children}</>;
  }

  // Carousel exit: plays slide-out animation then fires action
  const triggerExit = (action: () => void) => {
    setIsExiting(true);
    setTimeout(action, 290);
  };

  // ── Callback shared by Pay + Key flows ────────────────────────────────────
  const handleTokenIssued = (t: StoredAccessToken) => {
    writeAccessToken(t);
    setMode('choice');
    onAccessGranted?.(false);
    triggerExit(() => setDemoMode(true));
  };

  // ── Locked: show choice / pay screens + promo dialog ──────────────────────
  return (
    <>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-6 overflow-hidden">
          <div className="w-full max-w-md">
            <div className={`relative ${isExiting ? 'carousel-exit' : 'carousel-enter'} bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col`}>
              <ChoiceScreen
                formName={formName}
                formCode={formCode}
                agency={agency}
                existingToken={existingToken}
                onDemo={() => { trackEvent('demo_click', formSlug); onAccessGranted?.(true); triggerExit(() => setDemoMode(true)); }}
                onPay={() => setMode('pay')}
                onKey={() => setMode('key')}
                onClose={onClose}
                onProceed={() => { onAccessGranted?.(false); triggerExit(() => setDemoMode(true)); }}
              />
            </div>

          </div>
        </main>
      </div>

      {/* Promo code dialog */}
      {mode === 'key' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 px-6 py-7">
            <LicenseKeyScreen
              onSuccess={handleTokenIssued}
              onBack={() => setMode('choice')}
            />
          </div>
        </div>
      )}

      {mode === 'pay' &&
        renderPaymentModal({
          onSuccess: handleTokenIssued,
          onClose: () => setMode('choice'),
        })}
    </>
  );
}

// ── Agency logos (mirrors AGENCY_LOGO in form page) ────────────────────────────
const AGENCY_LOGO: Record<string, { src: string; w: number; h: number }> = {
  'Bureau of Internal Revenue': { src: '/logos/bir.png',        w: 44, h: 44 },
  'Pag-IBIG Fund':              { src: '/logos/pagibig.png',    w: 44, h: 44 },
  'PhilHealth':                 { src: '/logos/philhealth.png', w: 88, h: 27 },
};

// ── Choice Screen ─────────────────────────────────────────────────────────────

function ChoiceScreen({
  formName,
  formCode,
  agency,
  existingToken,
  onDemo,
  onPay,
  onKey,
  onProceed,
  onClose,
}: {
  formName: string;
  formCode: string;
  agency: string;
  existingToken: StoredAccessToken | null;
  onDemo: () => void;
  onPay: () => void;
  onKey: () => void;
  onProceed: () => void;
  onClose?: () => void;
}) {
  const logo = AGENCY_LOGO[agency];

  const [timeLeft, setTimeLeft] = useState(() =>
    existingToken ? formatTimeLeft(existingToken.expiresAt) : ''
  );

  useEffect(() => {
    if (!existingToken) return;
    const id = setInterval(() => {
      setTimeLeft(formatTimeLeft(existingToken.expiresAt));
    }, 30_000);
    return () => clearInterval(id);
  }, [existingToken]);

  return (
    <>
      {/* Banner — wave image only, logo overlaps the bottom edge */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: `url('/standard-banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          height: '120px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-t-3xl pointer-events-none" />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 hover:bg-black/25 text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12"/>
              <line x1="12" y1="2" x2="2" y2="12"/>
            </svg>
          </button>
        )}
        {/* Logo — anchored to banner bottom, half overlaps into white */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-md flex items-center justify-center">
            {logo ? (
              <Image src={logo.src} alt={agency} width={logo.w} height={logo.h} className="object-contain" />
            ) : (
              <span className="text-3xl" aria-hidden>📄</span>
            )}
          </div>
        </div>
      </div>

      {/* White area — padded to clear the overlapping logo, then form id + body */}
      <div className="px-6 pt-10 pb-6 sm:px-8 text-center">
        <p className="text-[11px] uppercase tracking-widest font-bold text-blue-600 mb-0.5">{formCode}</p>
        <h2 className="text-sm font-bold text-gray-900 leading-snug mb-4">{formName}</h2>

        <p className="text-[20px] font-semibold text-gray-500 mb-5">
          {existingToken ? 'Ready to continue?' : 'How would you like to access?'}
        </p>

        {/* Layout C — Horizontal Pill Stack */}

        {/* Pay / Proceed pill — only shown when token already exists */}
        {existingToken && (
          <button
            type="button"
            onClick={onProceed}
            className="flex flex-col justify-center items-center w-1/2 mx-auto rounded-full px-5 h-[58px] mb-2 bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_4px_20px_rgba(34,197,94,0.35)] hover:shadow-[0_6px_28px_rgba(34,197,94,0.45)] hover:-translate-y-0.5 active:scale-[.98] transition-all text-center border-0"
          >
            <div className="text-[15px] font-bold text-white leading-tight">Proceed</div>
            <div className="text-[10px] text-white/70 leading-tight subtitle-reveal-1300">{timeLeft}</div>
          </button>
        )}

        {/* Demo + Donate side by side */}
        {!existingToken && (
          <div className="flex gap-2 w-full mb-2">
            <button
              type="button"
              onClick={onDemo}
              className="flex flex-col justify-center items-center flex-1 rounded-full px-3 h-[58px] border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 active:scale-[.98] transition-all text-center"
            >
              <div className="text-[15px] font-bold text-gray-800 leading-tight">Demo</div>
              <div className="text-[10px] text-gray-400 leading-tight subtitle-reveal-1300">Try it out, first</div>
            </button>
            <button
              type="button"
              onClick={onPay}
              className="flex flex-col justify-center items-center flex-1 rounded-full px-3 h-[58px] bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 active:scale-[.98] transition-all text-center border-0"
            >
              <div className="text-[15px] font-bold text-white leading-tight">Donate ₱5</div>
              <div className="text-[10px] text-white/70 leading-tight subtitle-reveal-1300">24-hr access</div>
            </button>
          </div>
        )}

        {/* Promo link — hidden when user already has access */}
        {!existingToken && (
          <div className="mt-1 text-center">
            <button
              type="button"
              onClick={onKey}
              className="text-xs text-gray-400 hover:text-gray-600 underline-offset-4 hover:underline transition-colors"
            >
              I have a promo code.
            </button>
          </div>
        )}
      </div>

    </>
  );
}

// ── License Key Screen ────────────────────────────────────────────────────────

function LicenseKeyScreen({
  onSuccess,
  onBack,
}: {
  onSuccess: (token: StoredAccessToken) => void;
  onBack: () => void;
}) {
  const [keyValue, setKeyValue] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleRedeem = async () => {
    const trimmed = keyValue.trim().toUpperCase();
    if (!trimmed) { setError('Please enter your promo code.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/redeem-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode: trimmed }),
      });
      const data = await res.json() as {
        valid: boolean;
        token?: string;
        expiresAt?: number;
        refNo?: string;
        error?: string;
      };
      if (!data.valid || !data.token || !data.expiresAt) {
        setError(data.error ?? 'Invalid promo code. Please check and try again.');
        return;
      }
      onSuccess({ token: data.token, expiresAt: data.expiresAt, refNo: data.refNo ?? '', amount: 0 });
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Back
      </button>

      <div className="text-center mb-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center mb-3">
          <span className="text-3xl" aria-hidden>🔑</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Enter Promo Code</h2>
        <p className="text-xs text-gray-500">Paste or type your promo code below — unlocks 24-hour access.</p>
      </div>

      <input
        type="text"
        value={keyValue}
        onChange={(e) => { setKeyValue(e.target.value.toUpperCase()); setError(null); }}
        onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
        placeholder="XXXXX"
        maxLength={5}
        className="w-full rounded-xl border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none px-4 py-3 text-sm font-mono tracking-wider text-center mb-3 transition"
        autoComplete="off"
        spellCheck={false}
      />

      {error && (
        <p className="text-xs text-red-600 text-center mb-3">{error}</p>
      )}

      <button
        type="button"
        onClick={handleRedeem}
        disabled={loading}
        className="w-full rounded-xl bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-bold text-sm py-3.5 active:scale-[.98] transition-all"
      >
        {loading ? 'Verifying…' : 'Redeem Code'}
      </button>

      <div className="mt-3 text-center">
        <a
          href="/referral"
          className="text-xs text-blue-500 hover:text-blue-700 underline-offset-4 hover:underline transition-colors"
        >
          🤝 Don&apos;t have a code? Refer a Friend &amp; earn one free
        </a>
      </div>
    </>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base flex-shrink-0 leading-none mt-0.5" aria-hidden>{icon}</span>
      <span className="text-[13px] text-gray-700 leading-snug">{text}</span>
    </div>
  );
}


