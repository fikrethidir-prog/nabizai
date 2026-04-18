#!/usr/bin/env python3
"""
seed_web_siteleri.py — Haber sitelerini Supabase'e toplu ekler
ve mevcut müşterilerin source_urls'lerini düzeltir.

Çalıştırma:
    python src/seed_web_siteleri.py
"""

import os, sys, json
import requests

SB_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://dayuexgbakcvvkhdrmhe.supabase.co")
SB_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

def sb_upsert(table: str, rows: list) -> dict:
    r = requests.post(
        f"{SB_URL}/rest/v1/{table}",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=rows, timeout=30
    )
    return r

def sb_get(table: str, params: str = "") -> list:
    r = requests.get(f"{SB_URL}/rest/v1/{table}?{params}", headers=HEADERS, timeout=15)
    return r.json() if r.ok else []

def sb_patch(table: str, eq_field: str, eq_val: str, data: dict):
    r = requests.patch(
        f"{SB_URL}/rest/v1/{table}?{eq_field}=eq.{eq_val}",
        headers=HEADERS, json=data, timeout=15
    )
    return r

# ─────────────────────────────────────────────────────────────────────
# Site kataloğu — (url, ad, il, ilce, tur)
# tur: yerel_haber | ulusal_haber | ajans | belediye | tv | turizm | diger
# ─────────────────────────────────────────────────────────────────────
SITELER = [
    # ── BODRUM ───────────────────────────────────────────────────────
    ("https://anterhaber.com",            "Anter Haber",            "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumca.com",              "Bodrum'ca",              "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumcity.com",            "Bodrum City",            "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumdabugun.com",         "Bodrum'da Bugün",        "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumekspres.com.tr",      "Bodrum Ekspres",         "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumgundem.com",          "Bodrum Gündem",          "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumhaber.com",           "Bodrum Haber",           "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumhaber48.com",         "Bodrum Haber 48",        "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumhabermerkezi.com",    "Bodrum Haber Merkezi",   "Muğla", "bodrum",      "yerel_haber"),
    ("https://bodrumobserver.com",        "Bodrum Observer",        "Muğla", "bodrum",      "yerel_haber"),
    ("https://cokertme.com",              "Cokertme",               "Muğla", "bodrum",      "yerel_haber"),
    ("https://haberbodrumgazetesi.com",   "Haber Bodrum Gazetesi",  "Muğla", "bodrum",      "yerel_haber"),
    ("https://kenttv.net",                "Kent TV",                "Muğla", "bodrum",      "tv"),
    ("https://yarimadagazetesi.com",      "Yarımada Gazetesi",      "Muğla", "bodrum",      "yerel_haber"),
    ("https://yachtmarin.com",            "Yachtmarin",             "Muğla", "bodrum",      "turizm"),
    ("https://bodexyachting.com",         "Bodex Yachting",         "Muğla", "bodrum",      "turizm"),
    ("https://bodto.org.tr",              "BODTO",                  "Muğla", "bodrum",      "diger"),
    ("https://dogrumedyatv.com.tr",       "Doğru Medya TV",         "Muğla", "bodrum",      "tv"),

    # ── FETHİYE ──────────────────────────────────────────────────────
    ("https://fethiyedenhaber.com",       "Fethiye'den Haber",      "Muğla", "fethiye",     "yerel_haber"),
    ("https://gercekfethiye.com",         "Gerçek Fethiye",         "Muğla", "fethiye",     "yerel_haber"),

    # ── MARMARİS ─────────────────────────────────────────────────────
    ("https://marmaris.bel.tr",           "Marmaris Belediyesi",    "Muğla", "marmaris",    "belediye"),
    ("https://marmaristurk.com.tr",       "Marmaris Türk",          "Muğla", "marmaris",    "yerel_haber"),
    ("https://aktuelmarmarisi.com",       "Aktüel Marmaris",        "Muğla", "marmaris",    "yerel_haber"),

    # ── DATÇA ────────────────────────────────────────────────────────
    ("https://datca-haber.com",           "Datça Haber",            "Muğla", "datca",       "yerel_haber"),

    # ── SEYDİKEMER ───────────────────────────────────────────────────
    ("https://seydikemerhaberleri.com",   "Seydikemer Haberleri",   "Muğla", "seydikemer",  "yerel_haber"),

    # ── MİLAS ────────────────────────────────────────────────────────
    ("https://milasdogusgazetesi.com",    "Milas Doğuş Gazetesi",   "Muğla", "milas",       "yerel_haber"),

    # ── MUĞLA GENEL ──────────────────────────────────────────────────
    ("https://muglahaber.com",            "Muğla Haber",            "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://hamlegazetesi.com.tr",      "Hamle Gazetesi",         "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://mentese.bel.tr",            "Menteşe Belediyesi",     "Muğla", "mentese",     "belediye"),
    ("https://tv48.com.tr",               "TV48",                   "Muğla", "buyuksehir",  "tv"),
    ("https://haber48.com.tr",            "Haber48",                "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://son48saat.com",             "Son 48 Saat",            "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://guneyege.net",              "Güney Ege",              "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://turizmguncel.com",          "Turizm Güncel",          "Muğla", "buyuksehir",  "turizm"),
    ("https://yuzhaber.com",              "Yüz Haber",              "Muğla", "buyuksehir",  "yerel_haber"),
    ("https://superonline.com",           "Superonline",            "Muğla", "buyuksehir",  "diger"),

    # ── EGE BÖLGESİ ──────────────────────────────────────────────────
    ("https://egeajans.com",              "Ege Ajans",              "Muğla", "",            "ajans"),
    ("https://egedenhaber.com.tr",        "Ege'den Haber",          "Muğla", "",            "yerel_haber"),
    ("https://egedesonsoz.com",           "Ege'de Son Söz",         "Muğla", "",            "yerel_haber"),
    ("https://egesaati.com",              "Ege Saati",              "Muğla", "",            "yerel_haber"),
    ("https://egesondakika.com",          "Ege Sondakika",          "Muğla", "",            "yerel_haber"),
    ("https://egetv.com.tr",              "Ege TV",                 "Muğla", "",            "tv"),
    ("https://gazeteyenigun.com.tr",      "Gazete Yeni Gün",        "Muğla", "",            "yerel_haber"),
    ("https://igfhaber.com",              "IGF Haber",              "Muğla", "",            "yerel_haber"),

    # ── ULUSAL / AJANS ────────────────────────────────────────────────
    ("https://aa.com.tr",                 "Anadolu Ajansı",         "",      "",            "ajans"),
    ("https://dha.com.tr",                "DHA",                    "",      "",            "ajans"),
    ("https://iha.com.tr",                "İHA",                    "",      "",            "ajans"),
    ("https://ntv.com.tr",                "NTV",                    "",      "",            "ulusal_haber"),
    ("https://hurriyet.com.tr",           "Hürriyet",               "",      "",            "ulusal_haber"),
    ("https://cumhuriyet.com.tr",         "Cumhuriyet",             "",      "",            "ulusal_haber"),
    ("https://sozcu.com.tr",              "Sözcü",                  "",      "",            "ulusal_haber"),
    ("https://posta.com.tr",              "Posta",                  "",      "",            "ulusal_haber"),
    ("https://haberler.com",              "Haberler.com",           "",      "",            "ulusal_haber"),
    ("https://hibya.com",                 "Hibya",                  "",      "",            "ajans"),
    ("https://trt.net.tr",                "TRT",                    "",      "",            "ulusal_haber"),
    ("https://dunya.com",                 "Dünya",                  "",      "",            "ulusal_haber"),

    # ── DİĞER / GENEL ─────────────────────────────────────────────────
    ("https://abtajans.com",              "ABT Ajans",              "",      "",            "ajans"),
    ("https://ats.gen.tr",                "ATS",                    "",      "",            "diger"),
    ("https://aydindenge.com.tr",         "Aydın Denge",            "Aydın", "",            "yerel_haber"),
    ("https://bba.tv",                    "BBA TV",                 "",      "",            "tv"),
    ("https://belediyedeniz.com",         "Belediye Deniz",         "",      "",            "diger"),
    ("https://belediyegundemtv.com.tr",   "Belediye Gündem TV",     "",      "",            "tv"),
    ("https://belediyehaber.net",         "Belediye Haber",         "",      "",            "diger"),
    ("https://benimkentim.com.tr",        "Benim Kentim",           "",      "",            "yerel_haber"),
    ("https://bereket.tv",                "Bereket TV",             "",      "",            "tv"),
    ("https://byegm.gov.tr",              "BYEGİM",                 "",      "",            "diger"),
    ("https://cagatlatan.com",            "Çağatla Tan",            "",      "",            "diger"),
    ("https://ciftcitv.com",              "Çiftçi TV",              "",      "",            "tv"),
    ("https://drttv.com.tr",              "DRT TV",                 "",      "",            "tv"),
    ("https://erdakilicfriends.net",      "Erdakılıç",              "",      "",            "diger"),
    ("https://ergun.biz",                 "Ergün",                  "",      "",            "diger"),
    ("https://gazetesah.com",             "Gazete Şah",             "",      "",            "yerel_haber"),
    ("https://haberankara.com",           "Haber Ankara",           "Ankara","",            "yerel_haber"),
    ("https://haberekspres.com.tr",       "Haber Ekspres",          "",      "",            "yerel_haber"),
    ("https://haberlerankara.com",        "Haberler Ankara",        "Ankara","",            "yerel_haber"),
    ("https://herseyhaber.net",           "Her Şey Haber",          "",      "",            "yerel_haber"),
    ("https://isnet.net.tr",              "İsnet",                  "",      "",            "diger"),
    ("https://izmirgazetesi.com.tr",      "İzmir Gazetesi",         "İzmir", "",            "yerel_haber"),
    ("https://izmirsocial.net",           "İzmir Social",           "İzmir", "",            "yerel_haber"),
    ("https://kanalben.com",              "Kanal Ben",              "",      "",            "tv"),
    ("https://magazinci.com",             "Magazinci",              "",      "",            "diger"),
    ("https://manisaturk.com",            "Manisa Türk",            "Manisa","",            "yerel_haber"),
    ("https://medyaankara.com",           "Medya Ankara",           "Ankara","",            "yerel_haber"),
    ("https://medyabaskent.com",          "Medya Başkent",          "Ankara","",            "yerel_haber"),
    ("https://oncevatan.com.tr",          "Önce Vatan",             "",      "",            "ulusal_haber"),
    ("https://pirtur.com.tr",             "Pirtur",                 "",      "",            "diger"),
    ("https://sadim.com.tr",              "Sadım",                  "",      "",            "diger"),
    ("https://seffafbelediyecilik.com",   "Şeffaf Belediyecilik",   "",      "",            "diger"),
    ("https://solarlife.com.tr",          "Solar Life",             "",      "",            "diger"),
    ("https://soz12.com",                 "Söz12",                  "",      "",            "yerel_haber"),
    ("https://timsahajans.com.tr",        "Timsah Ajans",           "",      "",            "ajans"),
    ("https://tvden.com.tr",              "TVden",                  "",      "",            "tv"),
    ("https://yenibakis.com.tr",          "Yeni Bakış",             "",      "",            "yerel_haber"),
    ("https://yurttansesler.org",         "Yurttan Sesler",         "",      "",            "diger"),
    ("https://ankaragundem.com.tr",       "Ankara Gündem",          "Ankara","",            "yerel_haber"),
]

