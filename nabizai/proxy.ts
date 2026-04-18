import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'nabizai-super-secret-key-2026-change-in-prod'
);
const COOKIE_NAME = 'nabizai_session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/') ||
    pathname === '/login' ||
    pathname === '/' ||
    pathname === '/demo'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let payload: { rol?: string; musteri_ids?: string[] } | null = null;

  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, SECRET);
      payload = p as { rol?: string; musteri_ids?: string[] };
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin')) {
    if (payload.rol !== 'admin') {
      return NextResponse.redirect(new URL('/login?hata=yetkisiz', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/musteri/')) {
    if (payload.rol !== 'admin') {
      const mId = pathname.split('/')[2];
      if (!(payload.musteri_ids || []).includes(mId)) {
        return NextResponse.redirect(new URL('/login?hata=erisim-yok', request.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
