'use client';

/**
 * LocalModeOverlay (v2.0) — Option A, mobile-first.
 *
 * A full-page overlay that gates form access until the device has cached
 * everything needed to fill and generate the PDF entirely in the browser.
 *
 * 3 visual states:
 *   "downloading" → progress card with animated step list
 *   "ready"       → green "Safe to disconnect" card with primary CTA
 *   "active"      → dismissed; renders only the persistent green banner
 *                   (the parent toggles `phase` to drive the transition)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ensureServiceWorker,
  precacheFormTemplate,
  markLocalModeReady,
  setPrivacyAck,
  hasPrivacyAck,
  INITIAL_PROGRESS,
  type LocalModeProgress,
  type LocalModeStatus,
} from '@/lib/local-mode';
import { getPdfjsLib } from '@/lib/get-pdfjs';

// Static public assets needed for offline rendering.
const OFFLINE_ASSETS = [
  '/logos/bir.png',
  '/logos/pagibig.png',
  '/logos/philhealth.png',
  '/quickformsph-logo-transparent-slogan2.png',
  '/quickformsph-logo-transparent.png',
  '/quickformsph-logo.png',
];

interface Props {
  /** PDF template path under /public/forms/ (e.g. "hqp-pff-356.pdf"). */
  pdfPath: string;
  /** Form display name shown to the user. */
  formName: string;
  /** Form code shown as small subtitle (e.g. "HQP-PFF-356"). */
  formCode: string;
  /** Parent receives the moment the user clicks "Start Filling Form". */
  onActivated: () => void;
}

type Phase = 'downloading' | 'ready' | 'active';

