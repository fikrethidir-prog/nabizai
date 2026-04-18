import { PaketId } from './paketConfig';

export type MusteriTipi = 'belediye' | 'otel' | 'medya';

export type WidgetType =
  | 'haberler'
  | 'duygu_analizi'
  | 'kriz_takip'
  | 'kriz_momentum'
  | 'rakip_analizi'
  | 'sosyal_medya'
  | 'raporlar'
  | 'ai_brifing'
  | 'yayin_politikasi';

export type WidgetPermissions = Record<WidgetType, boolean>;

export interface MusteriPanel {
  id: string;
  musteriAd: string;
  sektor: string;
  il: string;
  paket: PaketId;
  musteri_tipi: MusteriTipi;
  widget_permissions: WidgetPermissions;
  kategoriler: string[];
  anahtar_kelimeler: string[];
  haric_kelimeler: string[];
  haber_kaynaklari: string[];
  sosyal_medya: Record<string, { aktif: boolean; hesap?: string }>;
  tarama_sikligi_dk: number;
  kriz_esigi: number;
  bildirimler: {
    telegram?: { aktif: boolean; chatId?: string };
    whatsapp?: { aktif: boolean; numara?: string };
  };
  raporlama: {
    gunluk_email: boolean;
    haftalik_pdf: boolean;
    aylik_rapor: boolean;
    email_saati?: string;
  };
  ai: {
    duygu_analizi: boolean;
    kriz_erken_uyari: boolean;
    ai_yorum: boolean;
    ai_brifing: boolean;
    brifing_saati?: string;
  };
  aktif: boolean;
  olusturulmaTarihi: string;
  email?: string;
}

export const ALL_WIDGET_TYPES: WidgetType[] = [
  'haberler', 'duygu_analizi', 'kriz_takip', 'kriz_momentum',
  'rakip_analizi', 'sosyal_medya', 'raporlar', 'ai_brifing', 'yayin_politikasi',
];
