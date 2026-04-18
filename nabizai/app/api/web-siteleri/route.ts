import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

export interface WebSitesi {
  id: string;
  ad: string;
  url: string;
  feed_url: string;
  yayin_merkezi: string;
  il: string;
  ilce: string;
  tur: string;
  aktif: boolean;
}

// ── Supabase helpers ────────────────────────────────────────────────

async function getSb() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'nabizai' } }
  );
}

// ── File helpers (local) ────────────────────────────────────────────

function readSitelerLocal(): WebSitesi[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'web_siteleri.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return []; }
}

function writeSitelerLocal(data: WebSitesi[]) {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), '..', 'data', 'web_siteleri.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── GET — tüm web sitelerini listele ────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  // Supabase modda — config tablosundaki client source_urls'den oku
  // veya lokal dosyadan oku
  return NextResponse.json(readSitelerLocal());
}

// ── POST — yeni site ekle ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  const siteler = readSitelerLocal();

  // Excel/CSV toplu import
  if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    const csvText = await req.text();
    const lines = csvText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV en az 2 satır olmalı (başlık + veri)' }, { status: 400 });
    }

    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredHeaders = ['ad', 'url'];
    const missing = requiredHeaders.filter(rh => !headers.includes(rh));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Eksik sütunlar: ${missing.join(', ')}` }, { status: 400 });
    }

    let eklenen = 0;
    let atlanan = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      const ad = row['ad'] || row['site_adi'] || '';
      const url = row['url'] || row['web_sitesi'] || '';
      if (!ad || !url) { atlanan++; continue; }

      const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
      if (siteler.some(s => s.url.replace(/\/$/, '').toLowerCase() === normalizedUrl)) {
        atlanan++;
        continue;
      }

      siteler.push({
        id: ad.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) + '_' + Date.now().toString(36),
        ad, url,
        feed_url: row['feed_url'] || row['rss'] || '',
        yayin_merkezi: row['yayin_merkezi'] || '',
        il: row['il'] || 'Muğla',
        ilce: row['ilce'] || '',
        tur: row['tur'] || 'yerel_haber',
        aktif: true,
      });
      eklenen++;
    }

    writeSitelerLocal(siteler);
    return NextResponse.json({ ok: true, mesaj: `${eklenen} site eklendi, ${atlanan} atlandı`, eklenen, atlanan, toplam: siteler.length });
  }

  // Tekil JSON ekleme
  const body = await req.json();
  const { ad, url, feed_url, yayin_merkezi, il, ilce, tur } = body;

  if (!ad || !url) {
    return NextResponse.json({ error: 'Site adı ve URL zorunlu' }, { status: 400 });
  }

  siteler.push({
    id: body.id || (ad.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36)),
    ad, url,
    feed_url: feed_url || '',
    yayin_merkezi: yayin_merkezi || '',
    il: il || 'Muğla',
    ilce: ilce || '',
    tur: tur || 'yerel_haber',
    aktif: body.aktif !== false,
  });

  writeSitelerLocal(siteler);
  return NextResponse.json({ ok: true, id: siteler[siteler.length - 1].id, toplam: siteler.length });
}

// ── PUT — site güncelle ──────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const siteler = readSitelerLocal();
  const idx = siteler.findIndex(s => s.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 });

  siteler[idx] = { ...siteler[idx], ...body };
  writeSitelerLocal(siteler);
  return NextResponse.json({ ok: true });
}

// ── DELETE — site sil ────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const siteler = readSitelerLocal().filter(s => s.id !== id);
  writeSitelerLocal(siteler);
  return NextResponse.json({ ok: true, toplam: siteler.length });
}
