import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_KEY === 'your_service_role_key') {
  console.error("❌ HATA: SUPABASE_SERVICE_ROLE_KEY .env.local'da eksik.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'public' } });
const sqliteDb = new Database('../data/medya_takip.db'); // It runs from nabizai/scripts/ so we gotta figure out the cwd
const dataDir = '../data';

const panellerFile = fs.readFileSync(dataDir + '/musteri_panelleri.json', 'utf8');
const kullanicilarFile = fs.readFileSync(dataDir + '/kullanicilar.json', 'utf8');

async function main() {
  console.log("🚀 MIGRATION BAŞLIYOR...");

  // 1. Kullanıcı Göçü
  console.log("👤 Kullanıcılar aktarılıyor...");
  const users = JSON.parse(kullanicilarFile);
  for (const user of users) {
    await sb.from('users').upsert({
      id: user.id,
      ad: user.ad,
      email: user.email,
      sifre_hash: user.sifre_hash,
      sifre_salt: user.sifre_salt,
      rol: user.rol || 'musteri',
      musteri_ids: user.musteri_ids || []
    }, { onConflict: 'id' });
  }

  // 2. Müşteri (Paneller)
  console.log("🏢 Paneller aktarılıyor...");
  const paneller = JSON.parse(panellerFile);
  for (const p of paneller) {
      const pSlug = p.musteriAd.toLowerCase().replace(/ /g, '-') + '-' + String(p.id).slice(-4);
      await sb.from('clients').upsert({
          name: p.musteriAd,
          slug: pSlug,
          plan: p.paket || 'izleme',
          keywords: p.anahtar_kelimeler || [],
          source_urls: p.haber_kaynaklari || [],
          config: p
      }, { onConflict: 'slug' });
  }

  // Varsayılan müşteri ID'sini al
  const { data: defaultClient } = await sb.from('clients').select('id').eq('slug', 'xbodrum-demo').single();
  const clientId = defaultClient ? defaultClient.id : '00000000-0000-0000-0000-000000000001';

  // 3. Haberler
  console.log("📰 Haberler aktarılıyor...");
  const contents = sqliteDb.prepare("SELECT * FROM content").all();
  console.log(`Bulunan haber sayısı: ${contents.length}`);
  
  let batch = [];
  let inserted = 0;
  for (const row of contents) {
      let tags = [];
      let meta = {};
      try { tags = JSON.parse(row.tags || "[]"); } catch(e){}
      try { meta = JSON.parse(row.metadata || "{}"); } catch(e){}
      
      const record = {
        client_id: clientId,
        title: row.title || "",
        url: row.url || "",
        source: row.source || "",
        platform: "web",
        content: row.content || "",
        category: row.category || "",
        tags: Array.isArray(tags) ? tags : [],
        ai_summary: meta.ai_summary || "",
        image_url: meta.image_url || null,
        status: row.status || "new",
        published_at: row.published_date || null,
        created_at: row.ingested_date || new Date().toISOString()
      };
      
      batch.push(record);
      
      if (batch.length >= 50) {
         const {error} = await sb.from('news_items').insert(batch);
         if (error) console.error("Batch error:", error.message);
         inserted += batch.length;
         process.stdout.write(`\rAktarılan: ${inserted}/${contents.length}`);
         batch = [];
      }
  }
  if (batch.length > 0) {
      const {error} = await sb.from('news_items').insert(batch);
      if (error) console.error("Batch error:", error.message);
      inserted += batch.length;
      process.stdout.write(`\rAktarılan: ${inserted}/${contents.length}`);
  }

  console.log("\n✅ GÖÇ BAŞARIYLA TAMAMLANDI!");
  sqliteDb.close();
}

main().catch(console.error);