export default function LocalModeOverlay({ pdfPath, formName, formCode, onActivated }: Props) {
  const [phase, setPhase] = useState<Phase>('downloading');
  const [progress, setProgress] = useState<LocalModeProgress>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return hasPrivacyAck();
    return false;
  });
  const [verifyOffline, setVerifyOffline]   = useState(false);
  const [onlineError, setOnlineError]       = useState(false);
  const [checking, setChecking]             = useState(false);
  const [checkAttempt, setCheckAttempt]     = useState(0);

  // Run the download/cache pipeline on mount.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Engine: pdf-lib is bundled in our app shell — register SW + warm it up.
        setProgress((p) => ({ ...p, engine: 'in-progress' }));
        await ensureServiceWorker();
        // Pre-load all JS chunks needed for offline PDF generation.
        // The SW's /_next/static/ handler will cache them on first fetch.
        await Promise.all([
          import('pdf-lib'),
          getPdfjsLib(),
        ]);
        // Pre-cache logos and public images so they display offline.
        await Promise.allSettled(
          OFFLINE_ASSETS.map((url) =>
            fetch(url, { cache: 'force-cache' }).catch(() => {}),
          ),
        );
        if (cancelled) return;
        setProgress((p) => ({ ...p, engine: 'done' }));
        await sleep(220); // small visual beat

        // Template: fetch + cache the actual form PDF.
        setProgress((p) => ({ ...p, template: 'in-progress' }));
        const ok = await precacheFormTemplate(pdfPath);
        if (cancelled) return;
        if (!ok) throw new Error('Could not cache form template');
        setProgress((p) => ({ ...p, template: 'done' }));
        await sleep(220);

        // Verify: confirm the cached file is accessible.
        setProgress((p) => ({ ...p, verify: 'in-progress' }));
        await sleep(280);
        const probe = await fetch(`/forms/${pdfPath}`, { cache: 'force-cache' });
        if (!probe.ok) throw new Error('Cache verification failed');
        if (cancelled) return;
        setProgress((p) => ({ ...p, verify: 'done' }));

        markLocalModeReady(formCode);
        await sleep(380);
        if (!cancelled) setPhase('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('[local-mode]', err);
        setError(err instanceof Error ? err.message : 'Setup failed');
      }
    }

    // Always run the full pipeline on every visit (fresh instance).
    run();

    return () => {
      cancelled = true;
    };
  }, [pdfPath, formCode]);

  const handleStart = useCallback(async () => {
    if (verifyOffline) {
      setChecking(true);
      setCheckAttempt(0);
      setOnlineError(false);

      let foundOnline = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        setCheckAttempt(attempt);

        // Primary: browser connectivity flag
        if (navigator.onLine) {
          foundOnline = true;
          break;
        }

        // Secondary: real network probe
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3000);
          await fetch('https://www.google.com/favicon.ico', {
            mode: 'no-cors',
            cache: 'no-store',
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          foundOnline = true;
          break;
        } catch {
          // offline — continue to next attempt
        }

        // Wait 1.5s before next attempt (skip after last)
        if (attempt < 3) {
          await new Promise<void>((r) => setTimeout(r, 1500));
        }
      }

      setChecking(false);
      setCheckAttempt(0);

      if (foundOnline) {
        setOnlineError(true);
        return;
      }
    }
    setOnlineError(false);
    setPrivacyAck();
    setPhase('active');
    onActivated();
  }, [onActivated, verifyOffline]);

  const handleRetry = useCallback(() => {
    setError(null);
    setProgress(INITIAL_PROGRESS);
    setPhase('downloading');
    // Re-run the effect by remounting via a key change in the parent if needed.
    // Simple inline retry:
    (async () => {
      try {
        setProgress((p) => ({ ...p, engine: 'in-progress' }));
        await ensureServiceWorker();
        await import('pdf-lib');
        setProgress((p) => ({ ...p, engine: 'done' }));
        setProgress((p) => ({ ...p, template: 'in-progress' }));
        const ok = await precacheFormTemplate(pdfPath);
        if (!ok) throw new Error('Could not cache form template');
        setProgress((p) => ({ ...p, template: 'done' }));
        setProgress((p) => ({ ...p, verify: 'in-progress' }));
        const probe = await fetch(`/forms/${pdfPath}`, { cache: 'force-cache' });
        if (!probe.ok) throw new Error('Cache verification failed');
        setProgress((p) => ({ ...p, verify: 'done' }));
        markLocalModeReady(formCode);
        setPhase('ready');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Setup failed');
      }
    })();
  }, [pdfPath, formCode]);

  // Persistent banner is rendered by the PARENT when phase === 'active'.
  // Returning null here lets the parent fully control its UI without flicker.
  if (phase === 'active') {
    return null;
  }

  const completed =
    Number(progress.engine === 'done') +
    Number(progress.template === 'done') +
    Number(progress.verify === 'done');
  const percent = Math.round((completed / 3) * 100);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-white/97 backdrop-blur-sm overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-mode-title"
      >
        <div className="w-full max-w-md mx-auto my-auto px-5 py-6">
          <div
            key={error ? 'error' : phase}
            className="carousel-enter bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {error ? (
              <div className="px-6 py-7 sm:px-8 sm:py-9">
                <ErrorState message={error} onRetry={handleRetry} />
              </div>
            ) : phase === 'downloading' ? (
              <div className="px-6 py-7 sm:px-8 sm:py-9">
                <DownloadingState
                  formName={formName}
                  formCode={formCode}
                  progress={progress}
                  percent={percent}
                />
              </div>
            ) : (
              <>
                {/* Banner image — top edge, full width */}
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logos/programlocally-banner.png"
                    alt="Program runs locally"
                    className="w-full object-cover object-top"
                    style={{ maxHeight: '180px' }}
                    onLoad={() => {
                      const title = document.getElementById('local-mode-title');
                      if (title) title.style.display = 'none';
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                      const title = document.getElementById('local-mode-title');
                      if (title) title.style.display = '';
                    }}
                  />
                  {/* Fallback icon — hidden unless image fails */}
                  <div className="hidden items-center justify-center py-6 bg-indigo-50">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-6 sm:px-8">
                  <ReadyState
                    formName={formName}
                    formCode={formCode}
                    consentChecked={consentChecked}
                    onConsentChange={setConsentChecked}
                    verifyOffline={verifyOffline}
                    onVerifyOfflineChange={setVerifyOffline}
                    onlineError={onlineError}
                    checking={checking}
                    checkAttempt={checkAttempt}
                    onStart={handleStart}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function DownloadingState({
  formName,
  formCode,
  progress,
  percent,
}: {
  formName: string;
  formCode: string;
  progress: LocalModeProgress;
  percent: number;
}) {
  return (
    <>
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <span className="text-3xl" aria-hidden>📥</span>
        </div>
        <h2 id="local-mode-title" className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
          Preparing Local Mode
        </h2>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-700 mb-4">
          {formCode}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          We&apos;re downloading everything needed to fill and generate your PDF{' '}
          <strong className="text-gray-900">right on your device.</strong> Once ready, no data will
          ever leave your phone or computer.
        </p>
      </div>

      <div className="bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 text-center mb-5">{percent}% complete</div>

      <ul className="space-y-2.5">
        <StepItem status={progress.engine} label="PDF generation engine (pdf-lib)" />
        <StepItem status={progress.template} label="Form template" />
        <StepItem status={progress.verify} label="Offline readiness check" />
      </ul>

      <p className="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
        🔒 No personal data has been collected yet. This setup uses only the form template — never
        your information.
      </p>
    </>
  );
}

function ReadyState({
  formName,
  formCode,
  consentChecked,
  onConsentChange,
  verifyOffline,
  onVerifyOfflineChange,
  onlineError,
  checking,
  checkAttempt,
  onStart,
}: {
  formName: string;
  formCode: string;
  consentChecked: boolean;
  onConsentChange: (v: boolean) => void;
  verifyOffline: boolean;
  onVerifyOfflineChange: (v: boolean) => void;
  onlineError: boolean;
  checking: boolean;
  checkAttempt: number;
  onStart: () => void;
}) {
  const [nudgeKey, setNudgeKey] = useState(0);
  const prevOnlineError = useRef(false);

  // Shake every time onlineError fires (first show or repeat attempt)
  useEffect(() => {
    if (onlineError) {
      setNudgeKey((k) => k + 1);
    }
    prevOnlineError.current = onlineError;
  }, [onlineError]);

  return (
    <>
      {/* Header — only shown when banner image fails to load */}
      <div className="text-center mb-5">
        <h2 id="local-mode-title" className="text-lg sm:text-xl font-bold text-gray-900 mb-1" style={{ display: 'none' }}>
          Program now runs locally
        </h2>
      </div>

      {/* Privacy first banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-green-800 leading-relaxed">
          🔒 <strong>Privacy first:</strong> You can safely go offline — everything runs on your device.
        </p>
      </div>

      {/* Offline / Online toggle — same row as label */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="text-sm text-gray-600 font-medium">Keep me</span>
        <button
          type="button"
          role="switch"
          aria-checked={!verifyOffline}
          onClick={() => onVerifyOfflineChange(!verifyOffline)}
          className={
            'relative inline-flex h-8 w-[108px] flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none ' +
            (!verifyOffline ? 'bg-green-500' : 'bg-gray-400')
          }
        >
          <span
            className={
              'absolute text-[11px] font-bold text-white top-1/2 -translate-y-1/2 select-none transition-all duration-300 ' +
              (!verifyOffline ? 'left-3' : 'right-3')
            }
          >
            {!verifyOffline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span
            className={
              'absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ' +
              (!verifyOffline ? 'right-1' : 'left-1')
            }
          />
        </button>
      </div>

      {/* Internet check progress */}

      {/* Internet check progress */}
      {checking && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-700 font-semibold">
              Checking internet connectivity…
            </p>
            <span className="text-[10px] text-blue-500">{checkAttempt}/3</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-700 ease-in-out"
              style={{ width: `${Math.round((checkAttempt / 3) * 100)}%` }}
            />
          </div>
          <div className="flex gap-1.5 mt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  n < checkAttempt
                    ? 'bg-blue-500'
                    : n === checkAttempt
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-blue-100'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {onlineError && !checking && verifyOffline && (
        <div
          key={nudgeKey}
          className="shake mb-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3"
        >
          <p className="text-xs text-orange-800 leading-relaxed mb-2">
            <strong>Still connected to the internet.</strong> Please turn off your WiFi or mobile data before continuing in offline mode.
          </p>
          <button
            type="button"
            onClick={() => onVerifyOfflineChange(false)}
            className="text-xs font-semibold text-blue-600 underline underline-offset-2"
          >
            Keep me Online instead
          </button>
        </div>
      )}

      {/* Consent — plain row near button */}
      <label className="flex items-center gap-3 cursor-pointer mb-3 select-none px-1">
        <span
          className={
            'flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ' +
            (consentChecked
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300')
          }
        >
          {consentChecked && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={consentChecked}
          onChange={(e) => onConsentChange(e.target.checked)}
        />
        <span className="text-sm text-gray-600 leading-snug">
          Data stays on my device. I agree.
        </span>
      </label>

      <button
        type="button"
        onClick={onStart}
        disabled={!consentChecked || checking}
        className={
          'w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all active:scale-[.98] ' +
          (consentChecked && !checking
            ? 'bg-blue-700 text-white hover:bg-blue-800'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed')
        }
      >
        {checking ? 'Checking…' : 'Start Filling Form'}
      </button>
    </>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <span className="text-3xl" aria-hidden>⚠️</span>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Local Mode Setup Failed</h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-2">{message}</p>
      <p className="text-xs text-gray-500 mb-5">
        Check your internet connection and try again. Once the setup is done, you can disconnect.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 active:scale-[.98] transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function StepItem({ status, label }: { status: LocalModeStatus; label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-gray-700">
      <span
        className={
          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' +
          (status === 'done'
            ? 'bg-green-100 text-green-700'
            : status === 'in-progress'
              ? 'bg-indigo-100 text-indigo-700 animate-spin'
              : 'bg-gray-100 text-gray-400')
        }
        aria-hidden
      >
        {status === 'done' ? '✓' : status === 'in-progress' ? '⟳' : '○'}
      </span>
      <span className={status === 'done' ? 'text-gray-700' : 'text-gray-600'}>{label}</span>
    </li>
  );
}

function ReadyItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-gray-700">
      <span
        className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold"
        aria-hidden
      >
        ✓
      </span>
      <span>{label}</span>
    </li>
  );
}

// ─── Persistent banner ────────────────────────────────────────────────────────

/**
 * Slim green banner shown at the very top of the page once Local Mode is
 * active. Exported so the parent page can render it persistently above its
 * own header / form content.
 */
export function LocalModeBanner() {
  return (
    <div
      className="sticky top-0 z-50 bg-gradient-to-r from-green-900 to-green-700 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold shadow-md"
      role="status"
    >
      <span
        className="w-2 h-2 rounded-full bg-green-300 inline-block"
        style={{ animation: 'qfphPulse 1.6s ease infinite' }}
        aria-hidden
      />
      <span>Running locally — 🔒 data never leaves this device</span>
      <style jsx>{`
        @keyframes qfphPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(134, 239, 172, 0.55); }
          50%      { box-shadow: 0 0 0 6px rgba(134, 239, 172, 0); }
        }
      `}</style>
    </div>
  );
}

// ─── utils ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
