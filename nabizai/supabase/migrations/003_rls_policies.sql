-- =============================================
-- nabızai Supabase Schema Migration
-- 003: Enable Row-Level Security (RLS) policies
-- =============================================

-- news_items: kullanıcı sadece kendi müşterisinin haberlerini görür
ALTER TABLE nabizai.news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_musterisinin_haberlerini_gorebilir"
  ON nabizai.news_items FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM nabizai.client_users
      WHERE user_id = auth.uid()
    )
  );

-- crisis_alerts: kullanıcı sadece kendi müşterisinin kriz uyarılarını görür
ALTER TABLE nabizai.crisis_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_musterisinin_kriz_uyarilarini_gorebilir"
  ON nabizai.crisis_alerts FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM nabizai.client_users
      WHERE user_id = auth.uid()
    )
  );

-- clients: kullanıcı sadece kendi müşterisini görür
ALTER TABLE nabizai.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_musterisini_gorebilir"
  ON nabizai.clients FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM nabizai.client_users
      WHERE user_id = auth.uid()
    )
  );

-- site_settings: herkes okuyabilir (landing page içeriği)
ALTER TABLE nabizai.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "herkes_siteyi_okuyabilir"
  ON nabizai.site_settings FOR SELECT
  USING (true);

-- client_users: kullanıcı sadece kendi kaydını görür
ALTER TABLE nabizai.client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_kaydini_gorebilir"
  ON nabizai.client_users FOR SELECT
  USING (user_id = auth.uid());
