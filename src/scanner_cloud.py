#!/usr/bin/env python3
"""
scanner_cloud.py — Bulut tarama motoru
=======================================
GitHub Actions / Railway / Render üzerinde çalışır.
Müşterileri Supabase'den okur, haberleri Supabase'e yazar.

Çalıştırma:
    python src/scanner_cloud.py

GitHub Actions'da ortam değişkenleri (secrets) kullanır:
    NEXT_PUBLIC_SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    ANTHROPIC_API_KEY
"""

import sys
import os
import time
import json
import requests
import feedparser
import html
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse

# Path setup
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SRC_DIR)
sys.path.insert(0, SRC_DIR)

from core.supabase_writer import SupabaseWriter

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


# ── RSS Çekici ─────────────────────────────────────────────────────────

def fetch_rss(feed_url: str, source_name: str) -> List[Dict]:
    """RSS/Atom feed'den haber öğelerini çeker."""
    items = []
    try:
        resp = requests.get(feed_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)

        for entry in feed.entries:
            content_val = ""
            if hasattr(entry, "content") and entry.content:
                content_val = entry.content[0].get("value", "")
            elif hasattr(entry, "summary"):
                content_val = entry.summary or ""

            content_clean = html.unescape(content_val)
            title_clean = html.unescape(getattr(entry, "title", "") or "")
            url = getattr(entry, "link", "") or ""

            if not title_clean or not url:
                continue

            # Görsel
            image_url = None
            if hasattr(entry, "enclosures"):
                for enc in entry.enclosures:
                    if enc.get("type", "").startswith("image/"):
                        image_url = enc.get("href")
                        break
            if not image_url and hasattr(entry, "media_content"):
                for m in entry.media_content:
                    if m.get("medium") == "image":
                        image_url = m.get("url")
                        break

            # Kısa içerik → tam sayfadan çek
            if len(content_clean) < 300 and url:
                full = scrape_article(url)
                if len(full) > len(content_clean):
                    content_clean = full

            pub_date = ""
            if hasattr(entry, "published"):
                pub_date = entry.published
            elif hasattr(entry, "updated"):
                pub_date = entry.updated

            items.append({
                "source": source_name,
                "title": title_clean,
                "content": content_clean,
                "url": url,
                "published_date": pub_date,
                "platform": "web",
                "metadata": {"image_url": image_url},
            })

        log(f"  RSS [{source_name}]: {len(items)} haber")
    except Exception as e:
        log(f"  RSS [{source_name}] HATA: {e}")
    return items


def scrape_article(url: str) -> str:
    """Haber sayfasından tam içerik çeker."""
    try:
        from bs4 import BeautifulSoup
        resp = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.content, "html.parser")
        body = (
            soup.find("div", class_="entry-content")
            or soup.find("div", class_="post-content")
            or soup.find("div", class_="article-body")
            or soup.find("article")
        )
        if body:
            return body.get_text(" ", strip=True)[:3000]
    except Exception:
        pass
    return ""


# ── WordPress REST API ─────────────────────────────────────────────────

def fetch_wp_api(site_url: str, source_name: str, page: int = 1) -> List[Dict]:
    """WordPress /wp-json/wp/v2/posts endpoint'inden haber çeker."""
    items = []
    try:
        api_url = site_url.rstrip("/") + f"/wp-json/wp/v2/posts?per_page=10&page={page}&_fields=id,title,link,content,date,featured_media"
        resp = requests.get(api_url, headers=HEADERS, timeout=15)
        if resp.status_code != 200:
            return []
        posts = resp.json()
        for post in posts:
            title = html.unescape(post.get("title", {}).get("rendered", "") or "")
            content = html.unescape(post.get("content", {}).get("rendered", "") or "")
            url = post.get("link", "")
            if not title or not url:
                continue
            items.append({
                "source": source_name,
                "title": title,
                "content": content[:3000],
                "url": url,
                "published_date": post.get("date", ""),
                "platform": "web",
                "metadata": {},
            })
        log(f"  WP [{source_name}]: {len(items)} haber")
    except Exception as e:
        log(f"  WP [{source_name}] HATA: {e}")
    return items


