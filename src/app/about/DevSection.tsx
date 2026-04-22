'use client';

import { useState } from 'react';
import SuggestionModal from '@/components/SuggestionModal';

export default function DevSection() {
  const [showProfile, setShowProfile]       = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <section className="text-center">
      {/* Badge with clickable J.Gran */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-600 font-semibold mb-4">
        👨‍💻 Developed by:{' '}
        <button
          onClick={() => setShowProfile((v) => !v)}
          className="text-blue-600 hover:text-blue-800 underline font-semibold focus:outline-none"
        >
          J.Gran
        </button>
      </div>

      {/* Animated profile section — hidden by default */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showProfile ? 'max-h-48 opacity-100 mt-0' : 'max-h-0 opacity-0'
        }`}
      >
        <h2 className="text-xl font-black text-gray-900">Jeffrey John Gran</h2>
        <p className="text-sm text-blue-700 font-semibold mt-0.5">Cloud Solutions Architect · Microsoft</p>
        <p className="text-xs text-gray-500 mt-2 italic">
          &ldquo;Empowering organizations to accelerate frontier transformation with cloud and AI.&rdquo;
        </p>

        {/* Divider + Suggestion link inside the revealed block */}
        <div className="mt-5 border-t border-gray-200 pt-4 pb-2">
          <button
            onClick={() => setShowSuggestion(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            💡 Suggest a form &amp; Feedback
          </button>
        </div>
      </div>

      {showSuggestion && <SuggestionModal onClose={() => setShowSuggestion(false)} />}
    </section>
  );
}
