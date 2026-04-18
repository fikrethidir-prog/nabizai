import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getNews, getStats, getCrisisItems, isSupabaseMode } from '@/lib/db';

function readCacheLocal(musteriId: string, filename: string): unknown {
  if (isSupabaseMode()) return null;
  try {
    const fs = require('fs');
    const path = require('path');
    const p = path.join(process.cwd(), '..', 'data', 'widget_cache', musteriId, filename);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { type } = await params;
  const musteriId = req.nextUrl.searchParams.get('musteri_id') || session.musteri_ids?.[0] || '';
  if (!musteriId) return NextResponse.json({ error: 'musteri_id gerekli' }, { status: 400 });

  const clientIds = [musteriId];

  try {
    switch (type) {
      case 'haberler': {
        const result = await getNews({ client_ids: clientIds, limit: 20 });
        return NextResponse.json(result);
      }
      case 'duygu_analizi': {
        const news = await getNews({ client_ids: clientIds, limit: 200 });
        const dist = { pozitif: 0, negatif: 0, notr: 0 };
        for (const item of news.items) {
          if (item.risk_level === 'high') dist.negatif++;
          else if (item.risk_level === 'medium') dist.notr++;
          else dist.pozitif++;
        }
        return NextResponse.json({ distribution: dist, total: news.total });
      }
      case 'kriz_takip': {
        const alerts = await getCrisisItems(clientIds);
        return NextResponse.json({ alerts, total: alerts.length });
      }
      case 'kriz_momentum': {
        const cached = readCacheLocal(musteriId, 'kriz_momentum.json');
        return NextResponse.json(cached || { score: 0, level: 'Normal', speed: 0, source_count: 0, intensity: 0, trend: 'stabil' });
      }
      case 'rakip_analizi': {
        const stats = await getStats(clientIds);
        return NextResponse.json({ sources: stats.bySource, total: stats.total });
      }
      case 'sosyal_medya': {
        const cached = readCacheLocal(musteriId, 'sosyal_medya.json');
        return NextResponse.json(cached || { data: [], demo: true });
      }
      case 'raporlar': {
        if (isSupabaseMode()) {
          return NextResponse.json([]);
        }
        try {
          const fs = require('fs');
          const path = require('path');
          const raporDir = path.join(process.cwd(), '..', 'data', 'raporlar');
          if (!fs.existsSync(raporDir)) return NextResponse.json([]);
          const files = fs.readdirSync(raporDir).filter((f: string) => f.endsWith('.pdf'));
          return NextResponse.json(files.map((f: string) => ({
            id: f.replace('.pdf', ''),
            baslik: f.replace('.pdf', '').replace(/_/g, ' '),
            url: `/api/raporlar/indir?dosya=${encodeURIComponent(f)}`,
          })));
        } catch { return NextResponse.json([]); }
      }
      case 'ai_brifing': {
        const cached = readCacheLocal(musteriId, 'ai_brifing.json');
        if (cached) return NextResponse.json(cached);
        if (!isSupabaseMode()) {
          try {
            const fs = require('fs');
            const path = require('path');
            const latestMd = path.join(process.cwd(), '..', 'outputs', 'reports', 'latest_report.md');
            if (fs.existsSync(latestMd)) {
              const content = fs.readFileSync(latestMd, 'utf-8');
              return NextResponse.json({ content, tarih: new Date().toISOString() });
            }
          } catch { /* continue to default */ }
        }
        return NextResponse.json({ content: 'Henüz brifing üretilmemiş.', tarih: null });
      }
      case 'yayin_politikasi': {
        const cached = readCacheLocal(musteriId, 'yayin_politikasi.json');
        return NextResponse.json(cached || { sources: [], message: 'Analiz henüz çalıştırılmadı' });
      }
      default:
        return NextResponse.json({ error: `Bilinmeyen widget tipi: ${type}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
