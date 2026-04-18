/**
 * Paket bazlı özellik tanımları ve varsayılan değerler.
 * Wizard bu dosyayı kullanarak adımları otomatik konfigüre eder.
 */

export type PaketId = "izleme" | "radar_pro" | "istihbarat";

export interface PaketTanim {
  id: PaketId;
  ad: string;
  hedefKitle: string;
  renk: string;
  vurgu: boolean;
  ozellikler: Record<string, boolean>;
  maxSosyalMedya: number;          // kaç platform seçilebilir
  minTaramaSikligi: number;        // dk cinsinden minimum
  varsayilan: {
    tarama_sikligi_dk: number;
    kriz_esigi: number;
    email_saati: string;
    ai_brifing_saati: string;
    sosyal_platformlar: string[];
  };
}

export const PAKETLER: Record<PaketId, PaketTanim> = {
  izleme: {
    id: "izleme",
    ad: "İzleme",
    hedefKitle: "Küçük işletme, AVM, marina",
    renk: "nabiz-navy",
    vurgu: false,
    maxSosyalMedya: 2,
    minTaramaSikligi: 60,
    ozellikler: {
      haber_takibi: true,
      sosyal_medya: true,
      gunluk_email: true,
      web_dashboard: true,
      haftalik_pdf: true,
      rakip_takibi: false,
      telegram_alarm: false,
      ai_yorum: false,
      duygu_analizi: false,
      kriz_erken_uyari: false,
      aylik_rapor: false,
      whatsapp_kanal: false,
      ai_brifing: false,
      ozel_kaynak: false,
      ozel_dashboard: false,
    },
    varsayilan: {
      tarama_sikligi_dk: 60,
      kriz_esigi: 6,
      email_saati: "09:00",
      ai_brifing_saati: "08:00",
      sosyal_platformlar: [],
    },
  },

  radar_pro: {
    id: "radar_pro",
    ad: "Radar Pro",
    hedefKitle: "Otel grubu, belediye, büyük marka",
    renk: "nabiz-orange",
    vurgu: true,
    maxSosyalMedya: 5,
    minTaramaSikligi: 30,
    ozellikler: {
      haber_takibi: true,
      sosyal_medya: true,
      gunluk_email: true,
      web_dashboard: true,
      haftalik_pdf: true,
      rakip_takibi: true,
      telegram_alarm: true,
      ai_yorum: true,
      duygu_analizi: true,
      kriz_erken_uyari: true,
      aylik_rapor: true,
      whatsapp_kanal: false,
      ai_brifing: false,
      ozel_kaynak: false,
      ozel_dashboard: false,
    },
    varsayilan: {
      tarama_sikligi_dk: 30,
      kriz_esigi: 5,
      email_saati: "08:00",
      ai_brifing_saati: "07:30",
      sosyal_platformlar: ["twitter", "instagram", "facebook"],
    },
  },

  istihbarat: {
    id: "istihbarat",
    ad: "İstihbarat",
    hedefKitle: "Belediye başkanlığı, siyasi danışman, büyük resort",
    renk: "purple",
    vurgu: false,
    maxSosyalMedya: 5,
    minTaramaSikligi: 30,
    ozellikler: {
      haber_takibi: true,
      sosyal_medya: true,
      gunluk_email: true,
      web_dashboard: true,
      haftalik_pdf: true,
      rakip_takibi: true,
      telegram_alarm: true,
      ai_yorum: true,
      duygu_analizi: true,
      kriz_erken_uyari: true,
      aylik_rapor: true,
      whatsapp_kanal: true,
      ai_brifing: true,
      ozel_kaynak: true,
      ozel_dashboard: true,
    },
    varsayilan: {
      tarama_sikligi_dk: 30,
      kriz_esigi: 4,
      email_saati: "07:00",
      ai_brifing_saati: "07:00",
      sosyal_platformlar: ["twitter", "instagram", "facebook", "youtube", "tiktok"],
    },
  },
};

// Hangi paketin hangi özelliğe sahip olduğu etiket için
export const OZELLIK_PAKET_GEREKSINIM: Record<string, PaketId> = {
  rakip_takibi:    "radar_pro",
  telegram_alarm:  "radar_pro",
  ai_yorum:        "radar_pro",
  duygu_analizi:   "radar_pro",
  kriz_erken_uyari:"radar_pro",
  aylik_rapor:     "radar_pro",
  whatsapp_kanal:  "istihbarat",
  ai_brifing:      "istihbarat",
  ozel_kaynak:     "istihbarat",
  ozel_dashboard:  "istihbarat",
};

export const PAKET_SIRA: PaketId[] = ["izleme", "radar_pro", "istihbarat"];

export function paketIzinVeriyor(aktifPaket: PaketId, ozellik: string): boolean {
  const gerekli = OZELLIK_PAKET_GEREKSINIM[ozellik];
  if (!gerekli) return true; // Her pakette var
  return PAKET_SIRA.indexOf(aktifPaket) >= PAKET_SIRA.indexOf(gerekli);
}

// ── Sabit listeler ────────────────────────────────────────────

// Web siteleri artık data/web_siteleri.json dosyasından yönetilir
// Admin panelinden Excel/CSV ile toplu yükleme yapılabilir
// Bu sabit sadece geriye uyumluluk için boş bırakılmıştır
export const HABER_KAYNAKLARI: { id: string; ad: string; url: string }[] = [];

export const SOSYAL_PLATFORMLAR = [
  { id: "twitter",   ad: "Twitter / X",  ikon: "𝕏" },
  { id: "instagram", ad: "Instagram",    ikon: "📸" },
  { id: "facebook",  ad: "Facebook",     ikon: "🔵" },
  { id: "youtube",   ad: "YouTube",      ikon: "▶️" },
  { id: "tiktok",    ad: "TikTok",       ikon: "🎵" },
];

export const KATEGORILER = [
  { id: "belediye",   ad: "Belediye & Yönetim" },
  { id: "turizm",     ad: "Turizm & Konaklama" },
  { id: "altyapi",    ad: "Altyapı & Ulaşım" },
  { id: "kultur",     ad: "Kültür & Sanat" },
  { id: "spor",       ad: "Spor" },
  { id: "cevre",      ad: "Çevre & Doğa" },
  { id: "siyaset",    ad: "Siyaset" },
  { id: "ekonomi",    ad: "Ekonomi & İş Dünyası" },
  { id: "saglik",     ad: "Sağlık" },
  { id: "egitim",     ad: "Eğitim" },
  { id: "asayis",     ad: "Asayiş & Güvenlik" },
  { id: "denizcilik", ad: "Denizcilik & Marina" },
  { id: "insaat",     ad: "İnşaat & Emlak" },
  { id: "tarim",      ad: "Tarım & Balıkçılık" },
];
