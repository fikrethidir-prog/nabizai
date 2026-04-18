import type { MusteriTipi, WidgetType, WidgetPermissions } from './types';
import type { PaketId } from './paketConfig';

export interface WidgetTanim {
  id: WidgetType;
  ad: string;
  ikon: string;
  aciklama: string;
  kategori: 'temel' | 'analiz' | 'raporlama' | 'ozel';
  minPaket: PaketId;
  colSpan?: number; // grid sütun genişliği (varsayılan 1)
}

export const WIDGET_TANIMLARI: WidgetTanim[] = [
  { id: 'haberler',          ad: 'Haberler',              ikon: '📰', aciklama: 'Son haberler ve risk durumu',           kategori: 'temel',     minPaket: 'izleme',     colSpan: 2 },
  { id: 'duygu_analizi',     ad: 'Duygu Analizi',         ikon: '💬', aciklama: 'Pozitif/negatif/nötr dağılımı',         kategori: 'analiz',    minPaket: 'radar_pro'   },
  { id: 'kriz_takip',        ad: 'Kriz Takip',            ikon: '🚨', aciklama: 'Aktif kriz uyarıları',                  kategori: 'temel',     minPaket: 'izleme',     colSpan: 2 },
  { id: 'kriz_momentum',     ad: 'Kriz Momentum',         ikon: '📈', aciklama: 'Hız × kaynak × duygu momentum skoru',   kategori: 'analiz',    minPaket: 'radar_pro'   },
  { id: 'rakip_analizi',     ad: 'Rakip Analizi',         ikon: '🏁', aciklama: 'Rakip kaynak karşılaştırması',           kategori: 'analiz',    minPaket: 'radar_pro'   },
  { id: 'sosyal_medya',      ad: 'Sosyal Medya',          ikon: '📱', aciklama: 'Sosyal medya gönderileri',               kategori: 'temel',     minPaket: 'izleme'      },
  { id: 'raporlar',          ad: 'Raporlar',              ikon: '📄', aciklama: 'PDF rapor listesi ve indirme',           kategori: 'raporlama', minPaket: 'izleme'      },
  { id: 'ai_brifing',        ad: 'AI Günlük Brifing',     ikon: '🤖', aciklama: 'AI tarafından üretilen günlük brifing',  kategori: 'ozel',      minPaket: 'istihbarat'  },
  { id: 'yayin_politikasi',  ad: 'Yayın Politikası',      ikon: '⚖️', aciklama: 'Kaynak bazlı önyargı skoru',             kategori: 'ozel',      minPaket: 'istihbarat'  },
];

export interface MusteriTipiTanim {
  id: MusteriTipi;
  ad: string;
  ikon: string;
  aciklama: string;
}

export const MUSTERI_TIPLERI: MusteriTipiTanim[] = [
  { id: 'belediye', ad: 'Belediye & Kamu',   ikon: '🏛️', aciklama: 'Belediye, valilik, kamu kurumu' },
  { id: 'otel',     ad: 'Otel & Turizm',     ikon: '🏨', aciklama: 'Otel, resort, marina, AVM' },
  { id: 'medya',    ad: 'Medya & Kurumsal',   ikon: '📡', aciklama: 'PR ajansı, medya kuruluşu, büyük marka' },
];

export const VARSAYILAN_WIDGETLAR: Record<MusteriTipi, WidgetPermissions> = {
  belediye: {
    haberler: true, duygu_analizi: true, kriz_takip: true, kriz_momentum: true,
    rakip_analizi: false, sosyal_medya: true, raporlar: true, ai_brifing: true, yayin_politikasi: true,
  },
  otel: {
    haberler: true, duygu_analizi: true, kriz_takip: false, kriz_momentum: false,
    rakip_analizi: true, sosyal_medya: true, raporlar: true, ai_brifing: false, yayin_politikasi: false,
  },
  medya: {
    haberler: true, duygu_analizi: true, kriz_takip: true, kriz_momentum: true,
    rakip_analizi: true, sosyal_medya: true, raporlar: true, ai_brifing: true, yayin_politikasi: true,
  },
};

export function getDefaultWidgets(tip: MusteriTipi): WidgetPermissions {
  return { ...VARSAYILAN_WIDGETLAR[tip] };
}
