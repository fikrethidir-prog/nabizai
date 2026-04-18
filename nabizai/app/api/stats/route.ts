import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const cids = session.rol === 'admin' ? undefined : session.musteri_ids;
    const stats = await getStats(cids);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[/api/stats]', err);
    return NextResponse.json({ error: 'DB hatası', detail: String(err) }, { status: 500 });
  }
}
