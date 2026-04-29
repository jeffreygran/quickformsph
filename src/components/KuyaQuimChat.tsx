'use client';

/**
 * Kuya Quim — QuickFormsPH AI chat assistant.
 *
 * Mounted only on /forms (FormsListClient). Floating FAB → modal popup with
 * SSE streaming, suggestion chips, plain-text rendering. Reads the user's
 * v2.0 access token from localStorage and sends it with every request so the
 * backend can gate AI access to donors only. When the user has not donated,
 * the chat UI still pops up but the backend replies with a "please donate"
 * nudge that includes a CTA to open the existing DonationModal.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { readAccessToken } from '@/lib/access-token-client';
import { trackEvent } from '@/lib/analytics-client';
import DonationModal from '@/components/DonationModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type LinkAction =
  | { kind: 'search'; query: string }
  | { kind: 'upvote'; slug: string }
  | { kind: 'plain'; href: string };

function parseLinkHref(href: string): LinkAction {
  if (href.startsWith('#qfph-search:')) {
    return { kind: 'search', query: href.slice('#qfph-search:'.length).trim() };
  }
  if (href.startsWith('#qfph-upvote:')) {
    return { kind: 'upvote', slug: href.slice('#qfph-upvote:'.length).trim() };
  }
  return { kind: 'plain', href };
}

/**
 * Renders a plain-text assistant message with a tiny markdown-link subset:
 *   [label](url)
 * Internal links (starting with '/' or '#') open in the same tab; external
 * links open in a new tab. Custom schemes (#qfph-search:, #qfph-upvote:) are
 * rendered as buttons that the parent component handles via callbacks.
 * `whitespace-pre-wrap` on the parent container preserves newlines.
 */
function renderAssistantText(
  text: string,
  onSearch: (q: string) => void,
  onUpvote: (slug: string) => void,
) {
  // Defensive de-dup for the upvote nudge: if the model emitted multiple
  // upvote links, keep only the first so we never render "[X] o [X]".
  const seenUpvote = { v: false };
  text = text.replace(/(💡[^\n]*?\[[^\]]+\]\([^)]+\))(?:\s*(?:o|or|at|and)?\s*\[[^\]]+\]\([^)]+\))*/g, (full) => {
    if (seenUpvote.v) return '';
    seenUpvote.v = true;
    return full.replace(/(\[[^\]]+\]\([^)]+\))(?:\s*(?:o|or|at|and)?\s*\[[^\]]+\]\([^)]+\))+/g, '$1');
  });
  // Strip any leftover stray "👉 [..](..)" action links the model may still emit.
  text = text.replace(/\s*👉\s*\[[^\]]+\]\([^)]+\)\s*(?:o|or|at|and)?\s*/g, ' ');

  const parts: Array<string | { label: string; href: string }> = [];
  // NOTE: allow spaces inside the URL portion (form codes contain spaces).
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push({ label: m[1], href: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.map((p, i) => {
    if (typeof p === 'string') return <span key={i}>{p}</span>;
    const action = parseLinkHref(p.href);
    const cls =
      'font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 hover:decoration-blue-500 cursor-pointer';
    if (action.kind === 'search') {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onSearch(action.query)}
          className={cls + ' bg-transparent p-0 border-0 text-left'}
        >
          {p.label}
        </button>
      );
    }
    if (action.kind === 'upvote') {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onUpvote(action.slug)}
          className="my-0.5 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[12px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.97]"
          title="Click to upvote this form"
        >
          <span aria-hidden>👍</span>
          <span>{p.label}</span>
        </button>
      );
    }
    const isInternal = action.href.startsWith('/') || action.href.startsWith('#');
    return (
      <a
        key={i}
        href={action.href}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        className={cls}
      >
        {p.label}
      </a>
    );
  });
}

const WELCOME =
  'Kumusta! Ako si Kuya Quim, ang AI assistant mo dito sa QuickFormsPH. Tutulungan kitang hanapin at intindihin ang Philippine government forms na kailangan mo.';

