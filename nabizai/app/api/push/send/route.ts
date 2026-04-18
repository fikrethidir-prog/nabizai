import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { sendPushToClient, isFCMConfigured } from '@/lib/fcm';
import { appendLog } from '@/lib/logHelper';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { musteri_id, baslik, mesaj, tip = 'genel' } = await req.json();
  if (!musteri_id || !baslik) {
    return NextResponse.json({ error: 'musteri_id ve baslik zorunlu' }, { status: 400 });
  }

  const result = await sendPushToClient(musteri_id, baslik, mesaj || baslik);

  await appendLog({
    kullanici_id: session.kullanici_id,
    ad: session.ad,
    rol: session.rol,
    eylem: 'push_gonderim',
    detay: { musteri_id, baslik, tip, ...result },
  });

  return NextResponse.json({
    ok: true,
    ...result,
    fcm_configured: isFCMConfigured(),
    mesaj: result.simulated
      ? `FCM yapılandırılmamış — ${result.sent} bildirim simüle edildi`
      : `${result.sent} bildirim gönderildi`,
  });
}
