import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

function readTokens(): Record<string, unknown>[] {
  if (isSupabaseMode()) return [];
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'fcm_tokens.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return []; }
}

function writeTokens(data: Record<string, unknown>[]) {
  if (isSupabaseMode()) return;
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), '..', 'data', 'fcm_tokens.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// POST /api/push — FCM token kayıt (authenticated user)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { musteri_id, fcm_token, platform } = await req.json();
  if (!musteri_id || !fcm_token) {
    return NextResponse.json({ error: 'musteri_id ve fcm_token zorunlu' }, { status: 400 });
  }
  const liste = readTokens();
  const idx = liste.findIndex((t: Record<string, unknown>) => t.musteri_id === musteri_id && t.platform === platform);
  const kayit = { musteri_id, fcm_token, platform: platform ?? 'unknown', guncelleme: new Date().toISOString() };
  if (idx >= 0) liste[idx] = kayit; else liste.push(kayit);
  writeTokens(liste);
  return NextResponse.json({ ok: true });
}

// GET /api/push — token listesi (admin only)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  return NextResponse.json(readTokens());
}