const CHIPS = [
  'Anong form ang kailangan ko para mag-apply ng TIN? 🆔',
  'Paano ko ma-claim ang aking Pag-IBIG MP2 dividends? 💰',
  'Anong PhilHealth form ang papipirmahan ng doktor para ma-claim ang professional fee niya? 🏥',
];

const KUYA_FALLBACK = '/kuya-kim-icon.svg';
function KuyaIcon({ className = 'h-5 w-5', alt = '' }: { className?: string; alt?: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/kuya-kim-icon.png"
      alt={alt}
      className={`${className} rounded-full object-cover bg-white`}
      onError={(e) => {
        const t = e.currentTarget;
        if (t.dataset.fallback !== '1') {
          t.dataset.fallback = '1';
          t.src = KUYA_FALLBACK;
        }
      }}
    />
  );
}

export default function KuyaQuimChat({ hideLauncher = false }: { hideLauncher?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [needsDonation, setNeedsDonation] = useState(false);
  const [donateClicked, setDonateClicked] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const upvotedSlugsRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showToast = useCallback((kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    // Tell FormsListClient to populate its search bar.
    window.dispatchEvent(new CustomEvent('kuya-quim:search', { detail: { query: q } }));
    // Update URL so reloads keep the filter.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('q', q);
      window.history.replaceState(null, '', url.toString());
    } catch { /* ignore */ }
    setOpen(false);
  }, []);

  const handleUpvote = useCallback(async (slug: string) => {
    if (!slug) return;
    if (upvotedSlugsRef.current.has(slug)) {
      showToast('ok', 'You’ve already upvoted this form. Salamat! 🙏');
      return;
    }
    try {
      const res = await fetch(`/api/forms/${encodeURIComponent(slug)}/upvote`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      upvotedSlugsRef.current.add(slug);
      const total = typeof data.upVote === 'number' ? ` (Total: ${data.upVote})` : '';
      showToast('ok', `✅ Successfully upvoted!${total}`);
    } catch (e) {
      showToast('err', `Upvote failed: ${(e as Error).message}`);
    }
  }, [showToast]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Allow other parts of the app to open the chat by dispatching
  // `window.dispatchEvent(new Event('kuya-quim:open'))`.
  useEffect(() => {
    const handler = () => { setDismissed(false); setOpen(true); setHasOpened(true); };
    window.addEventListener('kuya-quim:open', handler);
    return () => window.removeEventListener('kuya-quim:open', handler);
  }, []);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    // Telemetry: count every user-submitted chat question (admin dashboard).
    trackEvent('chat_question');

    const next: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setNeedsDonation(false);
    // NOTE: do NOT reset `donateClicked` here. Once the user has tapped
    // "Donate ₱5 to activate", we want the morphed "Done / Attached transfer
    // screenshot" state to persist until they actually complete the donation
    // (which writes the shared access token in localStorage — same 24-hour
    // gate used by the Form Editor). After the token exists, the backend
    // stops returning the donation gate, so this block won't render anyway.

    const apiMessages = next.map((m) => ({ role: m.role, content: m.content }));
    const tok = readAccessToken();

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          accessToken: tok?.token ?? null,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      // Surface the donation gate so we can render an inline "Donate now" CTA.
      if (res.headers.get('X-Kuya-Quim-Gate') === 'donation_required') {
        setNeedsDonation(true);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              assistantContent += delta;
              const content = assistantContent;
              setMessages((prev) => {
                const u = [...prev];
                u[u.length - 1] = { role: 'assistant', content };
                return u;
              });
            }
          } catch {
            /* skip malformed chunk */
          }
        }
      }
    } catch (err) {
      const e = err as { name?: string };
      if (e?.name === 'AbortError') return;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Pasensya na, may technical difficulty ngayon. Subukan mo ulit mamaya. 🙏',
        },
      ]);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* FAB — first-time, with label */}
      {!hideLauncher && !open && !hasOpened && !dismissed && (
        <button
          onClick={() => {
            setOpen(true);
            setHasOpened(true);
          }}
          className="fixed right-5 z-50 flex items-center gap-2 rounded-full bg-blue-600 pl-5 pr-3 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
          style={{
            bottom: 'max(20px, env(safe-area-inset-bottom))',
            boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          }}
        >
          <KuyaIcon className="h-7 w-7 ring-2 ring-white/40" alt="Kuya Kim" />
          Need help?
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDismissed(true);
            }}
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white text-xs hover:bg-white/40"
            role="button"
            aria-label="Dismiss"
          >
            ×
          </span>
        </button>
      )}

      {/* Mini FAB after first open */}
      {!hideLauncher && !open && hasOpened && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl overflow-hidden ring-2 ring-white/40"
          style={{
            bottom: 'max(20px, env(safe-area-inset-bottom))',
            boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
          }}
          aria-label="Open Kuya Quim"
        >
          <KuyaIcon className="h-12 w-12" alt="Kuya Kim" />
        </button>
      )}

      {/* Popup */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative flex w-full sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl"
            style={{ height: 'min(560px, 88vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center gap-3 px-4 py-3 text-white"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 overflow-hidden">
                <KuyaIcon className="h-10 w-10" alt="Kuya Kim" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">Kuya Quim</div>
                <div className="flex items-center gap-1 text-[11px] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  AI Assistant · QuickFormsPH
                </div>
              </div>
              <button
                onClick={() => {
                  if (streaming) abortRef.current?.abort();
                  setMessages([]);
                  setInput('');
                  setStreaming(false);
                  setNeedsDonation(false);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="flex h-8 items-center gap-1 rounded-full bg-white/15 px-2.5 text-[11px] font-semibold text-white hover:bg-white/25"
                aria-label="New chat"
                title="New chat"
              >
                <span aria-hidden>↻</span>
                <span>New</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-4 py-4">
              <div className="max-w-[85%] self-start rounded-xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-800 shadow-sm">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <KuyaIcon className="h-4 w-4" /> Kuya Quim
                </div>
                {WELCOME}
                {messages.length === 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {CHIPS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-left text-[12px] font-medium text-blue-700 transition hover:bg-blue-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'self-end rounded-br-sm bg-blue-600 text-white'
                      : 'self-start rounded-bl-sm border border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                      <KuyaIcon className="h-4 w-4" /> Kuya Quim
                    </div>
                  )}
                  {m.content ? (
                    m.role === 'assistant'
                      ? renderAssistantText(m.content, handleSearch, handleUpvote)
                      : m.content
                  ) : (
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  )}
                  {m.role === 'assistant' && needsDonation && i === messages.length - 1 && (
                    <div className="mt-2.5">
                      {!donateClicked ? (
                        <button
                          onClick={() => { setShowDonate(true); setDonateClicked(true); }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-[12px] font-bold text-white shadow hover:bg-green-700"
                        >
                          💚 Donate ₱5 to activate
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDonate(true)}
                          className="relative overflow-hidden flex flex-col items-center justify-center w-full rounded-lg border border-emerald-300 bg-gradient-to-b from-white to-emerald-50 hover:from-emerald-50 hover:to-emerald-100 active:translate-y-[2px] active:shadow-inner shadow-[0_3px_0_0_rgba(16,185,129,0.35),0_4px_10px_-2px_rgba(16,185,129,0.25)] py-2.5 cursor-pointer transition-all duration-150"
                          title="Re-open donation to attach your transfer screenshot"
                        >
                          <span className="text-sm font-semibold text-emerald-700 leading-tight">Done</span>
                          <span className="text-[10px] text-emerald-500/80 leading-tight mt-0.5">Attached transfer screenshot</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white p-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Magtanong tungkol sa forms..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                disabled={streaming}
                maxLength={4000}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                aria-label="Send"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

      {toast && (
        <div
          className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 transform animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <div
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-2xl ring-1 ${
              toast.kind === 'ok'
                ? 'bg-green-600 text-white ring-green-700/30'
                : 'bg-red-600 text-white ring-red-700/30'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs hover:bg-white/30"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
