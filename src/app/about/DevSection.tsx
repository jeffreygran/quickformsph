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

        {/* Heading — slide + fade */}
        <h2
          className={`text-2xl font-black text-gray-900 mb-8 transition-all duration-[1500ms] ease-out
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          Built by a Filipino
        </h2>

        {/* Card — scale up + fade in with a slight bounce */}
        <div
          className={`mx-auto max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center
            transition-all duration-[1500ms] ease-out delay-[800ms]
            ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}
        >
          {/* Avatar — spins in */}
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-white font-black text-base mb-5 shadow-sm select-none tracking-tight
              transition-all duration-[1200ms] ease-out delay-[1500ms]
              ${visible ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'}`}
          >
            <span className="flex flex-col items-start leading-tight gap-0">
              <span className="text-[9px] font-normal text-slate-400">By</span>
              <span className="text-sm font-black text-white">J.Gran</span>
            </span>
          </div>

          {/* Name — slides up */}
          <h3
            className={`text-lg font-black text-gray-900 tracking-tight
              transition-all duration-[800ms] ease-out delay-[2500ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Jeffrey John Gran
          </h3>

          {/* Title */}
          <p
            className={`text-sm font-semibold text-blue-700 mt-1
              transition-all duration-[800ms] ease-out delay-[3000ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Cloud Solutions Architect · Microsoft
          </p>

          {/* Quote */}
          <p
            className={`text-xs text-gray-500 mt-4 italic leading-relaxed max-w-xs mx-auto
              transition-all duration-[800ms] ease-out delay-[3500ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            &ldquo;Empowering organizations to accelerate frontier transformation with cloud and AI.&rdquo;
          </p>

          {/* CTA */}
          <div
            className={`mt-7 pt-6 border-t border-gray-100
              transition-all duration-[800ms] ease-out delay-[4200ms]
              ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <button
              onClick={() => setShowSuggestion(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Suggest a Form · Share Feedback
            </button>
          </div>
        </div>
      </div>

      {showSuggestion && <SuggestionModal onClose={() => setShowSuggestion(false)} />}
    </>
  );
}
