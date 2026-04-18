/**
 * lib/auth.ts — Sadece Node.js ortamında çalışır (API Routes, Server Components)
 * Middleware için KULLANILAMAZ (Edge Runtime).
 * Middleware, COOKIE_NAME ve jwtVerify'yi kendi içinde barındırır.
 */
import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'nabizai_session';
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'nabizai-super-secret-key-2026-change-in-prod'
);

export type Rol = 'admin' | 'musteri';

export interface SessionPayload {
  kullanici_id: string;
  email: string;
  ad: string;
  rol: Rol;
  musteri_ids: string[];
}

// ── Şifre (Node.js crypto — Edge'de çalışmaz) ─────────────────────────
export function hashSifre(sifre: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(s + sifre).digest('hex');
  return { hash, salt: s };
}

export function sifreKontrol(sifre: string, hash: string, salt: string): boolean {
  return createHash('sha256').update(salt + sifre).digest('hex') === hash;
}

// ── JWT ───────────────────────────────────────────────────────────────
export async function sessionOlustur(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function sessionDogrula(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Cookie (Server Components / API Routes) ───────────────────────────
export async function sessionGetir(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return sessionDogrula(token);
}

// ── Request-based session (API Routes — Cookie + Bearer desteği) ──────
import { type NextRequest } from 'next/server';

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  // 1. Authorization: Bearer <token> (Flutter mobil)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const session = await sessionDogrula(token);
    if (session) return session;
  }
  // 2. Cookie (Web browser)
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return sessionDogrula(cookieToken);
  return null;
}
