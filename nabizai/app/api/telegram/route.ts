/**
 * Telegram Bildirim API
 * POST /api/telegram/test — Test mesajı gönderir
 * POST /api/telegram/kriz — Kriz uyarısı gönderir
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { sendTelegramMessage, sendCrisisAlert, sendDailyBriefing } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tip, chatId, ...rest } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'chatId gerekli' }, { status: 400 });
    }

    let result;

    switch (tip) {
      case 'test':
        result = await sendTelegramMessage(chatId, '✅ nabızai Telegram bağlantısı başarılı!');
        break;

      case 'kriz':
        result = await sendCrisisAlert(
          chatId,
          rest.title || 'Test Uyarısı',
          rest.source || 'nabızai',
          rest.riskLevel || 'high',
          rest.url || 'https://nabizai.com',
          rest.summary,
        );
        break;

      case 'brifing':
        result = await sendDailyBriefing(
          chatId,
          rest.brifing || 'Test brifing mesajı',
          rest.stats || { total: 0, today: 0, highRisk: 0 },
        );
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz tip (test|kriz|brifing)' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/telegram]', err);
    return NextResponse.json({ error: 'Telegram hatası', detail: String(err) }, { status: 500 });
  }
}
