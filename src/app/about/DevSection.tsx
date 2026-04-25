'use client';

import { useState } from 'react';
import SuggestionModal from '@/components/SuggestionModal';

export default function DevSection() {
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <>
      <div className="text-center mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2">Developer</p>
        <h2 className="text-2xl font-black text-gray-900">Built by a Filipino</h2>
      </div>

      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        {/* Avatar */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-white font-black text-base mb-5 shadow-sm select-none tracking-tight">
          J.Gran
        </div>

        <h3 className="text-lg font-black text-gray-900 tracking-tight">Jeffrey John Gran</h3>
        <p className="text-sm font-semibold text-blue-700 mt-1">Cloud Solutions Architect · Microsoft</p>

        <p className="text-xs text-gray-500 mt-4 italic leading-relaxed max-w-xs mx-auto">
          &ldquo;Empowering organizations to accelerate frontier transformation with cloud and AI.&rdquo;
        </p>

        <div className="mt-7 pt-6 border-t border-gray-100">
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

      {showSuggestion && <SuggestionModal onClose={() => setShowSuggestion(false)} />}
    </>
  );
}
