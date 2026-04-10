"""
Yerel Medya Takip Ajansı – Merkezi Konfigürasyon
==================================================
SaaS-ready medya izleme sistemi konfigürasyonu.
Tüm ayarlar .env dosyasından veya varsayılanlardan yüklenir.
"""

import os
from dotenv import load_dotenv

# .env dosyasını yükle (proje kökünden)
PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


class Config:
    # ── Proje Bilgileri ────────────────────────────────────────
    PROJECT_NAME = "Yerel Medya Takip Ajansı"
    VERSION = "2.0.0"
    DESCRIPTION = "Yerel medya sitelerini ve sosyal medya hesaplarını izleyerek raporlayan SaaS sistemi"

    # ── Dizin Yapısı ──────────────────────────────────────────
    PROJECT_ROOT = PROJECT_ROOT
    SRC_DIR = os.path.join(PROJECT_ROOT, "src")
    DATA_DIR = os.path.join(PROJECT_ROOT, "data")
    OUTPUTS_DIR = os.path.join(PROJECT_ROOT, "outputs")
    REPORTS_DIR = os.path.join(OUTPUTS_DIR, "reports")
    LOGS_DIR = os.path.join(OUTPUTS_DIR, "logs")

    # ── Veritabanı ────────────────────────────────────────────
    DB_PATH = os.path.join(DATA_DIR, "medya_takip.db")

    # ── API Keys ──────────────────────────────────────────────
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # ── Gmail Ayarları (Bildirim Sistemi) ─────────────────────
    GMAIL_USER = os.getenv("GMAIL_USER", "xbodrumajani@gmail.com")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "")
    RECIPIENT_EMAILS = [
        e.strip() for e in os.getenv("RECIPIENT_EMAILS", "fikrethidir@gmail.com,cizgegizembediz@gmail.com").split(",")
        if e.strip()
    ]

    # ── AI / LLM Ayarları ─────────────────────────────────────
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL = os.getenv("LLM_MODEL", "qwen2.5:7b-instruct-q4_K_M")
    LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "120"))

    # ── Tarama Ayarları ───────────────────────────────────────
    SCAN_INTERVAL_MINUTES = int(os.getenv("SCAN_INTERVAL_MINUTES", "30"))
    LIVEWATCH_INTERVAL_SECONDS = int(os.getenv("LIVEWATCH_INTERVAL_SECONDS", "180"))
    QUIET_HOURS_START = int(os.getenv("QUIET_HOURS_START", "0"))
    QUIET_HOURS_END = int(os.getenv("QUIET_HOURS_END", "6"))

    # ── Risk Eşikleri ─────────────────────────────────────────
    RISK_THRESHOLD_HIGH = 0.8
    RISK_THRESHOLD_MEDIUM = 0.4

    # ── İzlenecek Medya Kaynakları ────────────────────────────
    # Bu liste config dosyası veya veritabanından dinamik yüklenecek
    MONITOR_URLS = [
        "https://www.xbodrum.com",
        "https://www.bodrumhaberi.com",
        "https://www.bodrumania.com",
        "https://www.kenttv.net",
        "https://www.bodrumhaber.com",
        "https://www.haberbodrumgazetesi.com",
        "https://www.bodrumdabirgun.com",
        "https://www.bodrumca.com",
        "https://www.bodrumtime.com",
        "https://www.bodrumhabermerkezi.com",
        "https://www.bodrumkapakhaber.com",
        "https://www.bodrumcity.com",
        "https://www.bodrumaktif.com",
        "https://www.bodrumdabugun.com",
        "https://www.bodrumgundem.com",
        "https://www.bodrummuhabiri.com",
        "https://www.bodrumsokakhaber.com",
        "https://www.bodrumhaberpostasi.com",
        "https://www.bodrumguncelhaber.com",
        "https://www.arenabodrumhaber.com",
        "https://www.bodrumyerelhaber.com",
        "https://www.anterhaber.com",
        "https://www.bodrumkadraj.com",
        "https://www.egealternatif.com",
        "https://www.bodrumyenimedya.com",
        "https://www.bodrumsicakhaber.com",
    ]

    # ── RSS Feed Kaynakları (LiveWatch) ───────────────────────
    RSS_FEEDS = [
        {"name": "xbodrum",         "url": "https://xbodrum.com/feed/",              "type": "rss"},
        {"name": "bodrumhaberi",    "url": "https://www.bodrumhaberi.com/feed/",     "type": "rss"},
        {"name": "bodrumania",      "url": "https://www.bodrumania.com/feed/",       "type": "rss"},
        {"name": "kenttv",          "url": "https://www.kenttv.net/rss/",            "type": "rss"},
        {"name": "bodrumhaber",     "url": "https://www.bodrumhaber.com/feed/",      "type": "rss"},
        {"name": "bodrumdabirgun",  "url": "https://www.bodrumdabirgun.com/feed/",   "type": "rss"},
        {"name": "bodrumca",        "url": "https://www.bodrumca.com/feed/",         "type": "rss"},
        {"name": "bodrumtime",      "url": "https://www.bodrumtime.com/feed/",       "type": "rss"},
        {"name": "bodrumgundem",    "url": "https://www.bodrumgundem.com/feed/",     "type": "rss"},
        {"name": "bodrumaktif",     "url": "https://www.bodrumaktif.com/feed/",      "type": "rss"},
        {"name": "bodrumdabugun",   "url": "https://www.bodrumdabugun.com/feed/",    "type": "rss"},
        {"name": "bodrumhabermerkezi", "url": "https://www.bodrumhabermerkezi.com/feed/", "type": "rss"},
        {"name": "egealternatif",   "url": "https://www.egealternatif.com/feed/",    "type": "rss"},
        {"name": "bodrumyenimedya", "url": "https://www.bodrumyenimedya.com/feed/",  "type": "rss"},
    ]

    # ── Anahtar Kelime Takibi ─────────────────────────────────
    # Belirli konuları filtrelemek için (SaaS'da müşteri bazlı olacak)
    TRACKING_KEYWORDS = []

    # ── Bildirim Kategorileri ─────────────────────────────────
    NOTIFICATION_CATEGORIES = {
        "📡 Medya Takip": {
            "medya_yeni_icerik":   {"label": "📰 Yeni İçerik Bildirimi", "desc": "Yeni haber/içerik bulunduğunda bildirim"},
            "medya_site_durumu":   {"label": "🌐 Site Erişim Durumu",    "desc": "İzlenen sitelerin erişim değişikliği"},
            "medya_gunluk_ozet":   {"label": "📋 Günlük Medya Özeti",    "desc": "Günlük medya tarama sonuç özeti"},
        },
        "🧠 AI Analiz": {
            "ai_trend_raporu":     {"label": "📈 Trend Raporu",          "desc": "Günlük/haftalık trend analizi"},
            "ai_sentiment_uyari":  {"label": "💡 Sentiment Uyarısı",     "desc": "Olumsuz içerik tespiti"},
        },
        "📊 Raporlama": {
            "gunluk_rapor":   {"label": "📊 Günlük Rapor",   "desc": "Tüm sistemin günlük performans raporu"},
            "haftalik_rapor":  {"label": "📈 Haftalık Rapor",  "desc": "Haftalık trend analizi ve özet"},
        },
        "🚨 Uyarılar & Sistem": {
            "kriz_uyarisi":       {"label": "🚨 Kriz Uyarısı",       "desc": "Olumsuz duygu veya kriz durumu tespiti"},
            "sistem_durumu":      {"label": "⚙️ Sistem Durumu",      "desc": "Hata, uyarı ve teknik bildirimler"},
        },
    }


config = Config()

# Backwards compatibility
GMAIL_USER = Config.GMAIL_USER
GMAIL_PASSWORD = Config.GMAIL_PASSWORD
RECIPIENT_EMAILS = Config.RECIPIENT_EMAILS
MONITOR_URLS = Config.MONITOR_URLS
