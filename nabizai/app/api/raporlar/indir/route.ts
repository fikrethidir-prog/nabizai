import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dosya = searchParams.get('dosya');
  if (!dosya) return NextResponse.json({ error: 'dosya parametresi gerekli' }, { status: 400 });

  // Production'da rapor indirme henüz Supabase Storage ile entegre değil
  if (isSupabaseMode()) {
    return NextResponse.json({ error: 'Rapor indirme henüz aktif değil' }, { status: 501 });
  }

  try {
    const { readFileSync, existsSync } = require('fs');
    const { join, basename } = require('path');
    const RAPORLAR_DIR = join(process.cwd(), '..', 'data', 'raporlar');
    const safeName = basename(dosya);
    const filePath = join(RAPORLAR_DIR, safeName);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 });
    }

    const buffer = readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
