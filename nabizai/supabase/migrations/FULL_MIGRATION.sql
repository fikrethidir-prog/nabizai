-- =====================================================
-- nabızai — Birleşik Supabase Migration (v2)
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- Tarih: 2026-04-14
-- =====================================================

-- ─── 1. ŞEMA ────────────────────────────────────────
-- API Erişimi için Public şeması kullanılır

-- ─── 2. TABLOLARIN SİLİNMESİ (idempotent) ──────────
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.demo_requests CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.crisis_alerts CASCADE;
DROP TABLE IF EXISTS public.news_items CASCADE;
DROP TABLE IF EXISTS public.client_users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.web_siteleri CASCADE;

-- ─── 3. TABLOLAR ────────────────────────────────────

-- 3.1 Müşteriler
CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  plan          text DEFAULT 'izleme',
  logo_url      text,
  primary_color text DEFAULT '#233B77',
  keywords      text[],
  source_urls   text[],
  config        jsonb DEFAULT '{}',
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- 3.2 Kullanıcılar (JWT auth — Supabase Auth yerine kendi auth)
CREATE TABLE public.users (
  id            text PRIMARY KEY,
  ad            text NOT NULL,
  email         text UNIQUE NOT NULL,
  sifre_hash    text NOT NULL,
  sifre_salt    text NOT NULL,
  rol           text DEFAULT 'musteri' CHECK (rol IN ('admin', 'musteri')),
  musteri_ids   text[] DEFAULT '{}',
  aktif         boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- 3.3 Müşteri-Kullanıcı İlişkisi
CREATE TABLE public.client_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id    text REFERENCES public.users(id) ON DELETE CASCADE,
  role       text DEFAULT 'viewer',
  UNIQUE(client_id, user_id)
);

-- 3.4 Haberler
CREATE TABLE public.news_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  title           text NOT NULL,
  url             text,
  source          text,
  platform        text DEFAULT 'web',
  content         text,
  category        text,
  tags            text[],
  ai_summary      text,
  image_url       text,
  sentiment       text,
  sentiment_score float,
  risk_level      text DEFAULT 'low',
  risk_reason     text,
  crisis_score    float DEFAULT 0,
  keywords        text[],
  status          text DEFAULT 'new',
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- 3.5 Kriz Uyarıları
CREATE TABLE public.crisis_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  topic        text NOT NULL,
  score        float,
  source_count int DEFAULT 1,
  sources      text[],
  status       text DEFAULT 'active',
  created_at   timestamptz DEFAULT now()
);

-- 3.6 Site Ayarları (Landing Page CMS)
CREATE TABLE public.site_settings (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

-- 3.7 Demo Talepleri
CREATE TABLE public.demo_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad          text NOT NULL,
  email       text NOT NULL,
  sirket      text,
  telefon     text,
  mesaj       text,
  durum       text DEFAULT 'yeni' CHECK (durum IN ('yeni', 'iletisime_gecildi', 'demo_yapildi', 'musteri_oldu')),
  notlar      text,
  created_at  timestamptz DEFAULT now()
);

