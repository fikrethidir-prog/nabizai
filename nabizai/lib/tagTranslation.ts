/**
 * Python agent'ın ürettiği İngilizce etiketleri Türkçe'ye çevirir.
 * Format: "prefix:value"  →  "Türkçe Prefix: Türkçe Değer"
 */

const PREFIX_MAP: Record<string, string> = {
  location:      "Konum",
  topic:         "Konu",
  infrastructure:"Altyapı",
  industry:      "Sektör",
  institution:   "Kurum",
  person:        "Kişi",
  issue:         "Sorun",
  event:         "Etkinlik",
  entity:        "Varlık",
  org:           "Kuruluş",
  service:       "Hizmet",
  environment:   "Çevre",
  politics:      "Siyaset",
  economy:       "Ekonomi",
  social:        "Sosyal",
  media:         "Medya",
};

const VALUE_MAP: Record<string, string> = {
  // infrastructure
  water:           "Su",
  road:            "Yol",
  energy:          "Enerji",
  electricity:     "Elektrik",
  sewage:          "Kanalizasyon",
  construction:    "İnşaat",
  transport:       "Ulaşım",
  internet:        "İnternet",
  parking:         "Otopark",

  // topic
  accident:        "Kaza",
  fire:            "Yangın",
  flood:           "Sel",
  crime:           "Suç",
  protest:         "Protesto",
  election:        "Seçim",
  health:          "Sağlık",
  education:       "Eğitim",
  sports:          "Spor",
  culture:         "Kültür",
  event:           "Etkinlik",
  festival:        "Festival",
  environment:     "Çevre",
  nature:          "Doğa",
  safety:          "Güvenlik",
  denizcilik:      "Denizcilik",
  altyapı_onarması:"Altyapı Onarımı",
  yol_kalitesi:    "Yol Kalitesi",

  // industry
  tourism:         "Turizm",
  hotel:           "Otel",
  restaurant:      "Restoran",
  season:          "Sezon",
  agriculture:     "Tarım",
  fishing:         "Balıkçılık",
  retail:          "Perakende",
  real_estate:     "Gayrimenkul",

  // institution
  municipality:    "Belediye",
  hospital:        "Hastane",
  university:      "Üniversite",
  school:          "Okul",
  police:          "Emniyet",
  court:           "Mahkeme",
  ministry:        "Bakanlık",
  xbodrum:         "xBodrum",

  // person
  mayor:           "Belediye Başkanı",
  governor:        "Vali",
  minister:        "Bakan",
  mp:              "Milletvekili",

  // location (yaygın yerler)
  bodrum:          "Bodrum",
  mugla:           "Muğla",
  muğla:           "Muğla",
  milas:           "Milas",
  fethiye:         "Fethiye",
  marmaris:        "Marmaris",
  datca:           "Datça",
  datça:           "Datça",
  turkey:          "Türkiye",
  aegean:          "Ege",
  burgutreis:      "Turgutreis",
  turgutreis:      "Turgutreis",

  // generic
  unknown:         "Bilinmeyen",
  other:           "Diğer",
  general:         "Genel",
};

/**
 * Tek etiketi Türkçe'ye çevirir.
 * "infrastructure:water" → "Altyapı: Su"
 * "location:Bodrum"      → "Konum: Bodrum"
 * "sadece_kelime"        → "Sadece Kelime"
 */
export function translateTag(raw: string): string {
  const lower = raw.toLowerCase();

  if (raw.includes(":")) {
    const [prefix, value] = raw.split(":", 2);
    const trPrefix = PREFIX_MAP[prefix.toLowerCase()] || capitalize(prefix);
    const trValue  = VALUE_MAP[value.toLowerCase()] || capitalize(value.replace(/_/g, " "));
    return `${trPrefix}: ${trValue}`;
  }

  return VALUE_MAP[lower] || capitalize(raw.replace(/_/g, " "));
}

/**
 * Etiket listesini Türkçe'ye çevirir, tekrarları atar.
 */
export function translateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of tags) {
    const tr = translateTag(t);
    if (!seen.has(tr)) {
      seen.add(tr);
      result.push(tr);
    }
  }
  return result;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
