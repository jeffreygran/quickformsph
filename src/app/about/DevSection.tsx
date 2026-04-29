'use client';

import { useState, useEffect, useRef } from 'react';
import SuggestionModal from '@/components/SuggestionModal';

interface DevSectionProps {
  /** When true, triggers the cascade animation immediately (bypasses IntersectionObserver). */
  forceVisible?: boolean;
}

export default function DevSection({ forceVisible = false }: DevSectionProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [forceVisible]);

  return (
    <>
      <div ref={ref} className="flex flex-col items-center">

        {/* Card — compact, centered */}
        <div
          className={`mx-auto max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center
            transition-all duration-[1500ms] ease-out
            ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}
        >
          {/* Avatar — spins in */}
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-white shadow-sm select-none mb-3
              transition-all duration-[1200ms] ease-out delay-[800ms]
              ${visible ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'}`}
          >
            <span className="flex flex-col items-start leading-tight gap-0">
              <span className="text-[8px] font-normal text-slate-400">By</span>
              <span className="text-xs font-black text-white">J.Gran</span>
            </span>
          </div>

          {/* Name */}
          <h3
            className={`font-bold text-gray-900 text-sm tracking-tight
              transition-all duration-[800ms] ease-out delay-[1500ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Jeffrey John Gran
          </h3>

          {/* Title */}
          <p
            className={`text-xs font-semibold text-blue-700 mt-0.5 inline-flex items-center gap-1 justify-center
              transition-all duration-[800ms] ease-out delay-[2000ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Cloud Solutions Architect ·
            <svg viewBox="0 0 23 23" className="h-3 w-3 shrink-0" aria-label="Microsoft" role="img" xmlns="http://www.w3.org/2000/svg">
              <rect width="10" height="10" x="1"  y="1"  fill="#F25022"/>
              <rect width="10" height="10" x="12" y="1"  fill="#7FBA00"/>
              <rect width="10" height="10" x="1"  y="12" fill="#00A4EF"/>
              <rect width="10" height="10" x="12" y="12" fill="#FFB900"/>
            </svg>
          </p>

          {/* Quote */}
          <p
            className={`text-[11px] text-gray-400 mt-2 italic leading-snug
              transition-all duration-[800ms] ease-out delay-[2500ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            &ldquo;Empowering organizations to accelerate frontier transformation with cloud and AI.&rdquo;
          </p>

          {/* CTA */}
          <div
            className={`mt-4
              transition-all duration-[800ms] ease-out delay-[3000ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <button
              onClick={() => setShowSuggestion(true)}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              Share Feedback
            </button>
          </div>
        </div>

        {/* Version stamp */}
        <p className="mt-2 w-full max-w-sm text-right text-[10px] text-gray-300 select-none">
          QuickFormsPH v2.3.0
        </p>
      </div>

      {showSuggestion && <SuggestionModal onClose={() => setShowSuggestion(false)} />}
    </>
  );
}