-- 3.8 Web Siteleri (Takip edilecek haber kaynakları)
CREATE TABLE public.web_siteleri (
  id            text PRIMARY KEY,
  ad            text NOT NULL,
  url           text NOT NULL,
  feed_url      text DEFAULT '',
  yayin_merkezi text DEFAULT '',
  il            text DEFAULT 'Muğla',
  ilce          text DEFAULT '',
  tur           text DEFAULT 'yerel_haber',
  aktif         boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.web_siteleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "web_siteleri_service_role" ON public.web_siteleri FOR ALL USING (true);

-- 3.9 İşlem Logları
CREATE TABLE public.logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id  text,
  ad            text,
  rol           text,
  eylem         text NOT NULL,
  detay         jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

-- ─── 4. İNDEXLER ────────────────────────────────────
CREATE INDEX idx_news_client_id ON public.news_items(client_id);
CREATE INDEX idx_news_created_at ON public.news_items(created_at DESC);
CREATE INDEX idx_news_risk_level ON public.news_items(risk_level);
CREATE INDEX idx_news_source ON public.news_items(source);
CREATE INDEX idx_news_published ON public.news_items(published_at DESC);
CREATE INDEX idx_crisis_client_id ON public.crisis_alerts(client_id);
CREATE INDEX idx_crisis_status ON public.crisis_alerts(status);
CREATE INDEX idx_client_users_user ON public.client_users(user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_logs_created ON public.logs(created_at DESC);
CREATE INDEX idx_demo_created ON public.demo_requests(created_at DESC);

-- ─── 5. RLS (Row-Level Security) ────────────────────
-- Not: Service role key RLS'i bypass eder.
-- Tüm veri erişimi server-side API routes üzerinden filtrelenir.

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_service_role" ON public.news_items FOR ALL USING (true);

ALTER TABLE public.crisis_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crisis_service_role" ON public.crisis_alerts FOR ALL USING (true);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_service_role" ON public.clients FOR ALL USING (true);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_service_role" ON public.site_settings FOR ALL USING (true);

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_users_service_role" ON public.client_users FOR ALL USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_service_role" ON public.users FOR ALL USING (true);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_service_role" ON public.demo_requests FOR ALL USING (true);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_service_role" ON public.logs FOR ALL USING (true);

-- ─── 6. SEED DATA ───────────────────────────────────

-- Site ayarları
INSERT INTO public.site_settings (key, value) VALUES
  ('badge_text',   'Canlı izleme · 26 kaynak + sosyal medya'),
  ('hero_title_1', 'Yerel medyanın'),
  ('hero_title_2', 'nabzı'),
  ('hero_desc',    'Yerel haberler, sosyal medya ve rakip analizi tek ekranda. Kriz öncesi sizi uyarır, fırsatları kaçırmazsınız.'),
  ('stat_1_n',     '26+'),
  ('stat_1_l',     'yerel kaynak'),
  ('stat_2_n',     '4'),
  ('stat_2_l',     'sosyal platform'),
  ('stat_3_n',     '30dk'),
  ('stat_3_l',     'güncelleme sıklığı'),
  ('stat_4_n',     'AI'),
  ('stat_4_l',     'destekli analiz'),
  ('pkg_1_name',   'İzleme'),
  ('pkg_2_name',   'Radar Pro'),
  ('pkg_3_name',   'İstihbarat')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Admin kullanıcı (şifre: admin123 — SHA256(salt + sifre))
INSERT INTO public.users (id, ad, email, sifre_hash, sifre_salt, rol, musteri_ids) VALUES
  ('admin-001', 'Admin', 'admin@public.com',
   'dd7c05a08ef66272b4b9c3f6e71b9e99a6828775a3a00e3c0dd4ce337b035d16',
   'nabizai2026salt', 'admin', '{}')
ON CONFLICT (id) DO NOTHING;

-- Varsayılan müşteri
INSERT INTO public.clients (id, name, slug, plan, keywords, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'xBodrum Demo', 'xbodrum-demo', 'istihbarat',
   ARRAY['bodrum', 'belediye', 'turizm', 'mugla'], true)
ON CONFLICT (id) DO NOTHING;

-- ─── 7. YARDIMCI FONKSİYONLAR ──────────────────────

-- İstatistik fonksiyonu
CREATE OR REPLACE FUNCTION public.get_news_stats(p_client_id uuid DEFAULT NULL)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total', (SELECT count(*) FROM public.news_items WHERE (p_client_id IS NULL OR client_id = p_client_id)),
    'today', (SELECT count(*) FROM public.news_items WHERE (p_client_id IS NULL OR client_id = p_client_id) AND created_at >= CURRENT_DATE),
    'high_risk', (SELECT count(*) FROM public.news_items WHERE (p_client_id IS NULL OR client_id = p_client_id) AND risk_level = 'high'),
    'medium_risk', (SELECT count(*) FROM public.news_items WHERE (p_client_id IS NULL OR client_id = p_client_id) AND risk_level = 'medium')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ✅ Migration v2 tamamlandı!
-- Tablolar: clients, users, client_users, news_items,
--           crisis_alerts, site_settings, demo_requests, logs
-- =====================================================
