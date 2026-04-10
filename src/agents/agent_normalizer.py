"""
Agent-2: İçerik Normalizer & Etiketleyici (AI-Enhanced)
========================================================
HTML temizleme + AI tabanlı akıllı etiketleme + otomatik kategorilendirme.
Lokal Qwen2.5 modeli ile gelişmiş NLP analizi.
"""

import re
import sys
import os

AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(AGENT_DIR)
sys.path.insert(0, SRC_DIR)
sys.path.insert(0, os.path.join(SRC_DIR, "core"))

from core.content_db_lib import ContentDB

# AI import – graceful fallback
try:
    from core.llm_local import llm as ai
    AI_OK = ai.is_available()
except Exception:
    ai = None
    AI_OK = False


class NormalizerAgent:
    def __init__(self, db: ContentDB):
        self.name = "Agent-2: Normalizer & Tagger (AI)"
        self.db = db

    def clean_html(self, html_content: str) -> str:
        """Removes HTML tags and cleans up whitespace."""
        if not html_content:
            return ""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html_content, "html.parser")
            text = soup.get_text(separator=' ')
        except ImportError:
            text = re.sub(r'<[^>]+>', ' ', html_content)

        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_tags_rule_based(self, text: str, title: str) -> list:
        """Keyword-based tagging (fallback if AI is unavailable)."""
        tags = []
        full_text = (title + " " + text).lower()

        keywords = {
            "bodrum": "location:bodrum",
            "yalıkavak": "location:yalıkavak",
            "turgutreis": "location:turgutreis",
            "gümüşlük": "location:gümüşlük",
            "milas": "location:milas",
            "mumcular": "location:mumcular",
            "konacık": "location:konacık",
            "bitez": "location:bitez",
            "ortakent": "location:ortakent",
            "yahşi": "location:yahşi",
            "gündoğan": "location:gündoğan",
            "göltürkbükü": "location:göltürkbükü",
            "türkbükü": "location:türkbükü",
            "torba": "location:torba",
            "yalıçiftlik": "location:yalıçiftlik",
            "kızılağaç": "location:kızılağaç",
            "güvercinlik": "location:güvercinlik",
            "akyarlar": "location:akyarlar",
            "etkinlik": "topic:event",
            "konser": "topic:concert",
            "sergi": "topic:exhibition",
            "tiyatro": "topic:theater",
            "festival": "topic:festival",
            "spor": "topic:sports",
            "yelken": "topic:sailing",
            "basketbol": "topic:basketball",
            "futbol": "topic:football",
            "belediye": "institution:municipality",
            "başkan": "person:mayor",
            "su ": "infrastructure:water",
            "elektrik": "infrastructure:electricity",
            "yol": "infrastructure:road",
            "trafik": "topic:traffic",
            "kaza": "topic:accident",
            "yangın": "topic:fire",
            "hava": "topic:weather",
            "sıcaklık": "topic:temperature",
            "turizm": "industry:tourism",
            "otel": "industry:hotel",
            "sezon": "industry:season",
        }

        for key, tag in keywords.items():
            if key in full_text:
                tags.append(tag)

        return tags

    def run(self):
        print(f"\n--- {self.name} Running ---")
        print(f"    AI Durumu: {'[OK] Qwen2.5 Aktif' if AI_OK else '[!] Fallback (Kural-Tabanli)'}")

        items = self.db.get_pending_content(limit=50, status='new')

        if not items:
            print(f"[{self.name}] No new content to normalize.")
            return 0

        processed = 0
        for item in items:
            raw_content = item['content']
            clean_text = self.clean_html(raw_content)

            # ── AI-Enhanced Tagging ──
            if AI_OK:
                try:
                    tags = ai.extract_smart_tags(item['title'], clean_text)
                    if not tags:
                        tags = self.extract_tags_rule_based(clean_text, item['title'])
                    print(f"   -> ID {item['id']}: AI Tags: {tags[:5]}...")
                except Exception as e:
                    print(f"   -> ID {item['id']}: AI Error ({e}), using rules")
                    tags = self.extract_tags_rule_based(clean_text, item['title'])
            else:
                tags = self.extract_tags_rule_based(clean_text, item['title'])
                print(f"   -> ID {item['id']}: Rule Tags: {tags}")

            # ── AI Kategorilendirme ──
            category = item.get('category', 'uncategorized')
            if AI_OK and category in ('uncategorized', ''):
                try:
                    category = ai.classify_news_category(item['title'], clean_text)
                    print(f"      Kategori: {category}")
                except Exception:
                    category = 'uncategorized'

            # ── AI Özet (metadata'ya ekle) ──
            metadata = item.get('metadata', {})
            if isinstance(metadata, str):
                try:
                    import json
                    metadata = json.loads(metadata)
                except:
                    metadata = {}

            if AI_OK:
                try:
                    summary = ai.summarize_news(item['title'], clean_text, max_words=80)
                    if summary:
                        metadata['ai_summary'] = summary
                        print(f"      Özet: {summary[:60]}...")
                except Exception:
                    pass

            # ── Risk Kontrolü ──
            if AI_OK:
                try:
                    risk = ai.check_content_risk(item['title'], clean_text)
                    metadata['risk_assessment'] = risk
                    if risk.get('risk_level') == 'high':
                        print(f"      ⚠️ YÜKSEK RİSK: {risk.get('reason', '')[:60]}")
                except Exception:
                    pass

            # ── DB Update ──
            self.db.update_item_content(item['id'], clean_text, tags)
            self.db.update_status(item['id'], 'normalized')
            if metadata:
                self.db.update_metadata(item['id'], metadata)

            processed += 1

        print(f"[{self.name}] Processed {processed} items (AI: {'Yes' if AI_OK else 'No'}).")
        return processed
