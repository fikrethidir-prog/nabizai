-- 1. Coğrafi Hiyerarşi

-- İller (Muğla)
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- "Muğla"
  slug TEXT UNIQUE NOT NULL,   -- "mugla"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İlçeler (Bodrum, Milas, Fethiye, Marmaris vb.)
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- "Bodrum"
  slug TEXT UNIQUE NOT NULL,   -- "bodrum"
  lat NUMERIC,
  lng NUMERIC,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mahalle/Bölge (Ortakent, Yalıkavak, Gümbet vb.)
CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Taranan Kaynaklar (İlçeye Bağlı)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- "Bodrum Haber"
  url TEXT NOT NULL,
  source_type TEXT NOT NULL,         -- 'web', 'instagram', 'x', 'facebook', 'youtube', 'rss'
  scrape_config JSONB,               -- selector'lar, API keyleri ref'i, frekans vs.
  is_active BOOLEAN DEFAULT TRUE,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_district ON sources(district_id) WHERE is_active = TRUE;

-- 3. Ham Veri Havuzu (Müşteriden Bağımsız - L1)
CREATE TABLE IF NOT EXISTS raw_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id),
  district_id UUID REFERENCES districts(id),       -- hızlı filtre için denormalize
  title TEXT,
  content TEXT,
  url TEXT UNIQUE,                                  -- aynı haberi iki kez alma
  published_at TIMESTAMPTZ,
  author TEXT,
  raw_payload JSONB,                                -- orijinal scraper output
  -- AI zenginleştirme (Qwen2.5 ile doldurulacak)
  sentiment TEXT,                                   -- 'positive' | 'neutral' | 'negative'
  sentiment_score NUMERIC,
  entities JSONB,                                   -- {people:[], orgs:[], places:[]}
  topics TEXT[],
  keywords TEXT[],
  language TEXT DEFAULT 'tr',
  ai_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_district_published ON raw_mentions(district_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_keywords ON raw_mentions USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_raw_topics ON raw_mentions USING GIN(topics);

-- 4. Paket Tanımları
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 'municipality', 'hotel', 'pr_agency'
  name TEXT NOT NULL,                  -- "Belediye Paketi"
  tier TEXT NOT NULL,                  -- 'basic', 'pro', 'enterprise'
  monthly_price_tl NUMERIC,
  rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Müşteri Panelleri (L5)
CREATE TABLE IF NOT EXISTS customer_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,         -- "Bodrum Belediyesi"
  customer_type TEXT,                  -- 'municipality', 'hotel', 'pr_agency'
  package_id UUID REFERENCES packages(id),
  selected_district_ids UUID[] NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  excluded_keywords TEXT[] DEFAULT '{}',
  widget_config JSONB,
  ai_prompt_override TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Müşteriye Özel Filtrelenmiş Akış (L2 -> Müşteri)
CREATE TABLE IF NOT EXISTS customer_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_panel_id UUID REFERENCES customer_panels(id) ON DELETE CASCADE,
  raw_mention_id UUID REFERENCES raw_mentions(id) ON DELETE CASCADE,
  match_reason JSONB,                  -- {matched_keywords:[], matched_district:..., score:0.87}
  relevance_score NUMERIC,
  is_highlighted BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_panel_id, raw_mention_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_panel_date ON customer_feed(customer_panel_id, delivered_at DESC);


-- ==========================================
-- SEED DATA: MUĞLA VE İLÇELERİ (L1 BÖLGESEL)
-- ==========================================

DO $$
DECLARE
    mugla_id UUID := gen_random_uuid();
BEGIN
    -- İl
    INSERT INTO regions (id, name, slug) VALUES (mugla_id, 'Muğla', 'mugla') ON CONFLICT (slug) DO NOTHING;
    SELECT id INTO mugla_id FROM regions WHERE slug = 'mugla';

    -- İlçeler
    INSERT INTO districts (region_id, name, slug, display_order) VALUES
        (mugla_id, 'Bodrum', 'bodrum', 1),
        (mugla_id, 'Fethiye', 'fethiye', 2),
        (mugla_id, 'Marmaris', 'marmaris', 3),
        (mugla_id, 'Menteşe', 'mentese', 4),
        (mugla_id, 'Milas', 'milas', 5),
        (mugla_id, 'Datça', 'datca', 6),
        (mugla_id, 'Dalaman', 'dalaman', 7),
        (mugla_id, 'Ortaca', 'ortaca', 8),
        (mugla_id, 'Köyceğiz', 'koycegiz', 9),
        (mugla_id, 'Ula', 'ula', 10),
        (mugla_id, 'Yatağan', 'yatagan', 11),
        (mugla_id, 'Seydikemer', 'seydikemer', 12),
        (mugla_id, 'Kavaklıdere', 'kavaklidere', 13),
        (mugla_id, 'Muğla Büyükşehir Belediyesi', 'buyuksehir', 0)
    ON CONFLICT (slug) DO NOTHING;
END $$;
