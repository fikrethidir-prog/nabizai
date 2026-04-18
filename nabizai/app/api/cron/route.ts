import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getCronState, startCron, stopCron, triggerNow } from '@/lib/cron';

// Vercel Cron veya admin kullanıcısı kontrolü
function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron Jobs: Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  return false;
}

// GET: Vercel Cron tarafından tetiklenir — tarama başlatır
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    // Admin kullanıcısı da durum görebilir
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }
    return NextResponse.json(getCronState());
  }

  // Vercel Cron çağrısı — taramayı tetikle
  triggerNow();
  return NextResponse.json({ ok: true, mesaj: 'Cron taraması tetiklendi', ts: new Date().toISOString() });
}

// POST: Admin kullanıcısı tarafından manuel kontrol
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { action } = await req.json();
  switch (action) {
    case 'start':   startCron();   return NextResponse.json({ ok: true, mesaj: 'Cron başlatıldı' });
    case 'stop':    stopCron();    return NextResponse.json({ ok: true, mesaj: 'Cron durduruldu' });
    case 'trigger': triggerNow();  return NextResponse.json({ ok: true, mesaj: 'Manuel tarama tetiklendi' });
    default: return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 });
  }
}
