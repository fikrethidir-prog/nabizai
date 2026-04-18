/**
 * AI Brifing API — Claude API veya fallback template
 * GET /api/ai-brifing => Son 24 saatin haberlerini analiz edip AI özet üretir
 * Cache: 1 saat — her kullanıcı açılışında API çağrısı yapılmaz
 */
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getNews, getStats } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// Brifing üretimi — 1 saatte bir yenilenir (Claude API maliyetini minimize eder)
const getCachedBrifing = unstable_cache(
  async (clientIds: string[] | undefined) => {
    const stats = await getStats(clientIds);
    const { items } = await getNews({ limit: 20, client_ids: clientIds });

    const highRisk = items.filter(i => i.risk_level === 'high');
    const medRisk = items.filter(i => i.risk_level === 'medium');
    const topSource = stats.bySource[0]?.source ?? '—';
    const topTags = stats.topTags.slice(0, 5).map(t => t.tag);

    // Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your_anthropic_key') {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey });

        const haberOzet = items.slice(0, 8).map(n =>
          `- ${n.title} (${n.source}, risk: ${n.risk_level})`
        ).join('\n');

        const message = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Yerel medya özeti yaz (Türkçe, 2-3 cümle, sadece özet):
Bugün: ${stats.today} içerik, yüksek risk: ${highRisk.length}, konular: ${topTags.slice(0,3).join(', ')}
${haberOzet}`
          }]
        });

        const aiText = message.content[0].type === 'text' ? message.content[0].text : '';
        return {
          brifing: aiText,
          kaynak: 'claude-ai',
          stats: { total: stats.total, today: stats.today, highRisk: highRisk.length, medRisk: medRisk.length },
          topTags,
          topSource,
          timestamp: new Date().toISOString(),
        };
      } catch (aiErr) {
        console.warn('[AI Brifing] Claude API hatası, fallback kullanılıyor:', aiErr);
      }
    }

    // Fallback: Template
    let brifing = `Sistemde toplam ${stats.total} içerik mevcut.`;
    if (stats.today > 0) brifing += ` Bugün ${stats.today} yeni içerik tarandı.`;
    brifing += ` En aktif kaynak: ${topSource}.`;
    if (topTags.length > 0) brifing += ` Öne çıkan konular: ${topTags.join(', ')}.`;
    if (highRisk.length > 0) brifing += ` ⚠️ ${highRisk.length} yüksek riskli içerik tespit edildi — dikkat edilmeli.`;
    else if (medRisk.length > 0) brifing += ` ${medRisk.length} orta riskli içerik izlenmektedir.`;
    else brifing += ` Aktif bir kriz durumu bulunmuyor, genel durum olumlu.`;

    return {
      brifing,
      kaynak: 'template',
      stats: { total: stats.total, today: stats.today, highRisk: highRisk.length, medRisk: medRisk.length },
      topTags,
      topSource,
      timestamp: new Date().toISOString(),
    };
  },
  ['ai-brifing'],
  { revalidate: 21600 } // 6 saat cache (test süreci için ekonomik)
);

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const clientIds = session.rol === 'admin' ? undefined : session.musteri_ids;
    const result = await getCachedBrifing(clientIds);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/ai-brifing]', err);
    return NextResponse.json({ error: 'Brifing oluşturulamadı', detail: String(err) }, { status: 500 });
  }
}
