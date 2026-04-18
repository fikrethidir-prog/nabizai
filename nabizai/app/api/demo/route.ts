/**
 * Demo Talep API  
 * POST /api/demo — Demo talebi kaydeder
 * GET  /api/demo — Admin panel için talepleri listeler
 */
import { NextRequest, NextResponse } from 'next/server';
import { addDemoRequest, getDemoRequests } from '@/lib/db';

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

    console.log(`[Demo Talep] Yeni talep: ${ad} (${kurum || '-'}) — ${email}`);

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
