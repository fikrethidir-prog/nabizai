import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const musteriId = searchParams.get('musteri_id') ?? '';

  // Production'da (Supabase mode) henüz rapor dosya sistemi yok
  // Bu özellik ileriki fazda Supabase Storage ile entegre edilecek
  if (isSupabaseMode()) {
    return NextResponse.json([
      {
        id: 'ornek-rapor-1',
        baslik: 'Haftalık Medya Raporu — Nisan 2026',
        tarih: new Date().toLocaleDateString('tr-TR'),
        boyut: '—',
        url: '#',
        durum: 'yakinda',
      }
    ]);
  }

  // Lokal modda Dosyalardan oku
  try {
    const { readdirSync, statSync, existsSync } = require('fs');
    const { join, extname } = require('path');
    const RAPORLAR_DIR = join(process.cwd(), '..', 'data', 'raporlar');

    if (!existsSync(RAPORLAR_DIR)) {
      return NextResponse.json([]);
    }

    const tumDosyalar = readdirSync(RAPORLAR_DIR) as string[];
    const raporlar = tumDosyalar
      .filter((f: string) => {
        if (extname(f).toLowerCase() !== '.pdf') return false;
        if (musteriId && !f.includes(musteriId)) return false;
        return true;
      })
      .map((f: string) => {
        const filePath = join(RAPORLAR_DIR, f);
        const stat = statSync(filePath);
        const tarih = stat.mtime.toLocaleDateString('tr-TR');
        return {
          id: f.replace('.pdf', ''),
          baslik: f.replace('.pdf', '').replace(/_/g, ' '),
          dosyaAdi: f,
          tarih,
          boyut: Math.round(stat.size / 1024) + ' KB',
          url: `/api/raporlar/indir?dosya=${encodeURIComponent(f)}`,
        };
      })
      .sort((a: { tarih: string }, b: { tarih: string }) => b.tarih.localeCompare(a.tarih));

    return NextResponse.json(raporlar);
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
