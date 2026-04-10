"""
X Bodrum Ajansı – Lokal LLM Entegrasyonu (Ollama / Qwen)
=========================================================
Ollama üzerinden çalışan Qwen2.5 modeli ile:
  - Haber özetleme
  - Akıllı tag çıkarma
  - Instagram caption yazımı
  - Tweet thread oluşturma
  - Duygu analizi
  - Günlük rapor üretimi
"""

import requests
import json
import time
from typing import Optional, List, Dict

# ------------------------------------------------------------------ #
#  OLLAMA CONFIG
# ------------------------------------------------------------------ #
OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b-instruct-q4_K_M"
TIMEOUT = 120  # seconds – 7B model should respond within this


class LocalLLM:
    """Ollama API üzerinden lokal Qwen2.5 modeli ile çalışır."""

    # Global Turkish enforcement preamble - prepended to ALL system prompts
    TURKISH_ENFORCEMENT = (
        "CRITICAL RULES YOU MUST ALWAYS FOLLOW:\n"
        "1. You MUST write ONLY in Turkish (Türkçe). NEVER use Chinese, Japanese, Korean, Arabic or any other language.\n"
        "2. If you find yourself writing non-Turkish characters (Chinese/Japanese/Korean), STOP and rewrite in Turkish.\n"
        "3. Every single word in your response must be Turkish. No exceptions.\n"
        "4. Do NOT mix languages. The entire output must be 100% Turkish.\n\n"
    )

    def __init__(self, model: str = DEFAULT_MODEL, base_url: str = OLLAMA_BASE_URL):
        self.model = model
        self.base_url = base_url.rstrip("/")
        self._available = None

    # ── Health Check ──────────────────────────────────────────────
    def is_available(self) -> bool:
        """Ollama sunucusunun çalışıp çalışmadığını kontrol et."""
        if self._available is not None:
            return self._available
        try:
            r = requests.get(f"{self.base_url}/api/tags", timeout=5)
            self._available = r.status_code == 200
        except Exception:
            self._available = False
        return self._available

    # ── Output Sanitizer ──────────────────────────────────────────
    def _sanitize_output(self, text: str) -> str:
        """Remove any non-Turkish characters (Chinese, Japanese, Korean, etc.) from LLM output."""
        import re
        if not text:
            return text

        # Detect CJK character ranges
        # Chinese: \u4e00-\u9fff, \u3400-\u4dbf
        # Japanese Hiragana/Katakana: \u3040-\u309f, \u30a0-\u30ff
        # Korean: \uac00-\ud7af
        # CJK Unified Extended: \u20000-\u2a6df
        cjk_pattern = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\uf900-\ufaff]+')

        has_cjk = bool(cjk_pattern.search(text))
        if not has_cjk:
            return text

        # Log the contamination
        try:
            print(f"[LLM] WARNING: CJK characters detected and removed from output")
        except UnicodeEncodeError:
            print("[LLM] WARNING: Non-Turkish characters detected and removed")

        # Strategy: Remove sentences containing CJK characters
        # Split by sentence boundaries
        clean_parts = []
        # Split by common sentence terminators and newlines
        sentences = re.split(r'(?<=[.!?\n])', text)
        for sentence in sentences:
            if not cjk_pattern.search(sentence):
                clean_parts.append(sentence)
            else:
                # Try to salvage Turkish parts from the sentence
                # Remove just the CJK runs
                cleaned = cjk_pattern.sub('', sentence).strip()
                # Remove leftover punctuation fragments like commas before removed text
                cleaned = re.sub(r'\s{2,}', ' ', cleaned)
                cleaned = re.sub(r'，|、|。|！|？', '', cleaned)  # Remove CJK punctuation
                if cleaned and len(cleaned) > 5:
                    clean_parts.append(cleaned)

        result = ''.join(clean_parts).strip()

        # Final check: if result is too short, return a safe fallback indicator
        if len(result) < 20:
            return ""

        return result

    # ── Core Generate ─────────────────────────────────────────────
    def generate(self, prompt: str, system: str = "", temperature: float = 0.7,
                 max_tokens: int = 2048) -> str:
        """Ollama /api/generate endpoint'ini çağırır."""
        if not self.is_available():
            return ""

        # Enforce Turkish in system prompt
        full_system = self.TURKISH_ENFORCEMENT + system if system else self.TURKISH_ENFORCEMENT

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": full_system,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }

        try:
            r = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=TIMEOUT
            )
            if r.status_code == 200:
                raw = r.json().get("response", "").strip()
                return self._sanitize_output(raw)
            else:
                print(f"[LLM] Error {r.status_code}: {r.text[:200]}")
                return ""
        except requests.Timeout:
            print("[LLM] Timeout")
            return ""
        except Exception as e:
            print(f"[LLM] Error: {e}")
            return ""

    # ── Chat (multi-turn) ─────────────────────────────────────────
    def chat(self, messages: List[Dict], temperature: float = 0.7,
             max_tokens: int = 2048) -> str:
        """Ollama /api/chat endpoint'ini çağırır."""
        if not self.is_available():
            return ""

        # Inject Turkish enforcement into the first system message or prepend one
        enhanced_messages = list(messages)
        if enhanced_messages and enhanced_messages[0].get('role') == 'system':
            enhanced_messages[0] = {
                'role': 'system',
                'content': self.TURKISH_ENFORCEMENT + enhanced_messages[0]['content']
            }
        else:
            enhanced_messages.insert(0, {
                'role': 'system',
                'content': self.TURKISH_ENFORCEMENT + 'Sen yardımcı bir Türkçe asistansın.'
            })

        payload = {
            "model": self.model,
            "messages": enhanced_messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }

        try:
            r = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=TIMEOUT
            )
            if r.status_code == 200:
                raw = r.json().get("message", {}).get("content", "").strip()
                return self._sanitize_output(raw)
            else:
                print(f"[LLM] Chat Error {r.status_code}: {r.text[:200]}")
                return ""
        except Exception as e:
            print(f"[LLM] Chat Error: {e}")
            return ""

    # ================================================================ #
    #  HABER / İÇERİK FONKSİYONLARI
    # ================================================================ #

    def summarize_news(self, title: str, content: str, max_words: int = 100) -> str:
        """Bir haberi Türkçe olarak özetler."""
        system = (
            "Sen bir Türk haber editörüsün. Bodrum ve Muğla bölgesindeki haberleri "
            "kısa, net ve bilgilendirici şekilde özetlersin. Sadece Türkçe yaz."
        )
        prompt = (
            f"Aşağıdaki haberi en fazla {max_words} kelimeyle özetle.\n\n"
            f"Başlık: {title}\n\n"
            f"İçerik:\n{content[:3000]}\n\n"
            f"Özet:"
        )
        return self.generate(prompt, system=system, temperature=0.3)

    def extract_smart_tags(self, title: str, content: str) -> List[str]:
        """Haberden akıllı etiketler çıkarır."""
        system = (
            "Sen bir içerik sınıflandırma uzmanısın. Bodrum haberleri için etiket çıkarırsın. "
            "Sadece etiketleri döndür, başka bir şey yazma."
        )
        prompt = (
            f"Aşağıdaki haberden en uygun etiketleri çıkar.\n"
            f"Etiket formatı: kategori:değer (örn: location:yalıkavak, topic:festival, person:başkan)\n"
            f"Kategoriler: location, topic, person, institution, industry, infrastructure, sport\n\n"
            f"Başlık: {title}\n"
            f"İçerik: {content[:2000]}\n\n"
            f"Etiketler (virgülle ayrılmış):"
        )
        result = self.generate(prompt, system=system, temperature=0.2, max_tokens=200)
        if not result:
            return []

        # Parse: virgül veya satır ile ayrılmış etiketleri al
        tags = []
        for part in result.replace("\n", ",").split(","):
            tag = part.strip().strip("- ").strip()
            if tag and ":" in tag:
                tags.append(tag)
            elif tag:
                tags.append(f"topic:{tag}")
        return tags[:15]  # Max 15 tag

    def generate_instagram_caption(self, title: str, content: str,
                                    tags: List[str] = None) -> str:
        """Haber için Instagram caption oluşturur."""
        tag_str = ", ".join(tags[:5]) if tags else "Bodrum, Haber"
        system = (
            "Sen X Bodrum Haber'in sosyal medya editörüsün. Instagram için "
            "dikkat çekici, emoji kullanan, hashtag'li Türkçe caption'lar yazarsın. "
            "Ton: profesyonel ama samimi. Maksimum 2000 karakter."
        )
        prompt = (
            f"Aşağıdaki haberi Instagram paylaşımı için düzenle.\n"
            f"Etiketler: {tag_str}\n\n"
            f"Başlık: {title}\n"
            f"İçerik: {content[:2000]}\n\n"
            f"Kurallar:\n"
            f"- Başta dikkat çekici bir emoji ve başlık kullan\n"
            f"- Haberin önemli noktalarını kısa paragraflarla yaz\n"
            f"- Sonda 'xbodrum.com' linkini ekle\n"
            f"- En az 10 hashtag ekle (#Bodrum #Haber dahil)\n"
            f"- Emojileri doğal kullan\n\n"
            f"Instagram Caption:"
        )
        result = self.generate(prompt, system=system, temperature=0.7, max_tokens=1000)
        if not result:
            # Fallback
            return f"📸 {title}\n\n{content[:500]}\n\n🔗 xbodrum.com\n\n#Bodrum #Haber #Gündem"
        return result

    def generate_tweet_thread(self, title: str, content: str) -> List[str]:
        """Haber için Twitter/X thread oluşturur."""
        system = (
            "Sen X Bodrum Haber'in Twitter/X editörüsün. Haberlerden bilgilendirici "
            "tweet thread'leri oluşturursun. Her tweet maksimum 280 karakter. "
            "Sadece Türkçe yaz."
        )
        prompt = (
            f"Aşağıdaki haberden bir Twitter thread oluştur.\n\n"
            f"Başlık: {title}\n"
            f"İçerik: {content[:2000]}\n\n"
            f"Kurallar:\n"
            f"- İlk tweet dikkat çekici olsun, 👇 emoji ile devamını oku desin\n"
            f"- Her tweet ayrı satırda, --- ile ayrılmış\n"
            f"- Toplam 3-5 tweet olsun\n"
            f"- Son tweet'te xbodrum.com linki olsun\n"
            f"- Her tweet maksimum 280 karakter\n\n"
            f"Thread:"
        )
        result = self.generate(prompt, system=system, temperature=0.7, max_tokens=800)
        if not result:
            return [
                f"📢 {title}\n\n#Bodrum 👇",
                content[:240],
                "🔗 Haberin tamamı: xbodrum.com"
            ]

        # Parse: --- ile ayrılmış tweet'leri al
        tweets = []
        for raw_tweet in result.split("---"):
            tweet = raw_tweet.strip().strip("- ").strip()
            # Satır başındaki numaralandırmayı temizle (1. 2. veya 1) 2) gibi)
            import re
            tweet = re.sub(r'^\d+[\.\)]\s*', '', tweet)
            if tweet and len(tweet) > 10:
                tweets.append(tweet[:280])
        return tweets if tweets else [f"📢 {title}\n\n🔗 xbodrum.com"]

    def analyze_sentiment(self, text: str) -> Dict:
        """Bir yorum/metnin duygu analizini yapar."""
        system = (
            "Sen bir Türkçe duygu analizi uzmanısın. "
            "Yanıtını sadece JSON formatında ver, başka bir şey yazma."
        )
        prompt = (
            f'Aşağıdaki yorumun duygu analizini yap.\n\n'
            f'Yorum: "{text}"\n\n'
            f'JSON formatında yanıt ver:\n'
            f'{{"sentiment": "positive/negative/neutral", '
            f'"confidence": 0.0-1.0, '
            f'"intent": "praise/complaint/question/general/troll", '
            f'"topics": ["konu1", "konu2"]}}'
        )
        result = self.generate(prompt, system=system, temperature=0.1, max_tokens=200)
        if not result:
            return {"sentiment": "neutral", "confidence": 0.5, "intent": "general", "topics": []}

        # Parse JSON
        try:
            # Bazen model markdown code block içine koyabilir
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except Exception:
            # Manual parse fallback
            sentiment = "neutral"
            if "positive" in result.lower():
                sentiment = "positive"
            elif "negative" in result.lower():
                sentiment = "negative"
            return {"sentiment": sentiment, "confidence": 0.5, "intent": "general", "topics": []}

    def generate_daily_report(self, stats: Dict, top_tags: List,
                               recent_titles: List[str]) -> str:
        """Günlük AI analiz raporu üretir."""
        system = (
            "Sen X Bodrum Haber'in dijital stratejisti ve analiz uzmanısın. "
            "Günlük performans raporları yazarsın. Profesyonel ama anlaşılır Türkçe kullan. "
            "Markdown formatında yaz."
        )

        tag_text = "\n".join([f"  - {tag}: {count} mention" for tag, count in top_tags])
        title_text = "\n".join([f"  - {t}" for t in recent_titles[:10]])

        prompt = (
            f"Bugünkü sistem verilerini analiz et ve stratejik rapor yaz.\n\n"
            f"## İçerik İstatistikleri:\n"
            f"  Toplam içerik: {sum(stats.values())}\n"
            + "\n".join([f"  {k}: {v}" for k, v in stats.items()])
            + f"\n\n## En Çok Geçen Konular:\n{tag_text}\n\n"
            f"## Son İşlenen Haberler:\n{title_text}\n\n"
            f"Rapor Formatı:\n"
            f"1. Günlük Özet (2-3 cümle)\n"
            f"2. Trend Analizi (hangi konular öne çıkıyor)\n"
            f"3. İçerik Stratejisi Önerileri (3-5 madde)\n"
            f"4. Risk/Uyarı Notları (varsa)\n"
            f"5. Yarın İçin Plan\n\n"
            f"Rapor:"
        )
        result = self.generate(prompt, system=system, temperature=0.5, max_tokens=1500)
        if not result:
            return "⚠️ AI rapor üretilemedi. Ollama bağlantısını kontrol edin."
        return result

    def classify_news_category(self, title: str, content: str) -> str:
        """Haberi otomatik kategorize eder."""
        system = "Sen bir haber sınıflandırma asistanısın. Sadece kategori adını döndür."
        prompt = (
            f"Aşağıdaki haberin kategorisini belirle.\n\n"
            f"Kategoriler: Gündem, Spor, Kültür-Sanat, Turizm, Altyapı, "
            f"Belediye, Çevre, Sağlık, Eğitim, Ekonomi, Asayiş, Etkinlik\n\n"
            f"Başlık: {title}\n"
            f"İçerik: {content[:500]}\n\n"
            f"Kategori:"
        )
        result = self.generate(prompt, system=system, temperature=0.1, max_tokens=20)
        return result.strip() if result else "Gündem"

    def check_content_risk(self, title: str, content: str) -> Dict:
        """İçeriğin risk seviyesini değerlendirir (Agent-12 policy gate)."""
        system = (
            "Sen bir içerik güvenlik uzmanısın. İçeriği hakaret, yanlış bilgi, "
            "manipülasyon ve hassas konu açısından değerlendir. "
            "Sadece JSON formatında yanıt ver."
        )
        prompt = (
            f"Aşağıdaki içeriğin risk değerlendirmesini yap.\n\n"
            f"Başlık: {title}\n"
            f"İçerik: {content[:2000]}\n\n"
            f'JSON: {{"risk_level": "low/medium/high", '
            f'"is_safe": true/false, '
            f'"flags": ["flag1"], '
            f'"reason": "açıklama"}}'
        )
        result = self.generate(prompt, system=system, temperature=0.1, max_tokens=300)
        if not result:
            return {"risk_level": "low", "is_safe": True, "flags": [], "reason": "AI değerlendirme yapılamadı"}

        try:
            clean = result.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
            return json.loads(clean.strip())
        except Exception:
            return {"risk_level": "low", "is_safe": True, "flags": [], "reason": result[:200]}


# ── Singleton Instance ────────────────────────────────────────────
llm = LocalLLM()


# ── Quick Test ────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Ollama Available: {llm.is_available()}")
    if llm.is_available():
        print(f"Model: {llm.model}")
        print("\n--- Test: Summarize ---")
        summary = llm.summarize_news(
            "Bodrum'da Su Kesintisi",
            "Bodrum ilçesinde MUSKİ tarafından yapılan bakım çalışmaları nedeniyle "
            "Yalıkavak, Gündoğan ve Göltürkbükü mahallelerinde yarın saat 09:00-17:00 "
            "arasında su kesintisi yaşanacağı duyuruldu."
        )
        print(summary)

        print("\n--- Test: Tags ---")
        tags = llm.extract_smart_tags(
            "Bodrum'da Su Kesintisi",
            "MUSKİ bakım çalışmaları Yalıkavak Gündoğan"
        )
        print(tags)

        print("\n--- Test: Sentiment ---")
        sent = llm.analyze_sentiment("Yine mi su kesintisi? Bıktık artık!")
        print(sent)
