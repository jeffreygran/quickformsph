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

import React, { useEffect, useState, useCallback } from 'react';
import {
  ensureServiceWorker,
  precacheFormTemplate,
  markLocalModeReady,
  setPrivacyAck,
  INITIAL_PROGRESS,
  type LocalModeProgress,
  type LocalModeStatus,
} from '@/lib/local-mode';

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
  const [consentChecked, setConsentChecked] = useState(false);
  const [verifyOffline, setVerifyOffline] = useState(true);
  const [onlineError, setOnlineError] = useState(false);

  // Run the download/cache pipeline on mount.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Engine: pdf-lib is bundled in our app shell — register SW + warm it up.
        setProgress((p) => ({ ...p, engine: 'in-progress' }));
        await ensureServiceWorker();
        // Touch pdf-lib so its chunk is loaded into cache for offline use.
        await import('pdf-lib');
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
      // Try to reach a reliable external URL. If it succeeds, device is online → block.
      try {
        await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        });
        // fetch succeeded → device is online
        setOnlineError(true);
        return;
      } catch {
        // fetch failed → device is offline, safe to proceed
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
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-6 py-7 sm:px-8 sm:py-9">
            {error ? (
              <ErrorState message={error} onRetry={handleRetry} />
            ) : phase === 'downloading' ? (
              <DownloadingState
                formName={formName}
                formCode={formCode}
                progress={progress}
                percent={percent}
              />
            ) : (
              <ReadyState
                formName={formName}
                formCode={formCode}
                consentChecked={consentChecked}
                onConsentChange={setConsentChecked}
                verifyOffline={verifyOffline}
                onVerifyOfflineChange={setVerifyOffline}
                onlineError={onlineError}
                onStart={handleStart}
              />
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
  onStart,
}: {
  formName: string;
  formCode: string;
  consentChecked: boolean;
  onConsentChange: (v: boolean) => void;
  verifyOffline: boolean;
  onVerifyOfflineChange: (v: boolean) => void;
  onlineError: boolean;
  onStart: () => void;
}) {
  return (
    <>
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <span className="text-3xl" aria-hidden>🛡️</span>
        </div>
        <h2 id="local-mode-title" className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          Ready to Go Offline
        </h2>
      </div>

      <ul className="space-y-2 mb-5">
        <ReadyItem label="PDF engine ready" />
        <ReadyItem label="Form template cached" />
      </ul>

      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-green-800 leading-relaxed">
          🔒 <strong>Privacy first:</strong> Your data stays on this device and is never uploaded.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-3 select-none">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
          checked={verifyOffline}
          onChange={(e) => onVerifyOfflineChange(e.target.checked)}
        />
        <span className="text-xs text-gray-700 leading-relaxed">
          Verify my internet connection and stop if online.
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer mb-5 select-none">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
          checked={consentChecked}
          onChange={(e) => onConsentChange(e.target.checked)}
        />
        <span className="text-xs text-gray-700 leading-relaxed">
          I understand my data stays on this device and consent to filling this form locally.
        </span>
      </label>
      {onlineError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-xs text-red-700 leading-relaxed">
            <strong>You appear to be online.</strong> Please disconnect from the internet before filling this form in offline mode.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={!consentChecked}
        className={
          'w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all active:scale-[.98] ' +
          (consentChecked
            ? 'bg-blue-700 text-white hover:bg-blue-800'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed')
        }
      >
        🔒 Start Filling Form
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
      <span>🔒 Running Locally — your data stays on your device. Safe to go offline.</span>
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
