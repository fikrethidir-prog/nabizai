/**
 * Şifre Sıfırlama API
 * POST /api/auth/sifre-sifirla — E-posta ile şifre sıfırlama linki gönderir
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-posta gerekli' }, { status: 400 });
    }

    // Kullanıcıyı kontrol et
    const user = await getUserByEmail(email.toLowerCase().trim());

    // Güvenlik: Kullanıcı olsun veya olmasın aynı mesajı ver
    // Bu, e-posta adresi keşfini engeller
    if (!user) {
      return NextResponse.json({
        ok: true,
        mesaj: 'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama talimatları gönderildi.',
      });
    }

    // TODO: Gerçek e-posta gönderimi — şimdilik log
    console.log(`[Şifre Sıfırlama] İstek: ${email} — Kullanıcı: ${user.ad}`);

    return NextResponse.json({
      ok: true,
      mesaj: 'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama talimatları gönderildi.',
    });
  } catch (err) {
    console.error('[/api/auth/sifre-sifirla]', err);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
