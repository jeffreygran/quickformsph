'use client';

import { useState } from 'react';

export default function SuggestionModal({ onClose }: { onClose: () => void }) {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestion.trim()) { setError('Please enter a suggestion.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, suggestion }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-700 px-5 py-4 flex items-center justify-between">
          <div className="text-white font-bold text-sm">Share Your Feedback</div>
          <button onClick={onClose} className="text-blue-200 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-4xl">🙏</div>
            <p className="text-sm font-semibold text-gray-900">Salamat! Your message has been received.</p>
            <p className="text-xs text-gray-500">We&apos;ll review it and add it to our roadmap.<br />If you shared kind words, it may be featured as a review — thank you for the support!</p>
            <button
              onClick={() => { setSubmitted(false); setSuggestion(''); setName(''); setEmail(''); }}
              className="text-xs text-blue-600 underline"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Name <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="field-label">Email <span className="font-normal text-gray-400">(optional)</span></label>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
              </div>
            </div>
            <div>
              <label className="field-label">Message <span className="text-red-500">*</span></label>
              <textarea
                className="input-field min-h-[90px] resize-none"
                rows={3}
                value={suggestion}
                onChange={(e) => { setSuggestion(e.target.value); setError(''); }}
                maxLength={2000}
                required
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</> : 'Share'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
