import { NextRequest, NextResponse } from 'next/server';
import { getCrisisItems } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const cids = session.rol === 'admin' ? undefined : session.musteri_ids;
    const alerts = await getCrisisItems(cids);
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('[/api/kriz]', err);
    return NextResponse.json({ error: 'DB hatası', detail: String(err) }, { status: 500 });
  }
}
