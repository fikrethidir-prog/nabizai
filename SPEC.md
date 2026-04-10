# nabızai — Proje Spesifikasyonu
> Bu dosyayı Antigravity'de Claude'a ver. Tüm projeyi sıfırdan anlayıp kurabilir.

---

## 1. Proje Özeti

**nabızai** — Yerel medya izleme ve erken uyarı SaaS platformu.

- **Domain:** nabizai.com
- **Hedef kitle:** Belediyeler, oteller, AVM'ler, PR ajansları, siyasi danışmanlar
- **İş modeli:** Aylık abonelik (15.000 / 35.000 / 75.000+ TL)
- **Coğrafi odak:** Başlangıçta Bodrum & Muğla, sonra tüm Türkiye turizm destinasyonları
- **Geliştirici:** Fikret (xbodrum.com sahibi, yerel medya operatörü)

---

## 2. Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Stil | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel |
| Monorepo | Turborepo (`apps/nabizai`) |
| Bot altyapısı | Python + Node.js (xbodrum-bot — ayrı repo) |
| AI analiz | Anthropic Claude API (claude-sonnet-4-6) |
| Sosyal medya | Apify + X API Basic |
| Bildirim | Telegram Bot API |
| Dil | TypeScript |

**Mevcut monorepo:** BESİAD projesi ile aynı Turborepo. `apps/nabizai` olarak eklenecek. Supabase aynı instance, farklı şema (`nabizai`).

---

## 3. Marka & Tasarım Sistemi

### Renkler
```css
--nabiz-navy:    #233B77;   /* Ana renk — sidebar, butonlar, başlıklar */
--nabiz-orange:  #EE741D;   /* Vurgu — CTA, AI brifing, aktif öğeler */
--nabiz-dark:    #0F1B2D;   /* Hero arka plan, koyu tema */
--nabiz-green:   #1D9E75;   /* Pozitif ton, canlı gösterge */
--nabiz-red:     #E24B4A;   /* Negatif ton, kriz uyarısı */
--nabiz-amber:   #EF9F27;   /* Nötr, dikkat */
```

