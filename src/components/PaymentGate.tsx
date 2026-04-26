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
            <div className={`relative ${isExiting ? 'carousel-exit' : 'carousel-enter'} bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden`}>
              <ChoiceScreen
                formName={formName}
                formCode={formCode}
                agency={agency}
                existingToken={existingToken}
                onDemo={() => { trackEvent('demo_click', formCode); onAccessGranted?.(true); triggerExit(() => setDemoMode(true)); }}
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
      {/* Banner header — standard-banner.png as background, logo + agency on top */}
      <div
        className="relative w-full flex flex-col items-center justify-end pt-10 pb-5 px-6"
        style={{
          backgroundImage: `url('/standard-banner.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          minHeight: '160px',
        }}
        onError={undefined}
      >
        {/* Gradient overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-white/80 rounded-t-3xl pointer-events-none" />
        {/* Close button inside banner */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white text-lg leading-none transition-colors"
            aria-label="Close"
          >×</button>
        )}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-3">
            {logo ? (
              <Image src={logo.src} alt={agency} width={logo.w} height={logo.h} className="object-contain" />
            ) : (
              <span className="text-3xl" aria-hidden>📄</span>
            )}
          </div>
          <p className="text-[11px] uppercase tracking-widest font-bold text-blue-600 mb-1">{formCode}</p>
          <h2 className="text-base font-bold text-gray-900 leading-snug text-center">{formName}</h2>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pt-4 pb-7 sm:px-8">
        <p className="text-base font-semibold text-gray-500 text-center mb-5">How would you like to access?</p>

        <div className="grid grid-cols-2 gap-3">
        {/* Demo */}
        <button
          type="button"
          onClick={onDemo}
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 hover:border-gray-300 bg-gray-50/60 hover:bg-gray-100/70 px-3 py-4 active:scale-[.97] transition-all"
        >
          <span className="text-2xl" aria-hidden>🧪</span>
          <span className="text-sm font-bold text-gray-800">Demo</span>
          <span className="text-[10px] text-gray-500 text-center leading-tight">Try it out, first</span>
        </button>

        {/* Proceed (paid) OR Pay ₱5 */}
        {existingToken ? (
          <button
            type="button"
            onClick={onProceed}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-green-500 hover:border-green-700 bg-green-50 hover:bg-green-100 px-3 py-4 active:scale-[.97] transition-all"
          >
            <span className="text-2xl" aria-hidden>✅</span>
            <span className="text-sm font-bold text-green-700">Proceed</span>
            <span className="text-[10px] text-green-600 text-center leading-tight">{timeLeft}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPay}
            className="flex flex-col items-center gap-2 rounded-2xl border border-blue-200 hover:border-blue-300 bg-blue-50/60 hover:bg-blue-100/70 px-3 py-4 active:scale-[.97] transition-all"
          >
            <span className="text-2xl" aria-hidden>💚</span>
            <span className="text-sm font-bold text-blue-700">Donate ₱5</span>
            <span className="text-[10px] text-blue-500 text-center leading-tight">24-hr full access</span>
          </button>
        )}
        </div>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onKey}
            className="text-xs text-gray-400 hover:text-gray-600 underline-offset-4 hover:underline transition-colors"
          >
            I have a promo code.
          </button>
        </div>
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


