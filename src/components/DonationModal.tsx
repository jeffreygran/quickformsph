'use client';

import { useState, useEffect } from 'react';

const GCASH_NUMBER_DEFAULT = process.env.NEXT_PUBLIC_GCASH_NUMBER ?? '0917-551-4822';

export default function DonationModal({ onClose }: { onClose: () => void }) {
  const [gcashNumber, setGcashNumber] = useState(GCASH_NUMBER_DEFAULT);
  const [liveQrUrl, setLiveQrUrl]     = useState<string | null>(null);
  const [liveMayaQrUrl, setLiveMayaQrUrl] = useState<string | null>(null);
  const [gcashCopied, setGcashCopied] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [qrPicker, setQrPicker]       = useState(false); // false=GCash, true=Maya
  const [showQrPickerPopup, setShowQrPickerPopup] = useState(false);

  useEffect(() => {
    fetch('/api/admin/gcash-settings')
      .then(r => r.ok ? r.json() : null)
      .then((d: { gcash_number?: string; gcash_name?: string; qr_url?: string | null; maya_qr_url?: string | null } | null) => {
        if (!d) return;
        if (d.gcash_number) setGcashNumber(d.gcash_number);
        setLiveQrUrl(d.qr_url ?? null);
        setLiveMayaQrUrl(d.maya_qr_url ?? null);
      })
      .catch(() => {});
  }, []);

  function fallbackCopy(text: string) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch { /* ignore */ }
  }

  function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const text = gcashNumber.replace(/\D/g, '');
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      else fallbackCopy(text);
    } catch { fallbackCopy(text); }
    setGcashCopied(true);
  }

  function handleOpenGcash() { window.location.href = 'gcash://'; }
  function handleOpenMaya()  { window.open('https://www.maya.ph/', '_blank'); }

  const activeQrUrl = qrPicker ? liveMayaQrUrl : (liveQrUrl ?? liveMayaQrUrl);

  return (
    <>
      {/* QR fullscreen overlay */}
      {qrFullscreen && activeQrUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setQrFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
            onClick={() => setQrFullscreen(false)}
          >×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeQrUrl} alt="QR Code" className="max-w-xs w-full rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
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
          <div className="bg-[#16a34a] px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="text-white font-bold text-base tracking-wide">Support QuickFormsPH</div>
              <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            </div>
          </div>

          <div className="p-5 space-y-4">

            {/* Heartfelt note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                Made to help Filipinos fill out government forms more easily. Your ₱5 or any amount helps support maintenance and future updates. <strong>Maraming salamat po. 🙏</strong>
              </p>
            </div>

            {/* Transfer details */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transfer Details</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Mobile No.</span>
                <span className="text-sm font-black text-gray-900 font-mono tracking-wide">{gcashNumber}</span>
              </div>

              {/* QR option */}
              {(liveQrUrl || liveMayaQrUrl) && (
                <div className="mt-1 relative">
                  <button
                    onClick={() => {
                      if (liveQrUrl && liveMayaQrUrl) {
                        setShowQrPickerPopup(p => !p);
                      } else {
                        setQrPicker(!liveQrUrl);
                        setQrFullscreen(true);
                      }
                    }}
                    className="text-[11px] text-blue-600 font-semibold hover:underline"
                  >
                    Or pay via QR Code.
                  </button>
                  {/* Picker popup — both QRs available */}
                  {showQrPickerPopup && liveQrUrl && liveMayaQrUrl && (
                    <div className="absolute left-0 top-5 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[150px]">
                      <button
                        onClick={() => { setQrPicker(false); setQrFullscreen(true); setShowQrPickerPopup(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-semibold text-left text-gray-800 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: '#0062FF' }}>G</span>
                        GCash QR
                      </button>
                      <button
                        onClick={() => { setQrPicker(true); setQrFullscreen(true); setShowQrPickerPopup(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs font-semibold text-left text-gray-800 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: '#00C2A0' }}>M</span>
                        Maya QR
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {!gcashCopied ? (
                <button
                  onClick={handleCopy}
                  className="w-full rounded-lg bg-[#16a34a] py-3 text-sm font-semibold text-white hover:bg-[#15803d] transition-colors"
                >
                  Copy Mobile No.
                </button>
              ) : (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-xs text-green-800 leading-relaxed space-y-2">
                  <p className="font-semibold">Mobile no. copied!</p>
                  <p>Click an app below to send via <strong>Send Money</strong> and paste the number.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenGcash}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: '#0062FF' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="white"/>
                        <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0062FF" fontFamily="Arial">G</text>
                      </svg>
                      GCash
                    </button>
                    <button
                      onClick={handleOpenMaya}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: '#00C2A0' }}
                    >
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="16" fill="white"/>
                        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#00C2A0" fontFamily="Arial">M</text>
                      </svg>
                      Maya
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full rounded-lg py-2.5 text-xs text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Maybe later
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
