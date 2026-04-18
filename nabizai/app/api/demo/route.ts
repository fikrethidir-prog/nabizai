/**
 * Demo Talep API  
 * POST /api/demo — Demo talebi kaydeder
 * GET  /api/demo — Admin panel için talepleri listeler
 */
import { NextRequest, NextResponse } from 'next/server';
import { addDemoRequest, getDemoRequests } from '@/lib/db';
import { mailDemoTalebiGeldi } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ad, kurum, email, telefon, sektor, mesaj } = body;

    if (!ad || !email) {
      return NextResponse.json({ error: 'Ad ve e-posta zorunludur' }, { status: 400 });
    }

    const talepId = await addDemoRequest({
      id: '',
      ad,
      kurum: kurum || '',
      sirket: kurum || '',
      email,
      telefon: telefon || '',
      sektor: sektor || '',
      mesaj: mesaj || '',
      durum: 'yeni',
    });

    // Admin'e mail bildirimi (async, hata olsa da devam et)
    mailDemoTalebiGeldi({ ad, kurum: kurum || '', email, telefon, sektor: sektor || '', mesaj })
      .catch(e => console.warn('[Demo Mail]', e));

    return NextResponse.json({ ok: true, talep_id: talepId });
  } catch (err) {
    console.error('[/api/demo]', err);
    return NextResponse.json({ error: 'Talep kaydedilemedi' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const talepler = await getDemoRequests();
    return NextResponse.json(talepler);
  } catch {
    return NextResponse.json([]);
  }
}

// PATCH — talep durumunu güncelle
export async function PATCH(req: NextRequest) {
  try {
    const { id, durum } = await req.json();
    if (!id || !durum) return NextResponse.json({ error: 'id ve durum zorunlu' }, { status: 400 });

    const gecerliDurumlar = ['yeni', 'iletisime_gecildi', 'demo_yapildi', 'musteri_oldu'];
    if (!gecerliDurumlar.includes(durum)) return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });

    const { isSupabaseMode } = await import('@/lib/db');
    if (isSupabaseMode()) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { error } = await sb.from('demo_requests').update({ durum }).eq('id', id);
      if (error) throw error;
    } else {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '..', 'data', 'demo_talepleri.json');
      const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const idx = list.findIndex((t: { id: string }) => t.id === id);
      if (idx !== -1) { list[idx].durum = durum; fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8'); }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
