import { NextRequest, NextResponse } from 'next/server';
import { sifreKontrol, sessionOlustur, COOKIE_NAME } from '@/lib/auth';
import { getUserByEmail, appendLog } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, sifre } = await req.json();
    if (!email || !sifre) {
      return NextResponse.json({ error: 'E-posta ve şifre gerekli' }, { status: 400 });
    }

    const kullanici = await getUserByEmail(email);
    if (!kullanici || !sifreKontrol(sifre, kullanici.sifre_hash, kullanici.sifre_salt)) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });
    }

    const token = await sessionOlustur({
      kullanici_id: kullanici.id,
      email: kullanici.email,
      ad: kullanici.ad,
      rol: kullanici.rol,
      musteri_ids: kullanici.musteri_ids,
    });

    const ip = req.headers.get('x-forwarded-for') || 'localhost';
    await appendLog({
      kullanici_id: kullanici.id,
      ad: kullanici.ad,
      rol: kullanici.rol,
      eylem: 'login',
      detay: { ip },
    });

    const res = NextResponse.json({
      ok: true,
      token,
      email: kullanici.email,
      rol: kullanici.rol,
      ad: kullanici.ad,
      musteri_ids: kullanici.musteri_ids,
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}
