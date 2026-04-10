-- =============================================
-- nabızai Supabase Schema Migration
-- 002: Seed site_settings with default landing page content
-- =============================================

INSERT INTO nabizai.site_settings (key, value) VALUES
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
  ('pkg_3_price',   '75.000+ ₺')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
