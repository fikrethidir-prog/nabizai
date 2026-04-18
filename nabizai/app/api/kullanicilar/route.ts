import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { hashSifre } from '@/lib/auth';
import { getAllUsers, appendLog, isSupabaseMode } from '@/lib/db';
import { mailKullaniciBilgi, mailSifreSifirla } from '@/lib/mail';

async function getSb() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — tüm kullanıcılar (şifresiz)
export async function GET() {
  const list = await getAllUsers();
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
      const sb = await getSb();
      const { error } = await sb.from('users').insert({
        id: yeniId, ad, email,
        sifre_hash: hash, sifre_salt: salt,
        rol: rol || 'musteri',
        musteri_ids: musteri_ids || [],
      });
      if (error) throw error;
    } else {
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

    await appendLog({ kullanici_id: 'admin', ad: 'Admin', rol: 'admin', eylem: 'kullanici_olustur', detay: { email, yeni_id: yeniId } });

    // Kullanıcıya bilgi maili gönder
    mailKullaniciBilgi({ ad, email, sifre })
      .catch(e => console.warn('[Kullanıcı Mail]', e));

    return NextResponse.json({ ok: true, id: yeniId });
  } catch (err) {
    console.error('[/api/kullanicilar POST]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH — kullanıcı güncelle (ad, email, musteri_ids, yeni şifre)
export async function PATCH(req: NextRequest) {
  try {
    const { id, ad, email, musteri_ids, yeni_sifre } = await req.json();
    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (ad) updates.ad = ad;
    if (email) updates.email = email;
    if (musteri_ids !== undefined) updates.musteri_ids = musteri_ids;
    if (yeni_sifre) {
      const { hash, salt } = hashSifre(yeni_sifre);
      updates.sifre_hash = hash;
      updates.sifre_salt = salt;
    }

    if (isSupabaseMode()) {
      const sb = await getSb();
      const { error } = await sb.from('users').update(updates).eq('id', id);
      if (error) throw error;
    } else {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
      const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const idx = list.findIndex((k: { id: string }) => k.id === id);
      if (idx === -1) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
      list[idx] = { ...list[idx], ...updates };
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    }

    await appendLog({ kullanici_id: 'admin', ad: 'Admin', rol: 'admin', eylem: 'kullanici_guncelle', detay: { id, alanlar: Object.keys(updates) } });

    // Şifre değiştiyse mail gönder
    if (yeni_sifre) {
      const tumKullanicilar = await getAllUsers();
      const k = tumKullanicilar.find(u => u.id === id);
      if (k) {
        mailSifreSifirla({ ad: (updates.ad as string) || k.ad, email: (updates.email as string) || k.email, yeni_sifre })
          .catch(e => console.warn('[Şifre Mail]', e));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/kullanicilar PATCH]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — kullanıcı sil
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

  try {
    if (isSupabaseMode()) {
      const sb = await getSb();
      const { error } = await sb.from('users').delete().eq('id', id);
      if (error) throw error;
    } else {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
      const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      fs.writeFileSync(filePath, JSON.stringify(list.filter((k: { id: string }) => k.id !== id), null, 2), 'utf-8');
    }

    await appendLog({ kullanici_id: 'admin', ad: 'Admin', rol: 'admin', eylem: 'kullanici_sil', detay: { silinen_id: id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/kullanicilar DELETE]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
