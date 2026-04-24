'use client';

import { useState, useEffect } from 'react';

const GCASH_NUMBER_DEFAULT = process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-551-4822';
const GCASH_NAME_DEFAULT   = process.env.NEXT_PUBLIC_GCASH_NAME   ?? 'JE****Y JO*N G.';

export default function DonationModal({ onClose }: { onClose: () => void }) {
  const [gcashNumber, setGcashNumber] = useState(GCASH_NUMBER_DEFAULT);
  const [gcashName, setGcashName]     = useState(GCASH_NAME_DEFAULT);
  const [qrUrl, setQrUrl]             = useState<string | null>(null);
  const [gcashCopied, setGcashCopied] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: { gcash_number?: string; gcash_name?: string; qr_url?: string | null } | null) => {
        if (!d) return;
        if (d.gcash_number) setGcashNumber(d.gcash_number);
        if (d.gcash_name)   setGcashName(d.gcash_name);
        setQrUrl(d.qr_url ?? null);
      })
      .catch(() => {});
  }, []);

  function fallbackCopy(text: string) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch { /* silently skip */ }
  }

  function handleOpenGcash(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const text = gcashNumber.replace(/\D/g, '');
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    } catch { fallbackCopy(text); }
    setGcashCopied(true);
  }

  function handleUnderstood() {
    window.location.href = 'gcash://';
    setGcashCopied(false);
  }

  return (
    <>
      {/* QR fullscreen overlay */}
      {qrFullscreen && qrUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setQrFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            onClick={() => setQrFullscreen(false)}
          >×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="GCash QR Code"
            className="max-w-xs w-full rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/70 text-xs">Tap anywhere to close</p>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b7c3e] to-[#00a651] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💚</span>
                <div>
                  <div className="text-white font-bold text-sm">Support QuickFormsPH</div>
                  <div className="text-green-200 text-[11px]">Donate any amount via GCash</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-green-200 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >×</button>
            </div>
          </div>

          <div className="p-5 space-y-4">

            {/* Heartfelt note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                Built with a lot of time and effort to make it easier for Filipinos to fill out government forms. Any amount you can spare helps cover hosting costs and supports future improvements. Maraming salamat po! 🙏
              </p>
            </div>

            {/* GCash details */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">GCash Payment Details</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Number</span>
                <span className="text-sm font-black text-gray-900 font-mono tracking-wide">{gcashNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Account Name</span>
                <span className="text-sm font-semibold text-gray-900">{gcashName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Amount</span>
                <span className="text-sm font-semibold text-green-700">Any amount 💛</span>
              </div>
              {qrUrl && (
                <button
                  onClick={() => setQrFullscreen(true)}
                  className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  📷 Or pay via QR Code — tap to view full screen
                </button>
              )}
            </div>

            {/* Flip card: Open GCash */}
            <div style={{ perspective: '600px' }}>
              <div
                style={{
                  transition: 'transform 0.5s',
                  transformStyle: 'preserve-3d',
                  transform: gcashCopied ? 'rotateX(180deg)' : 'rotateX(0deg)',
                  position: 'relative',
                  minHeight: '48px',
                }}
              >
                {/* Front */}
                <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  <button
                    onClick={handleOpenGcash}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a651] py-3 text-sm font-bold text-white hover:bg-[#008c44] transition-colors"
                  >
                    📱 Open GCash
                  </button>
                </div>
                {/* Back */}
                <div
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                    position: 'absolute',
                    inset: 0,
                  }}
                >
                  <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 leading-relaxed">
                    <p className="font-semibold mb-0.5">📋 Number copied!</p>
                    <p>The number <span className="font-mono font-bold">{gcashNumber}</span> has been copied. Tap <strong>Understood</strong> to open GCash, go to <strong>Send Money</strong>, and paste the number.</p>
                    <button
                      onClick={handleUnderstood}
                      className="mt-2 w-full rounded-lg bg-green-600 text-white text-xs font-bold py-1.5 hover:bg-green-700 transition-colors"
                    >
                      ✅ Understood — Open GCash
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-xs text-gray-400 hover:bg-gray-50"
            >
              Maybe later
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
