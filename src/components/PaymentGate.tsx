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
import {
  writeAccessToken,
  type StoredAccessToken,
} from '@/lib/access-token-client';

type Mode = 'choice' | 'pay' | 'key';

interface Props {
  formName: string;
  formCode: string;
  /** Called when the user selects an access method. isDemo=true when Demo is chosen. */
  onAccessGranted?: (isDemo: boolean) => void;
  /** Render PaymentModal — keeps PaymentGate decoupled from its concrete UI. */
  renderPaymentModal: (args: {
    onSuccess: (token: StoredAccessToken) => void;
    onClose: () => void;
  }) => React.ReactNode;
  /** Children render only when a valid token or demo mode is active. */
  children: React.ReactNode;
}

export default function PaymentGate({
  formName,
  formCode,
  onAccessGranted,
  renderPaymentModal,
  children,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [mode, setMode]         = useState<Mode>('choice');

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Avoid SSR/hydration flash.
  if (!hydrated) return null;

  // ── Demo mode (no token needed) ───────────────────────────────────────────
  if (demoMode) {
    return <>{children}</>;
  }

  // ── Callback shared by Pay + Key flows ────────────────────────────────────
  const handleTokenIssued = (t: StoredAccessToken) => {
    writeAccessToken(t);
    setMode('choice');
    onAccessGranted?.(false);
    // Proceed directly to form after token issued
    setDemoMode(true);
  };

  // ── Locked: show choice / pay / key screens ───────────────────────────────
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-gray-500 hover:text-gray-800 text-lg" aria-label="Back">←</a>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono text-gray-400 truncate">{formCode}</div>
            <div className="text-xs font-medium text-gray-700 truncate">{formName}</div>
          </div>
        </header>

        <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:py-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-6 py-7 sm:px-8 sm:py-9">
              {mode === 'choice' && (
                <ChoiceScreen
                  formName={formName}
                  formCode={formCode}
                  onDemo={() => { onAccessGranted?.(true); setDemoMode(true); }}
                  onPay={() => setMode('pay')}
                  onKey={() => setMode('key')}
                />
              )}
              {mode === 'key' && (
                <LicenseKeyScreen
                  onSuccess={handleTokenIssued}
                  onBack={() => setMode('choice')}
                />
              )}
            </div>

            <div className="mt-5 text-center">
              <a
                href="/"
                className="text-xs text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline"
              >
                ← Browse other forms
              </a>
            </div>
          </div>
        </main>
      </div>

      {mode === 'pay' &&
        renderPaymentModal({
          onSuccess: handleTokenIssued,
          onClose: () => setMode('choice'),
        })}
    </>
  );
}

// ── Choice Screen ─────────────────────────────────────────────────────────────

function ChoiceScreen({
  formName,
  formCode,
  onDemo,
  onPay,
  onKey,
}: {
  formName: string;
  formCode: string;
  onDemo: () => void;
  onPay: () => void;
  onKey: () => void;
}) {
  return (
    <>
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-md">
          <span className="text-3xl" aria-hidden>🔓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">How would you like to access?</h2>
        <p className="text-xs text-gray-500 mb-1">{formName}</p>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">{formCode}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Demo */}
        <button
          type="button"
          onClick={onDemo}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-4 active:scale-[.97] transition-all"
        >
          <span className="text-2xl" aria-hidden>🧪</span>
          <span className="text-sm font-bold text-gray-800">Demo</span>
          <span className="text-[10px] text-gray-500 text-center leading-tight">Try it out for free</span>
        </button>

        {/* Pay ₱5 */}
        <button
          type="button"
          onClick={onPay}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-blue-500 hover:border-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-4 active:scale-[.97] transition-all"
        >
          <span className="text-2xl" aria-hidden>💚</span>
          <span className="text-sm font-bold text-blue-700">Pay ₱5</span>
          <span className="text-[10px] text-blue-500 text-center leading-tight">48-hr full access</span>
        </button>

        {/* License Key */}
        <button
          type="button"
          onClick={onKey}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-yellow-400 hover:border-yellow-500 bg-yellow-50 hover:bg-yellow-100 px-3 py-4 active:scale-[.97] transition-all"
        >
          <span className="text-2xl" aria-hidden>🔑</span>
          <span className="text-sm font-bold text-yellow-700">License Key</span>
          <span className="text-[10px] text-yellow-600 text-center leading-tight">Enter your key</span>
        </button>
      </div>

      <div className="mt-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
        <FeatureRow icon="🔒" text="Form data never leaves your device" />
        <FeatureRow icon="📱" text="Works offline after setup" />
        <FeatureRow icon="🚫" text="No account, no email, no tracking" />
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
    if (!trimmed) { setError('Please enter your license key.'); return; }
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
        setError(data.error ?? 'Invalid license key. Please check and try again.');
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
        <h2 className="text-lg font-bold text-gray-900 mb-1">Enter License Key</h2>
        <p className="text-xs text-gray-500">Paste or type your key below — unlocks 48-hour access.</p>
      </div>

      <input
        type="text"
        value={keyValue}
        onChange={(e) => { setKeyValue(e.target.value.toUpperCase()); setError(null); }}
        onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        maxLength={24}
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
        {loading ? 'Verifying…' : 'Redeem Key'}
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