### Logo
- Radar halka ikonu (SVG) + "nabız" bold + "ai" light weight
- İkon: İç içe daireler + sweep line (#EE741D) + sinyal noktası
- Dosyalar: `nabizai_logo.svg`, `nabizai_logo_dark.svg`, `nabizai_icon.svg`
- Logo `public/` klasörüne kopyalanacak

### Tipografi
- Font: `Inter` (Google Fonts)
- Başlıklar: `font-weight: 800`, `letter-spacing: -0.05em`
- Body: `font-weight: 400`, `line-height: 1.7`

---

## 4. Sayfa Listesi & Route Yapısı

```
app/
├── (public)/
│   ├── page.tsx              → Landing page (nabizai.com)
│   ├── login/page.tsx        → Giriş ekranı
│   └── demo/page.tsx         → Demo talep formu
├── (dashboard)/
│   ├── layout.tsx            → Auth korumalı layout (middleware)
│   ├── dashboard/page.tsx    → Ana dashboard (genel bakış)
│   ├── haberler/page.tsx     → Tüm haberler listesi + filtre
│   ├── kriz/page.tsx         → Kriz uyarıları
│   ├── rakip/page.tsx        → Rakip medya analizi
│   └── raporlar/page.tsx     → PDF rapor indirme
└── (admin)/
    ├── admin/page.tsx        → Admin giriş (ayrı auth)
    ├── admin/musteriler/     → Müşteri yönetimi
    ├── admin/landing/        → Landing page CMS
    └── admin/kaynaklar/      → Kaynak site yönetimi
```

---

## 5. Supabase Şema (nabizai)

### `clients` tablosu — Müşteriler
```sql
create table nabizai.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                    -- "Bodrum AVM"
  slug        text unique not null,             -- "bodrum-avm"
  plan        text default 'izleme',            -- izleme | radar_pro | istihbarat
  logo_url    text,
  primary_color text default '#233B77',
  keywords    text[],                           -- ['bodrum avm', 'otopark', 'kira']
  source_urls text[],                           -- izlenecek ek siteler
  active      boolean default true,
  created_at  timestamptz default now()
);
```

### `client_users` tablosu — Müşteri–Kullanıcı ilişkisi
```sql
create table nabizai.client_users (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references nabizai.clients(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  role       text default 'viewer',             -- viewer | admin
  unique(client_id, user_id)
);
```

### `news_items` tablosu — Haberler
```sql
create table nabizai.news_items (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references nabizai.clients(id) on delete cascade,
  title        text not null,
  url          text,
  source       text,                            -- "bodrumgundem.com"
  platform     text default 'web',              -- web | instagram | twitter | facebook
  content      text,
  sentiment    text,                            -- positive | negative | neutral
  sentiment_score float,                        -- -1.0 ile 1.0 arası
  crisis_score float default 0,                -- 0-10 arası
  keywords     text[],
  published_at timestamptz,
  created_at   timestamptz default now()
);
```

### `crisis_alerts` tablosu — Kriz Uyarıları
```sql
create table nabizai.crisis_alerts (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references nabizai.clients(id) on delete cascade,
  topic        text not null,                   -- "Otopark şikayeti yayılıyor"
  score        float,                           -- 0-10
  source_count int default 1,
  sources      text[],
  status       text default 'active',           -- active | resolved | dismissed
  created_at   timestamptz default now()
);
```

### `site_settings` tablosu — Landing Page CMS
```sql
create table nabizai.site_settings (
  key   text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Başlangıç verileri
insert into nabizai.site_settings (key, value) values
  ('badge_text',    'Canlı izleme · 26 kaynak + sosyal medya'),
  ('hero_title_1',  'Yerel medyanın'),
  ('hero_title_2',  'nabzı'),
  ('hero_desc',     'Yerel haberler, sosyal medya ve rakip analizi tek ekranda. Kriz öncesi sizi uyarır, fırsatları kaçırmazsınız.'),
  ('stat_1_n',      '26+'),
  ('stat_1_l',      'yerel kaynak'),
  ('stat_2_n',      '4'),
  ('stat_2_l',      'sosyal platform'),
  ('stat_3_n',      '30dk'),
  ('stat_3_l',      'güncelleme sıklığı'),
  ('stat_4_n',      'AI'),
  ('stat_4_l',      'destekli analiz'),
  ('pkg_1_name',    'İzleme'),
  ('pkg_1_price',   '15.000 ₺'),
  ('pkg_2_name',    'Radar Pro'),
  ('pkg_2_price',   '35.000 ₺'),
  ('pkg_3_name',    'İstihbarat'),
  ('pkg_3_price',   '75.000+ ₺');
```

### Row-Level Security (RLS)
```sql
-- news_items: kullanıcı sadece kendi müşterisinin haberlerini görür
alter table nabizai.news_items enable row level security;

create policy "kullanici kendi musterisinin haberlerini gorebilir"
  on nabizai.news_items for select
  using (
    client_id in (
      select client_id from nabizai.client_users
      where user_id = auth.uid()
    )
  );

-- Aynı policy crisis_alerts için de uygulanacak
alter table nabizai.crisis_alerts enable row level security;

create policy "kullanici kendi musterisinin kriz uyarilarini gorebilir"
  on nabizai.crisis_alerts for select
  using (
    client_id in (
      select client_id from nabizai.client_users
      where user_id = auth.uid()
    )
  );
```

---

## 6. Auth Akışı

### Müşteri girişi
1. `nabizai.com/login` → e-posta + şifre
2. Supabase Auth ile doğrulama
3. `client_users` tablosundan `client_id` bulunur
4. `/dashboard` redirect — middleware korumalı
5. Tüm dashboard istekleri `client_id` ile filtrelenir (RLS)

### Admin girişi
- `/admin` route — ayrı, role bazlı
- `admin` rolüne sahip kullanıcılar tüm müşterileri görebilir
- Yeni müşteri oluşturma, kullanıcı atama, landing page düzenleme

### Middleware (`middleware.ts`)
```typescript
// Korunan routelar
const protectedRoutes = ['/dashboard', '/haberler', '/kriz', '/rakip', '/raporlar']
const adminRoutes = ['/admin']

// Auth yoksa /login'e yönlendir
// Admin route'unda role kontrolü yap
```

---

## 7. Sayfa Detayları

### 7.1 Landing Page (`/`)

**Bölümler (yukarıdan aşağı):**
1. **Navbar** — logo sol, linkler + "Giriş Yap" CTA sağ
2. **Hero** — rozet + h1 (iki satır, ikincisi #EE741D) + açıklama + 2 buton
3. **Stats bar** — 4 stat, `site_settings` tablosundan dinamik
4. **Features** — 3 özellik kartı (kriz uyarı, rakip takip, AI brifing)
5. **Pricing** — 3 paket, orta kart featured, `site_settings`'den dinamik
6. **Footer** — minimal, © nabızai 2026

**Dinamik içerik:** `site_settings` tablosundan `fetch` ile çekilir, SSG + ISR (revalidate: 3600)

### 7.2 Login (`/login`)

- Sade kart layout, beyaz zemin
- Logo üstte
- E-posta + şifre alanları
- "Şifremi unuttum" linki
- "Demo talep et" linki
- Hata mesajları inline (toast değil)
- Başarılı girişte `/dashboard` redirect

### 7.3 Dashboard (`/dashboard`)

**Bileşenler:**
- `<Sidebar>` — sol, lacivert (#233B77)
  - Logo
  - Nav items: Genel Bakış, Haberler, Kriz Takibi, Rakip Analiz, Raporlar
  - Müşteri adı alt kısımda
- `<Topbar>` — müşteri adı, tarih, canlı badge, kaynak sayısı
- `<AIBriefing>` — turuncu kutu, Claude API'den günlük özet
- `<StatGrid>` — 4 kart: haber sayısı, sosyal içerik, ton yüzdesi, kriz sayısı
- `<NewsPanel>` — son haberler, sentiment badge
- `<CrisisPanel>` — aktif uyarılar, skor
- `<PlatformChart>` — platform dağılımı bar
- `<RivalPanel>` — rakip medya aktivitesi
- `<ToneChart>` — haftalık ton bar chart
- `<KeywordsPanel>` — öne çıkan kelimeler

**Veri akışı:**
```typescript
// Her bileşen Supabase client-side fetch kullanır
// RLS otomatik olarak sadece ilgili müşteri verisini döner
const { data: news } = await supabase
  .from('news_items')
  .select('*')
  .order('published_at', { ascending: false })
  .limit(10)
```

### 7.4 Admin Panel (`/admin`)

**Sekmeler:**
- **Landing page CMS** — `site_settings` tablosu CRUD
  - Hero metinleri
  - İstatistik kartları (sayı + etiket)
  - Fiyat paketleri
  - Önizleme (iframe veya component)
- **Müşteriler** — client listesi, yeni ekle, düzenle
- **Dashboard ayarları** — her müşteri için özel keyword listesi
- **Kaynaklar** — izlenen site URL'leri

---

## 8. AI Brifing (Claude API)

Her sabah 07:00'de cron job çalışır:

```typescript
// api/cron/briefing.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

async function generateBriefing(clientId: string) {
  // Son 24 saatin haberlerini çek
  const { data: news } = await supabase
    .from('news_items')
    .select('title, source, sentiment, crisis_score')
    .eq('client_id', clientId)
    .gte('published_at', new Date(Date.now() - 86400000).toISOString())

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Sen bir medya danışmanısın. Aşağıdaki haberleri analiz et ve Türkçe, 2-3 cümle özet yaz. Sadece özeti yaz, başka hiçbir şey yazma.

Haberler:
${news?.map(n => `- ${n.title} (${n.source}, ${n.sentiment})`).join('\n')}

Odak: Bugün ne kritik? Risk var mı? Fırsat var mı?`
    }]
  })

  // Briefing'i kaydet
  await supabase.from('news_items').insert({
    client_id: clientId,
    title: 'AI Günlük Brifing',
    content: message.content[0].text,
    platform: 'ai',
    published_at: new Date().toISOString()
  })
}
```

---

## 9. Çevre Değişkenleri (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_token

# X API
X_BEARER_TOKEN=your_x_bearer_token

# Apify
APIFY_API_TOKEN=your_apify_token

# Cron güvenlik
CRON_SECRET=random_secret_string
```

