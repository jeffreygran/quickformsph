import { NextRequest, NextResponse } from 'next/server';
import {
  getAISettingsForAdmin,
  updateAISettings,
  type AISettingsUpdate,
} from '@/lib/ai-settings';

export const runtime = 'nodejs';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET — admin only. Returns masked view (no plaintext key). */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(getAISettingsForAdmin());
}

/** POST — admin only. Updates fields. apiKey '' means no change. */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: AISettingsUpdate;
  try {
    body = (await req.json()) as AISettingsUpdate;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const updated = updateAISettings(body);
    return NextResponse.json({ ok: true, settings: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 },
    );
  }
}
