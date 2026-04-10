"""
Agent-1: İçerik Toplama (Ingestion Agent)
==========================================
RSS feed'lerden ve web sitelerinden haber içeriği toplar.
Veritabanına kaydeder.
"""

import requests
import feedparser
from typing import List, Dict
import sys
import os
import time

# Path setup
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(AGENT_DIR)
sys.path.insert(0, SRC_DIR)
sys.path.insert(0, os.path.join(SRC_DIR, "core"))

from core.content_db_lib import ContentDB


class IngestionAgent:
    def __init__(self, db: ContentDB):
        self.name = "Agent-1: Ingestion Agent"
        self.db = db
        # RSS kaynakları – config'den veya burada tanımlı
        self.sources = [
            {"name": "xbodrum_rss", "type": "rss", "url": "https://xbodrum.com/rss"},
        ]

    def fetch_from_wp(self, source_conf: Dict) -> int:
        url = source_conf['url']
        print(f"[{self.name}] Fetching WP API: {url}")
        count = 0
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            resp = requests.get(url, headers=headers, timeout=15)

            if resp.status_code == 200:
                posts = resp.json()
                for post in posts:
                    import html
                    content_clean = html.unescape(post.get('content', {}).get('rendered', ''))
                    title_clean = html.unescape(post.get('title', {}).get('rendered', ''))

                    item = {
                        "id": str(post.get('id')),
                        "source": source_conf['name'],
                        "title": title_clean,
                        "content": content_clean,
                        "url": post.get('link'),
                        "published_date": post.get('date'),
                        "metadata": {"author": post.get('author'), "categories": post.get('categories')}
                    }

                    if self.db.add_content(item):
                        count += 1
                        print(f"   -> New item: {title_clean[:30]}...")
            else:
                print(f"   -> Failed Status: {resp.status_code}")

        except Exception as e:
            print(f"   -> Error fetching WP: {e}")

        return count

    def fetch_full_content(self, url: str) -> str:
        """Attempts to scrape the full article content."""
        if not url: return ""
        try:
            from bs4 import BeautifulSoup
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.content, 'html.parser')

                article_body = soup.find('div', class_='entry-content') or \
                               soup.find('div', class_='post-content') or \
                               soup.find('div', class_='article-body') or \
                               soup.find('div', itemprop='articleBody') or \
                               soup.find('article')

                if article_body:
                    text = article_body.get_text(separator=' ', strip=True)
                    return text

                main_div = soup.find('main') or soup.find('div', id='content')
                if main_div:
                    paras = main_div.find_all('p')
                    text = " ".join([p.get_text(strip=True) for p in paras])
                    return text

        except ImportError:
            print(f"   [WARN] BeautifulSoup not installed. Skipping full scrape.")
        except Exception as e:
            print(f"   [WARN] Failed to scrape {url}: {e}")

        return ""

    def fetch_rss(self, source_conf: Dict) -> int:
        url = source_conf['url']
        print(f"[{self.name}] Fetching RSS: {url}")
        count = 0
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
            resp = requests.get(url, headers=headers, timeout=15)
            feed = feedparser.parse(resp.content)
            print(f"DEBUG: Found {len(feed.entries)} entries")

            import html

            for entry in feed.entries:
                content_val = ""
                if 'content' in entry:
                    content_val = entry.content[0].value
                elif 'summary' in entry:
                    content_val = entry.summary

                content_clean = html.unescape(content_val)
                title_clean = html.unescape(entry.title)

                image_url = None
                if hasattr(entry, 'enclosures'):
                    for enclosure in entry.enclosures:
                        if enclosure.get('type', '').startswith('image/'):
                            image_url = enclosure.get('href')
                            break

                if not image_url and hasattr(entry, 'media_content'):
                     for media in entry.media_content:
                        if media.get('medium') == 'image':
                            image_url = media.get('url')
                            break

                # Fetch full content if summary is short
                if len(content_clean) < 500:
                    print(f"   -> Content short ({len(content_clean)} chars). Attempting full scrape for: {title_clean[:30]}...")
                    full_text = self.fetch_full_content(entry.link)
                    if len(full_text) > len(content_clean):
                        content_clean = full_text
                        print(f"      -> Scraped successfully. New length: {len(content_clean)}")

                item = {
                    "id": entry.get('id', entry.link),
                    "source": source_conf['name'],
                    "title": title_clean,
                    "content": content_clean,
                    "url": entry.link,
                    "published_date": entry.get('published', ''),
                    "metadata": {"author": entry.get('author'), "image_url": image_url}
                }

                if self.db.add_content(item):
                    count += 1
                    print(f"   -> New RSS item: {title_clean[:30]}...")

        except Exception as e:
            print(f"   -> Error fetching RSS: {e}")
            import traceback
            traceback.print_exc()

        return count

    def run(self):
        print(f"\n--- {self.name} Running ---")
        total_new = 0
        for source in self.sources:
            if source["type"] == "wp_api":
                total_new += self.fetch_from_wp(source)
            elif source["type"] == "rss":
                total_new += self.fetch_rss(source)

        print(f"[{self.name}] Total new items ingested: {total_new}")
        return total_new