---

## 10. Turborepo Yapısı

```
/
├── apps/
│   ├── besiad/          ← mevcut BESİAD projesi
│   ├── web/             ← mevcut xbodrum web
│   └── nabizai/         ← YENİ — bu proje
│       ├── app/
│       ├── components/
│       │   ├── dashboard/
│       │   ├── landing/
│       │   └── admin/
│       ├── lib/
│       │   ├── supabase.ts
│       │   └── anthropic.ts
│       ├── public/
│       │   ├── nabizai_logo.svg
│       │   ├── nabizai_logo_dark.svg
│       │   └── nabizai_icon.svg
│       └── middleware.ts
├── packages/
│   └── ui/              ← paylaşılan bileşenler (varsa)
├── turbo.json
└── package.json
```

---

## 11. Kurulum Adımları (Antigravity'de sırayla yap)

```bash
# 1. Monorepo root'unda
cd apps && mkdir nabizai && cd nabizai

# 2. Next.js kur
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"

# 3. Bağımlılıkları ekle
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk

# 4. Supabase şemasını çalıştır (nabizai şeması)
# Yukarıdaki SQL'leri Supabase Dashboard > SQL Editor'de çalıştır

# 5. .env.local oluştur ve değerleri doldur

# 6. turbo.json'a nabizai ekle
```