# Muğla odaklı siteler (kaynak listesi olarak kullanılacak)
MUGLA_SITELER = [s[0] for s in SITELER if s[2] == "Muğla"]

def seed_web_siteleri():
    """web_siteleri tablosuna siteleri toplu ekler."""
    print(f"[Seed] {len(SITELER)} site ekleniyor...")
    rows = []
    for (url_s, ad, il, ilce, tur) in SITELER:
        site_id = url_s.replace("https://","").replace("http://","").rstrip("/").replace(".","_").replace("-","_").replace("/","_")[:50]
        rows.append({
            "id": site_id,
            "ad": ad,
            "url": url_s,
            "feed_url": "",
            "il": il,
            "ilce": ilce,
            "tur": tur,
            "aktif": True,
        })
    # Batch upsert (50'lik gruplar)
    eklendi = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        r = sb_upsert("web_siteleri", batch)
        if r.ok or r.status_code in (200, 201, 204):
            eklendi += len(batch)
        else:
            print(f"  HATA (batch {i}): {r.status_code} {r.text[:200]}")
    print(f"[Seed] Tamamlandı: {eklendi}/{len(rows)} site işlendi")


def fix_client_source_urls():
    """Mevcut müşterilerin source_urls'lerini tam URL ile günceller."""
    print("\n[Fix] Müşteri kaynak URL'leri güncelleniyor...")

    mugla_urls = [s[0] for s in SITELER if s[2] == "Muğla"]
    bodrum_urls = [s[0] for s in SITELER if s[3] == "bodrum"]
    clients = sb_get("clients", "select=id,name,source_urls")

    for c in clients:
        name = c.get("name", "")
        current = c.get("source_urls") or []
        has_broken = any(u and not u.startswith("http") for u in current)

        if has_broken or not current:
            name_lower = name.lower()
            new_urls = bodrum_urls if "bodrum" in name_lower else mugla_urls[:20]
            r = sb_patch("clients", "id", c["id"], {"source_urls": new_urls})
            status = "OK" if r.ok else "ERR"
            print(f"  {status} [{name}] -> {len(new_urls)} kaynak ({r.status_code})")
        else:
            print(f"  - [{name}] -> zaten dogru ({len(current)} kaynak)")

    print("[Fix] Tamamlandi.")


if __name__ == "__main__":
    seed_web_siteleri()
    fix_client_source_urls()
    print("\nHer şey hazır. Artık scanner_cloud.py çalıştırabilirsiniz.")
