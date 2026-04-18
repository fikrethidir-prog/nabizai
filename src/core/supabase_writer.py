"""
Supabase Yazıcı — Tarayıcı → Supabase köprüsü
===============================================
Python tarayıcısının Supabase'e news_items yazmasını sağlar.
Müşteri (client) bazlı çalışır; client_id ile eşleştirir.
"""

import os
import json
import re
from datetime import datetime, timezone
from typing import Optional

try:
    from supabase import create_client, Client
    SUPABASE_OK = True
except ImportError:
    SUPABASE_OK = False
    print("[SupabaseWriter] supabase paketi yüklü değil: pip install supabase")

try:
    import anthropic
    ANTHROPIC_OK = True
except ImportError:
    ANTHROPIC_OK = False


class SupabaseWriter:
    """
    news_items tablosuna yazma ve müşteri config okuma.
    """

    def __init__(self):
        url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")

        if not SUPABASE_OK:
            self.sb = None
            return

        if not url or not key:
            print("[SupabaseWriter] SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik")
            self.sb = None
            return

        self.sb: Client = create_client(url, key)
        print("[SupabaseWriter] Supabase bağlantısı kuruldu")

    def is_ready(self) -> bool:
        return self.sb is not None

    # ── Müşteri Listesi ────────────────────────────────────────────────

    def get_clients(self) -> list[dict]:
        """Aktif müşterileri + config'lerini döndürür."""
        if not self.sb:
            return []
        try:
            resp = self.sb.table("clients").select("*").eq("active", True).execute()
            return resp.data or []
        except Exception as e:
            print(f"[SupabaseWriter] get_clients hatası: {e}")
            return []

    # ── Haber Yazma ────────────────────────────────────────────────────

    def url_exists(self, url: str, client_id: str) -> bool:
        """Aynı URL + client_id zaten varsa True döner (duplicate önleme)."""
        if not self.sb or not url:
            return False
        try:
            resp = (
                self.sb.table("news_items")
                .select("id")
                .eq("url", url)
                .eq("client_id", client_id)
                .limit(1)
                .execute()
            )
            return bool(resp.data)
        except Exception:
            return False

    def write_item(self, item: dict, client_id: str) -> bool:
        """
        Tek bir haber öğesini news_items tablosuna yazar.
        item dict alanları: title, url, source, content, published_date,
                            metadata (dict), image_url, tags (list)
        Dönüş: True → yeni kayıt eklendi, False → duplicate/hata
        """
        if not self.sb:
            return False

        url = item.get("url", "")
        if self.url_exists(url, client_id):
            return False

        # Tarih dönüştürme
        pub_at = self._parse_date(item.get("published_date", ""))

        # Risk seviyesi
        risk_level, risk_reason, ai_summary = self._quick_risk(
            item.get("title", ""),
            item.get("content", "")[:500]
        )

        # Tags
        tags = item.get("tags", [])
        metadata = item.get("metadata", {})
        image_url = metadata.get("image_url") or item.get("image_url")

        row = {
            "client_id": client_id,
            "title": item.get("title", "")[:500],
            "url": url,
            "source": item.get("source", ""),
            "platform": item.get("platform", "web"),
            "content": (item.get("content") or "")[:5000],
            "category": item.get("category", ""),
            "tags": tags,
            "image_url": image_url,
            "risk_level": risk_level,
            "risk_reason": risk_reason,
            "ai_summary": ai_summary,
            "status": "new",
            "published_at": pub_at,
            "metadata": metadata,
        }

        try:
            self.sb.table("news_items").insert(row).execute()
            return True
        except Exception as e:
            print(f"[SupabaseWriter] write_item hatası: {e}")
            return False

    def write_batch(self, items: list[dict], client_id: str) -> int:
        """Toplu yazma. Yeni eklenen sayısını döndürür."""
        count = 0
        for item in items:
            if self.write_item(item, client_id):
                count += 1
        return count

    # ── AI Analiz (hızlı, ucuz) ────────────────────────────────────────

    def _quick_risk(self, title: str, content_snippet: str) -> tuple[str, str, str]:
        """
        Başlık + kısa içerikten risk seviyesi ve özet üretir.
        ANTHROPIC_API_KEY varsa Claude Haiku kullanır, yoksa kural tabanlı.
        """
        text = (title + " " + content_snippet).lower()

        # Kural tabanlı risk tespiti (hızlı, API gerektirmez)
        kriz_kelimeler = [
            "kriz", "yangın", "deprem", "sel", "ölü", "yaralı", "trafik kazası",
            "silahlı", "gözaltı", "tutuklama", "itiraz", "skandal", "yolsuzluk",
            "kaçakçılık", "terör", "bomba", "protest", "göster", "grev", "kavga"
        ]
        orta_kelimeler = [
            "şikayet", "sorun", "problem", "tartışma", "eleştiri", "ihmal",
            "geç kaldı", "aksama", "iptal", "zam", "pahalı", "yetersiz"
        ]

        risk_level = "low"
        risk_reason = ""
        for k in kriz_kelimeler:
            if k in text:
                risk_level = "high"
                risk_reason = f"Kritik kelime: '{k}'"
                break
        if risk_level == "low":
            for k in orta_kelimeler:
                if k in text:
                    risk_level = "medium"
                    risk_reason = f"Dikkat kelimesi: '{k}'"
                    break

        # Claude Haiku ile özet (API key varsa)
        ai_summary = ""
        if ANTHROPIC_OK and self.anthropic_key and self.anthropic_key != "your_anthropic_key":
            try:
                client = anthropic.Anthropic(api_key=self.anthropic_key)
                msg = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=80,
                    messages=[{
                        "role": "user",
                        "content": f"Şu haberi 1 cümleyle özetle (Türkçe): {title}\n{content_snippet[:300]}"
                    }]
                )
                ai_summary = msg.content[0].text.strip()
            except Exception as e:
                print(f"[AI] Özet hatası (atlanıyor): {e}")

        return risk_level, risk_reason, ai_summary

    # ── Yardımcılar ────────────────────────────────────────────────────

    @staticmethod
    def _parse_date(date_str: str) -> Optional[str]:
        if not date_str:
            return None
        formats = [
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%dT%H:%M:%S%z",
            "%a, %d %b %Y %H:%M:%S %z",
            "%a, %d %b %Y %H:%M:%S GMT",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d",
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.isoformat()
            except ValueError:
                continue
        return None
