import { NextResponse } from 'next/server';
import { COOKIE_NAME, sessionGetir } from '@/lib/auth';
import { appendLog } from '@/lib/logHelper';

export async function POST() {
  const session = await sessionGetir();
  if (session) {
    await appendLog({
      kullanici_id: session.kullanici_id,
      ad: session.ad,
      rol: session.rol,
      eylem: 'logout',
      detay: {},
    });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}
