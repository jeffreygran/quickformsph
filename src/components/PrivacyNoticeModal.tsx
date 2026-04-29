'use client';

/**
 * PrivacyNoticeModal
 *
 * Republic Act No. 10173 (Data Privacy Act of 2012) acknowledgement.
 * Shown ONCE per browser, gated by the `qfph_privacy_ack` localStorage flag.
 * Currently rendered as a precursor to the PaymentGate "How would you like to
 * access?" choice screen on every form page.
 */

import Link from 'next/link';

export const PRIVACY_ACK_LS_KEY = 'qfph_privacy_ack';

export function hasPrivacyAck(): boolean {
  if (typeof window === 'undefined') return true; // assume yes during SSR
  try {
    return Boolean(localStorage.getItem(PRIVACY_ACK_LS_KEY));
  } catch {
    return true;
  }
}

export function setPrivacyAck(): void {
  try {
    localStorage.setItem(PRIVACY_ACK_LS_KEY, '1');
  } catch {
    /* ignore */
  }
}

export default function PrivacyNoticeModal({ onAck }: { onAck: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <div className="text-white font-bold text-sm">Privacy Notice</div>
              <div className="text-blue-200 text-[11px]">Republic Act No. 10173 — Data Privacy Act of 2012</div>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            Your details are used only to fill the form and generate your PDF, all processed offline so you can safely disconnect from the internet.
          </p>
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            Read full Privacy Policy ↗
          </Link>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onAck}
            className="w-full rounded-xl bg-blue-700 py-3 text-sm text-white font-semibold hover:bg-blue-800"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
}
