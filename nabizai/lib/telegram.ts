/**
 * Telegram Bildirim Yardımcısı
 * Kriz uyarıları ve önemli bildirimler için Telegram bot kullanır
 */

const TELEGRAM_API = 'https://api.telegram.org';

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

/**
 * Telegram üzerinden mesaj gönderir
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_token') {
    console.warn('[Telegram] Bot token tanımlı değil');
    return { ok: false, error: 'Bot token yok' };
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] API hatası:', data.description);
      return { ok: false, error: data.description };
    }
    return { ok: true };
  } catch (err) {
    console.error('[Telegram] Gönderim hatası:', err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Kriz uyarısı formatında Telegram mesajı gönderir
 */
export async function sendCrisisAlert(
  chatId: string,
  title: string,
  source: string,
  riskLevel: string,
  url: string,
  summary?: string,
): Promise<TelegramResult> {
  const emoji = riskLevel === 'high' ? '🚨' : '⚠️';
  const riskTr = riskLevel === 'high' ? 'YÜKSEK' : 'ORTA';

  let message = `${emoji} <b>Kriz Uyarısı — ${riskTr} RİSK</b>\n\n`;
  message += `📰 <b>${escapeHtml(title)}</b>\n`;
  message += `📡 Kaynak: ${escapeHtml(source)}\n`;
  if (summary) {
    message += `\n💡 ${escapeHtml(summary.slice(0, 200))}\n`;
  }
  message += `\n🔗 <a href="${url}">Habere git</a>`;
  message += `\n\n⏰ ${new Date().toLocaleString('tr-TR')}`;

  return sendTelegramMessage(chatId, message);
}

/**
 * Günlük brifing mesajı gönderir
 */
export async function sendDailyBriefing(
  chatId: string,
  brifing: string,
  stats: { total: number; today: number; highRisk: number },
): Promise<TelegramResult> {
  let message = `📊 <b>nabızai — Günlük Brifing</b>\n\n`;
  message += `${escapeHtml(brifing)}\n\n`;
  message += `📈 Toplam: ${stats.total} | Bugün: +${stats.today}`;
  if (stats.highRisk > 0) {
    message += ` | 🚨 ${stats.highRisk} kriz`;
  }
  message += `\n\n⏰ ${new Date().toLocaleString('tr-TR')}`;

  return sendTelegramMessage(chatId, message);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
