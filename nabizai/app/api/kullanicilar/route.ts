import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { hashSifre } from '@/lib/auth';
import { getAllUsers, appendLog, isSupabaseMode } from '@/lib/db';

// GET — tüm kullanıcılar (şifresiz)
export async function GET() {
  const list = await getAllUsers();
  // sifre_hash ve sifre_salt'ı gizle
  return NextResponse.json(list.map(({ sifre_hash: _, sifre_salt: __, ...rest }) => rest));
}

// POST — yeni kullanıcı oluştur
export async function POST(req: NextRequest) {
  try {
    const { ad, email, sifre, rol, musteri_ids } = await req.json();
    if (!ad || !email || !sifre) {
      return NextResponse.json({ error: 'ad, email, sifre zorunlu' }, { status: 400 });
    }
    const list = await getAllUsers();
    if (list.find(k => k.email === email)) {
      return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 });
    }
    const { hash, salt } = hashSifre(sifre);
    const yeniId = randomUUID();

    if (isSupabaseMode()) {
      // Supabase'e ekle
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { db: { schema: 'nabizai' } }
      );
      const { error } = await sb.from('users').insert({
        id: yeniId,
        ad,
        email,
        sifre_hash: hash,
        sifre_salt: salt,
        rol: rol || 'musteri',
        musteri_ids: musteri_ids || [],
      });
      if (error) throw error;
    } else {
      // Dosyaya yaz (lokal geliştirme)
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
      const yeni = {
        id: yeniId, ad, email,
        sifre_hash: hash, sifre_salt: salt,
        rol: rol || 'musteri',
        musteri_ids: musteri_ids || [],
        olusturulma: new Date().toISOString(),
      };
      list.push(yeni);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    }

    await appendLog({
      kullanici_id: 'admin',
      ad: 'Admin',
      rol: 'admin',
      eylem: 'kullanici_olustur',
      detay: { email, yeni_id: yeniId },
    });
    return NextResponse.json({ ok: true, id: yeniId });
  } catch (err) {
    console.error('[/api/kullanicilar POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — kullanıcı sil
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  try {
    if (isSupabaseMode()) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { db: { schema: 'nabizai' } }
      );
      const { error } = await sb.from('users').delete().eq('id', id);
      if (error) throw error;
    } else {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
      const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const filtered = list.filter((k: { id: string }) => k.id !== id);
      fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
    }

    await appendLog({
      kullanici_id: 'admin',
      ad: 'Admin',
      rol: 'admin',
      eylem: 'kullanici_sil',
      detay: { silinen_id: id },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/kullanicilar DELETE]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