---

## 12. İlk Deploy Checklist

- [ ] Vercel'e bağla (`apps/nabizai` root directory)
- [ ] Env variables Vercel'e ekle
- [ ] Supabase'de `nabizai` şeması oluştur
- [ ] RLS politikalarını aktif et
- [ ] Admin kullanıcı oluştur (Supabase Auth > Users)
- [ ] `site_settings` başlangıç verilerini ekle
- [ ] nabizai.com domain Vercel'e bağla
- [ ] SSL otomatik aktif

---

## 13. Bot Entegrasyonu (xbodrum-bot)

Mevcut Python botu Supabase'e yazacak şekilde güncellenir:

```python
# xbodrum-bot/supabase_writer.py
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def save_news(client_id: str, item: dict):
    supabase.table('news_items').insert({
        'client_id': client_id,
        'title': item['title'],
        'url': item['url'],
        'source': item['source'],
        'platform': 'web',
        'content': item['content'],
        'published_at': item['date']
    }).execute()
```

Bot her çalıştığında ilgili `client_id` ile veriyi yazar. Dashboard RLS sayesinde sadece o müşteri görür.

---

## 14. Referans: Dashboard Tasarımı

Dashboard renk ve bileşen referansı:

```
Sidebar:      bg=#233B77, active border-left=#EE741D
Topbar:       bg=white, border-bottom
AI Brifing:   bg=#EE741D, text=white
Stat cards:   bg=white, border, kriz card border=#E24B4A
News items:   dot rengi: yeşil=pozitif, kırmızı=negatif, sarı=nötr
Kriz skor:    0-4=yeşil, 5-7=amber, 8-10=kırmızı
```

---

*Son güncelleme: Nisan 2026 · nabızai v1.0 · Fikret tarafından hazırlandı*
