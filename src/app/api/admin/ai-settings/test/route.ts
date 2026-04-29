/**
 * POST /api/admin/ai-settings/test — admin-only smoke test for the Kuya Quim
 * LLM configuration. Bypasses the donation gate (since admins use this to
 * verify the endpoint/key BEFORE any donor traffic hits it). Sends a single
 * user message and returns the assistant's reply as JSON (non-streaming).
 *
 * Body: { message?: string }   default: a fixed in-scope test prompt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAISettings } from '@/lib/ai-settings';
import { buildKuyaQuimPrompt } from '@/lib/kuya-quim-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

const DEFAULT_TEST = 'Anong form ang kailangan ko para mag-apply ng TIN?';

interface AzureChoice {
  message?: { role?: string; content?: string };
  finish_reason?: string;
}
interface AzureResponse {
  choices?: AzureChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { code?: string; message?: string };
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    message?: string;
    overrides?: {
      provider?: 'azure_openai' | 'openai';
      endpoint?: string;
      apiKey?: string;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    };
  } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  const message = (body.message ?? DEFAULT_TEST).trim().slice(0, 1000) || DEFAULT_TEST;

  // Merge persisted settings with any caller-provided overrides so the admin
  // can test edits BEFORE saving them.
  const saved = getAISettings();
  const o = body.overrides ?? {};
  const cfg = {
    enabled: saved.enabled,
    provider: o.provider ?? saved.provider,
    endpoint: (o.endpoint && o.endpoint.trim()) || saved.endpoint,
    apiKey: (o.apiKey && o.apiKey.trim()) || saved.apiKey,
    model: o.model ?? saved.model,
    maxTokens: typeof o.maxTokens === 'number' ? o.maxTokens : saved.maxTokens,
    temperature: typeof o.temperature === 'number' ? o.temperature : saved.temperature,
  };

  if (!cfg.enabled) {
    return NextResponse.json({ ok: false, error: 'AI assistant is disabled' }, { status: 400 });
  }
  if (!cfg.endpoint || !cfg.apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Endpoint or API key not configured' },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.provider === 'azure_openai') {
    headers['api-key'] = cfg.apiKey;
  } else {
    headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  }

  const payload: Record<string, unknown> = {
    messages: [
      { role: 'system', content: buildKuyaQuimPrompt() },
      { role: 'user', content: message },
    ],
    max_tokens: cfg.maxTokens,
    temperature: cfg.temperature,
    stream: false,
  };
  if (cfg.provider === 'openai' && cfg.model) payload.model = cfg.model;

  const startedAt = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(cfg.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Network error reaching upstream',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const latencyMs = Date.now() - startedAt;
  const text = await upstream.text();
  let json: AzureResponse | null = null;
  try {
    json = JSON.parse(text) as AzureResponse;
  } catch {
    /* non-JSON response */
  }

  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: upstream.status,
        latencyMs,
        error: json?.error?.message ?? text.slice(0, 500),
        code: json?.error?.code ?? null,
      },
      { status: 200 },
    );
  }

  const reply = json?.choices?.[0]?.message?.content ?? '';
  return NextResponse.json({
    ok: true,
    status: upstream.status,
    latencyMs,
    reply,
    usage: json?.usage ?? null,
    finishReason: json?.choices?.[0]?.finish_reason ?? null,
    sentMessage: message,
  });
}
