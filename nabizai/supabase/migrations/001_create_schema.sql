-- =============================================
-- nabızai Supabase Schema Migration
-- 001: Create nabizai schema and core tables
-- =============================================

-- Schema oluştur
CREATE SCHEMA IF NOT EXISTS nabizai;

-- =============================================
-- 1. clients tablosu — Müşteriler
-- =============================================
CREATE TABLE nabizai.clients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,                    -- "Bodrum AVM"
  slug        text UNIQUE NOT NULL,             -- "bodrum-avm"
  plan        text DEFAULT 'izleme',            -- izleme | radar_pro | istihbarat
  logo_url    text,
  primary_color text DEFAULT '#233B77',
  keywords    text[],                           -- ['bodrum avm', 'otopark', 'kira']
  source_urls text[],                           -- izlenecek ek siteler
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- =============================================
-- 2. client_users tablosu — Müşteri–Kullanıcı ilişkisi
-- =============================================
CREATE TABLE nabizai.client_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid REFERENCES nabizai.clients(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text DEFAULT 'viewer',             -- viewer | admin
  UNIQUE(client_id, user_id)
);

-- =============================================
-- 3. news_items tablosu — Haberler
-- =============================================
CREATE TABLE nabizai.news_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES nabizai.clients(id) ON DELETE CASCADE,
  title        text NOT NULL,
  url          text,
  source       text,                            -- "bodrumgundem.com"
  platform     text DEFAULT 'web',              -- web | instagram | twitter | facebook
  content      text,
  sentiment    text,                            -- positive | negative | neutral
  sentiment_score float,                        -- -1.0 ile 1.0 arası
  crisis_score float DEFAULT 0,                 -- 0-10 arası
  keywords     text[],
  published_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- =============================================
-- 4. crisis_alerts tablosu — Kriz Uyarıları
-- =============================================
CREATE TABLE nabizai.crisis_alerts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES nabizai.clients(id) ON DELETE CASCADE,
  topic        text NOT NULL,                   -- "Otopark şikayeti yayılıyor"
  score        float,                           -- 0-10
  source_count int DEFAULT 1,
  sources      text[],
  status       text DEFAULT 'active',           -- active | resolved | dismissed
  created_at   timestamptz DEFAULT now()
);

-- =============================================
-- 5. site_settings tablosu — Landing Page CMS
-- =============================================
CREATE TABLE nabizai.site_settings (
  key   text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);