# ── Google News RSS ─────────────────────────────────────────────────────

def fetch_google_news(query: str, lang: str = "tr") -> List[Dict]:
    """Google News RSS'den arama sonuçlarını çeker."""
    from urllib.parse import quote
    encoded = quote(f"{query} when:2d")
    url = f"https://news.google.com/rss/search?q={encoded}&hl={lang}&gl=TR&ceid=TR:{lang}"
    return fetch_rss(url, f"google:{query[:20]}")


# ── Müşteri Taraması ───────────────────────────────────────────────────

def scan_client(client: dict, writer: SupabaseWriter) -> int:
    """Tek bir müşteri için tüm kaynaklardan haber toplar ve Supabase'e yazar."""
    client_id = client.get("id")
    client_name = client.get("name", client_id)
    config = client.get("config") or {}

    # Config'den veya doğrudan clients tablosundan kaynak listesini al
    source_urls = client.get("source_urls") or config.get("haber_kaynaklari", [])
    keywords = client.get("keywords") or config.get("anahtar_kelimeler", [])
    excluded = config.get("haric_kelimeler", [])

    log(f"\n── Müşteri: {client_name} ({len(source_urls)} kaynak, {len(keywords)} anahtar kelime) ──")

    all_items: List[Dict] = []

    # RSS/Web kaynaklarından topla
    for url in source_urls:
        url = url.strip()
        if not url:
            continue

        # https:// yoksa ekle
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://www." + url if not url.startswith("www.") else "https://" + url

        # RSS feed URL ise direkt çek
        if any(x in url for x in ["/feed", "/rss", "feeds.feedburner", "news.google.com"]):
            items = fetch_rss(url, _domain(url))
        else:
            # Önce /feed/ dene, başarısız olursa WP API
            items = fetch_rss(url.rstrip("/") + "/feed/", _domain(url))
            if not items:
                items = fetch_wp_api(url, _domain(url))

        all_items.extend(items)
        time.sleep(0.5)  # site yükleme arası

    # Anahtar kelime aramaları
    for kw in keywords[:5]:  # max 5 arama (Google limit)
        items = fetch_google_news(kw)
        all_items.extend(items)
        time.sleep(1)

    # Hariç kelime filtresi
    if excluded:
        before = len(all_items)
        all_items = [
            i for i in all_items
            if not any(
                ex.lower() in (i.get("title", "") + i.get("content", "")).lower()
                for ex in excluded
            )
        ]
        log(f"  Hariç filtre: {before - len(all_items)} haber elendi")

    # Supabase'e yaz
    written = writer.write_batch(all_items, client_id)
    log(f"  ✓ {written}/{len(all_items)} yeni haber kaydedildi → Supabase")
    return written


def _domain(url: str) -> str:
    """URL'den domain adını çıkarır."""
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return url[:30]


# ── Ana Çalıştırıcı ────────────────────────────────────────────────────

def main():
    log("=" * 60)
    log("nabızai Bulut Tarayıcısı — Başlıyor")
    log(f"Zaman: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}")
    log("=" * 60)

    writer = SupabaseWriter()
    if not writer.is_ready():
        log("HATA: Supabase bağlantısı kurulamadı. Env vars kontrol edin:")
        log("  NEXT_PUBLIC_SUPABASE_URL")
        log("  SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    clients = writer.get_clients()
    if not clients:
        log("UYARI: Supabase'de aktif müşteri bulunamadı.")
        log("Admin panelinden müşteri oluşturun: /admin/panel-olustur")
        sys.exit(0)

    log(f"\nAktif müşteri sayısı: {len(clients)}")

    total_written = 0
    for client in clients:
        try:
            written = scan_client(client, writer)
            total_written += written
        except Exception as e:
            log(f"Müşteri tarama hatası [{client.get('name')}]: {e}")
        time.sleep(2)

    log("\n" + "=" * 60)
    log(f"Tarama tamamlandı. Toplam yeni haber: {total_written}")
    log("=" * 60)


if __name__ == "__main__":
    main()
