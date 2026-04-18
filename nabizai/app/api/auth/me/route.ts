import { NextResponse } from 'next/server';
import { sessionGetir } from '@/lib/auth';

export async function GET() {
  try {
    const session = await sessionGetir();
    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });
    }
    return NextResponse.json({
      email: session.email,
      rol: session.rol,
      musteri_ids: session.musteri_ids ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
