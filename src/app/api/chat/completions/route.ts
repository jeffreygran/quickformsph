/**
 * POST /api/chat/completions — Kuya Quim AI chat
 *
 * Pipeline:
 *   1. Same-origin / Origin check (CSRF guard)
 *   2. Per-IP rate limiting (30/min, 200/hr)
 *   3. Donation gate: requires a valid access token (₱5 donor) — otherwise
 *      we synthesize a "please donate" response and DO NOT call the LLM.
 *   4. Validate messages (roles, length, count)
 *   5. Strip client-supplied system messages, prepend our system prompt
 *      (persona + scope rules + live forms catalog).
 *   6. Stream Azure OpenAI chat completions back to the client as SSE.
 */

import { NextRequest } from 'next/server';
import { getAISettings } from '@/lib/ai-settings';
import { checkRateLimit } from '@/lib/ai-rate-limit';
import { verifyAccessToken } from '@/lib/access-token';
import { buildKuyaQuimPrompt } from '@/lib/kuya-quim-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MAX_CONTENT = 4000;
const MAX_MESSAGES = 20;

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches in some browsers omit Origin
  const host = req.headers.get('host');
  if (!host) return false;
  try {
    const u = new URL(origin);
    return u.host === host;
  } catch {
    return false;
  }
}

function sseChunk(content: string): string {
  const data = JSON.stringify({ choices: [{ delta: { content } }] });
  return `data: ${data}\n\n`;
}

function sseDone(): string {
  return `data: [DONE]\n\n`;
}

function streamFromString(text: string): ReadableStream<Uint8Array> {
  // Stream a static string in small chunks to mimic the LLM SSE format.
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(sseChunk(text)));
      controller.enqueue(enc.encode(sseDone()));
      controller.close();
    },
  });
}

const DONATION_NUDGE =
  'Pasensya na, kailangan munang ma-activate si Kuya Quim. ' +
  'Mag-donate ng kahit ₱5 sa pamamagitan ng 💚 Donate button sa itaas ng Forms page para mabuksan ang AI assistant. ' +
  'Salamat sa suporta — tutulungan kita matapos mong mag-donate! 🙏';

export async function POST(req: NextRequest) {
  // 1. CSRF / same-origin guard
  if (!sameOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Cross-origin request denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Rate limit
  const ip = clientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfterSec: rl.retryAfterSec }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSec ?? 60),
        },
      },
    );
  }

  // Parse body
  let body: { messages?: ChatMessage[]; accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, accessToken } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (messages.length > MAX_MESSAGES) {
    return new Response(JSON.stringify({ error: 'Too many messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== 'string' || typeof m.role !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message shape' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!['user', 'assistant', 'system'].includes(m.role)) {
      return new Response(JSON.stringify({ error: 'Invalid message role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (m.content.length > MAX_CONTENT) {
      return new Response(
        JSON.stringify({ error: `Message too long (max ${MAX_CONTENT} chars)` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // 3. Donation gate — synthesize a donation-nudge SSE if the user has no
  //    valid access token. Note: this is intentionally NOT a 4xx so the chat
  //    UI still pops up and renders an in-conversation reply.
  const tokenPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  if (!tokenPayload) {
    return new Response(streamFromString(DONATION_NUDGE), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Kuya-Quim-Gate': 'donation_required',
      },
    });
  }

  // 4. AI settings + kill switch
  const cfg = getAISettings();
  if (!cfg.enabled) {
    return new Response(
      streamFromString(
        'Pasensya na, temporarily offline si Kuya Quim. Subukan ulit mamaya. 🙏',
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Kuya-Quim-Gate': 'disabled',
        },
      },
    );
  }
  if (!cfg.endpoint || !cfg.apiKey) {
    return new Response(
      JSON.stringify({ error: 'AI provider not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 5. Build messages: prepend system prompt, drop any client system msgs.
  const systemPrompt = buildKuyaQuimPrompt();
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.filter((m) => m.role !== 'system'),
  ];

  // 6. Call provider with streaming
  const upstreamHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.provider === 'azure_openai') {
    upstreamHeaders['api-key'] = cfg.apiKey;
  } else {
    upstreamHeaders['Authorization'] = `Bearer ${cfg.apiKey}`;
  }

  const payload: Record<string, unknown> = {
    messages: fullMessages,
    max_tokens: cfg.maxTokens,
    temperature: cfg.temperature,
    stream: true,
  };
  if (cfg.provider === 'openai' && cfg.model) payload.model = cfg.model;

  let upstream: Response;
  try {
    upstream = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[kuya-quim] upstream fetch failed:', err);
    return new Response(
      streamFromString(
        'Pasensya na, may technical difficulty ngayon. Subukan mo ulit mamaya. 🙏',
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.error('[kuya-quim] upstream error', upstream.status, errText.slice(0, 300));
    return new Response(
      streamFromString(
        'Pasensya na, hindi ako nakakapagsalita ngayon. Subukan mo ulit mamaya. 🙏',
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      },
    );
  }

  // Pass-through SSE stream from upstream (Azure already emits OpenAI-style
  // `data: {...}` chunks ending with `data: [DONE]`).
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
