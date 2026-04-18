import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

function isSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!key && !key.includes('your_') && !key.includes('BURAYA');
}

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_req: NextRequest) {
  try {
    if (isSupabase()) {
      const sb = await getSupabase();
      const { data } = await sb.from('site_settings').select('key, value');
      const settings: Record<string, string> = {};
      (data || []).forEach((r: { key: string; value: string }) => {
        settings[r.key] = r.value;
      });
      return NextResponse.json(settings);
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.rol !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    const newSettings: Record<string, string> = await req.json();

    if (isSupabase()) {
      const sb = await getSupabase();
      for (const [key, value] of Object.entries(newSettings)) {
        await sb.from('site_settings').upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      }
    }

    // Ana sayfadaki ISR önbelleğini temizle
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 });
  }
}
