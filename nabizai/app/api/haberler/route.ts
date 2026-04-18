import { NextRequest, NextResponse } from 'next/server';
import { getNews } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';


export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search     = searchParams.get('search')     || undefined;
    const risk_level = searchParams.get('risk_level') || undefined;
    const source     = searchParams.get('source')     || undefined;
    const limit      = parseInt(searchParams.get('limit')  || '50');
    const offset     = parseInt(searchParams.get('offset') || '0');

    const result = await getNews({
      search, risk_level, source, limit, offset,
      client_ids: session.rol === 'admin' ? undefined : session.musteri_ids,
    });

    return NextResponse.json({ items: result.items, total: result.total });
  } catch (err) {
    console.error('[/api/haberler]', err);
    return NextResponse.json({ error: 'DB hatası', detail: String(err) }, { status: 500 });
  }
}
