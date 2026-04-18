export interface MuglaIlce {
  id: string;
  ad: string;
  nufus_yogunlugu: "Yuksek" | "Orta" | "Dusuk";
  anahtar_kelimeler: string[];
}

// 1. Katman: "Kılcal Damar" Filtresi (İlçe Bazlı Dinleme İstasyonları)
export const MUGLA_ILCELERI: MuglaIlce[] = [
  { id: "bodrum", ad: "Bodrum", nufus_yogunlugu: "Yuksek", anahtar_kelimeler: ["su kesintisi", "kaçak yapı", "antik tiyatro", "turizm", "marina", "trafik"] },
  { id: "fethiye", ad: "Fethiye", nufus_yogunlugu: "Yuksek", anahtar_kelimeler: ["taksi ücretleri", "ölüdeniz", "koylar", "yamaç paraşütü", "kirlilik"] },
  { id: "marmaris", ad: "Marmaris", nufus_yogunlugu: "Yuksek", anahtar_kelimeler: ["yangın riski", "ormancılık", "turizm", "kızkumu", "kruvaziyer"] },
  { id: "mentese", ad: "Menteşe", nufus_yogunlugu: "Yuksek", anahtar_kelimeler: ["merkez", "belediye", "öğrenci", "üniversite", "maliyeti", "ulaşım"] },
  { id: "milas", ad: "Milas", nufus_yogunlugu: "Yuksek", anahtar_kelimeler: ["termik santral", "zeytin", "tarım", "maden", "sit alanı"] },
  { id: "yatagan", ad: "Yatağan", nufus_yogunlugu: "Orta", anahtar_kelimeler: ["hava kalitesi", "termik santral", "tarım kooperatifi", "mermer", "kirlilik"] },
  { id: "dalaman", ad: "Dalaman", nufus_yogunlugu: "Orta", anahtar_kelimeler: ["havalimanı", "tarım", "koylar", "turizm"] },
  { id: "datca", ad: "Datça", nufus_yogunlugu: "Orta", anahtar_kelimeler: ["badem", "rüzgar", "sit alanı", "turizm", "su", "ulaşım"] },
  { id: "koycegiz", ad: "Köyceğiz", nufus_yogunlugu: "Orta", anahtar_kelimeler: ["göl", "narenciye", "arıcılık", "çevre"] },
  { id: "ortaca", ad: "Ortaca", nufus_yogunlugu: "Orta", anahtar_kelimeler: ["dalyan", "tarım", "turizm", "çevre"] },
  { id: "seydikemer", ad: "Seydikemer", nufus_yogunlugu: "Dusuk", anahtar_kelimeler: ["tarım", "kırsal kalkınma", "saklıkent", "kaza"] },
  { id: "ula", ad: "Ula", nufus_yogunlugu: "Dusuk", anahtar_kelimeler: ["akyaka", "turizm", "gelişim", "sakin şehir"] },
  { id: "kavaklidere", ad: "Kavaklıdere", nufus_yogunlugu: "Dusuk", anahtar_kelimeler: ["mermer", "ormancılık", "bakırcılık"] },
];

export function getIlceAdlari(ids: string[]): string {
  return ids.map(id => MUGLA_ILCELERI.find(i => i.id === id)?.ad).filter(Boolean).join(", ");
}
