import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isSupabaseMode } from '@/lib/db';

// ── Paylaşılan tip ─────────────────────────────────────────────────
export interface MusteriPanel {
  id?: string;
  musteriAd: string;
  yetkili?: string;
  email?: string;
  il?: string;
  paket: string;
  olusturulma?: string;
  guncelleme?: string;
  kategoriler?: string[];
  anahtar_kelimeler?: string[];
  haric_kelimeler?: string[];
  haber_kaynaklari?: string[];
  sosyal_medya?: { platform: string; aktif: boolean; hesaplar?: string[] }[];
  tarama_sikligi_dk?: number;
  kriz_esigi?: number;
  otomatik_tetikleme?: boolean;
  tetikleme_kurallari?: string[];
  rakipler?: string[];
  gunluk_email?: boolean;
  email_saati?: string;
  haftalik_pdf?: boolean;
  haftalik_pdf_gun?: string;
  aylik_rapor?: boolean;
  telegram_aktif?: boolean;
  telegram_chat_id?: string;
  whatsapp_aktif?: boolean;
  whatsapp_numara?: string;
  ai_brifing?: boolean;
  ai_brifing_saati?: string;
  duygu_analizi?: boolean;
  kriz_erken_uyari?: boolean;
  ai_yorum?: boolean;
  ozel_kaynak_listesi?: boolean;
  ozel_dashboard?: boolean;
  musteri_tipi?: string;
  widget_permissions?: Record<string, boolean>;
  durum?: 'aktif' | 'askida' | 'iptal';
}

// ── Supabase CRUD ──────────────────────────────────────────────────

async function getSb() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function readAllSupabase(): Promise<MusteriPanel[]> {
  const sb = await getSb();
  const { data } = await sb.from('clients').select('*').order('created_at', { ascending: false });
  return (data || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    musteriAd: d.name as string,
    paket: (d.plan as string) || 'izleme',
    email: '',
    olusturulma: d.created_at as string,
    kategoriler: [],
    anahtar_kelimeler: (d.keywords as string[]) || [],
    haber_kaynaklari: (d.source_urls as string[]) || [],
    ...((d.config as Record<string, unknown>) || {}),
  }));
}

// ── Dosya tabanlı CRUD ─────────────────────────────────────────────

function readAllFile(): MusteriPanel[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'musteri_panelleri.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return []; }
}

function writeAllFile(data: MusteriPanel[]) {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), '..', 'data', 'musteri_panelleri.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ── GET ────────────────────────────────────────────────────────────
export async function GET() {
  if (isSupabaseMode()) {
    return NextResponse.json(await readAllSupabase());
  }
  return NextResponse.json(readAllFile());
}

// ── POST ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: MusteriPanel = await req.json();

    if (isSupabaseMode()) {
      const sb = await getSb();
      if (body.id) {
        // Güncelle
        await sb.from('clients').update({
          name: body.musteriAd,
          plan: body.paket,
          keywords: body.anahtar_kelimeler || [],
          source_urls: body.haber_kaynaklari || [],
          config: body,
        }).eq('id', body.id);
      } else {
        // Oluştur
        const slug = body.musteriAd.toLowerCase()
          .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 50);
        const { data } = await sb.from('clients').insert({
          name: body.musteriAd,
          slug: slug + '-' + Date.now().toString(36),
          plan: body.paket || 'izleme',
          keywords: body.anahtar_kelimeler || [],
          source_urls: body.haber_kaynaklari || [],
          config: body,
        }).select('id').single();
        body.id = data?.id;
      }
      return NextResponse.json({ ok: true, id: body.id });
    } else {
      const list = readAllFile();
      let saved: MusteriPanel;

      if (body.id) {
        const idx = list.findIndex(p => p.id === body.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...body, guncelleme: new Date().toISOString() };
          saved = list[idx];
        } else {
          saved = { ...body, guncelleme: new Date().toISOString() };
          list.push(saved);
        }
      } else {
        saved = { ...body, id: randomUUID(), olusturulma: new Date().toISOString() };
        list.push(saved);
      }

      writeAllFile(list);

      // Python config dosyası yaz (sadece lokal modda)
      try {
        const fs = require('fs');
        const path = require('path');
        const configsDir = path.join(process.cwd(), '..', 'data', 'musteri_configs');
        fs.mkdirSync(configsDir, { recursive: true });
        const filename = String(saved.id).replace(/[^a-zA-Z0-9_\-]/g, '_');
        fs.writeFileSync(
          path.join(configsDir, `${filename}.json`),
          JSON.stringify(saved, null, 2),
          'utf-8'
        );
      } catch { /* config yazma hatası kritik değil */ }

      return NextResponse.json({ ok: true, id: saved.id });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  try {
    if (isSupabaseMode()) {
      const sb = await getSb();
      await sb.from('clients').delete().eq('id', id);
    } else {
      const list = readAllFile().filter(p => p.id !== id);
      writeAllFile(list);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
