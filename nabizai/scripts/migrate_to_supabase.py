"""
SQLite → Supabase Veri Göçü Script'i (v2)
==========================================
Mevcut xbodrum_content.db ve JSON dosyalarındaki verileri
Supabase PostgreSQL'e aktarır.

Kullanım:
  pip install supabase python-dotenv
  python migrate_to_supabase.py

Gerekli ortam değişkenleri (.env veya .env.local'dan okunur):
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxx
"""

import os
import sys
import json
import sqlite3
from datetime import datetime

# dotenv desteği
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
    load_dotenv(env_path)
    print(f"📋 .env.local yüklendi: {env_path}")
except ImportError:
    pass

# Supabase client
try:
    from supabase import create_client
except ImportError:
    print("❌ 'supabase' paketi gerekli: pip install supabase")
    sys.exit(1)

# ── Ayarlar ──────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
SQLITE_DB = os.path.join(DATA_DIR, "xbodrum_content.db")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY or SUPABASE_KEY == "your_service_role_key":
    print("❌ Supabase bağlantı bilgileri eksik!")
    print("   .env.local dosyasında şunları tanımlayın:")
    print("   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co")
    print("   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...")
    sys.exit(1)

# Varsayılan müşteri
DEFAULT_CLIENT_ID = "00000000-0000-0000-0000-000000000001"
DEFAULT_CLIENT_NAME = "xBodrum Demo"
DEFAULT_CLIENT_SLUG = "xbodrum-demo"

# ── Supabase Client (nabizai schema) ─────────────────────

def get_sb():
    """Supabase client oluştur — nabizai schema ile"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def sb_table(sb, table_name):
    """nabizai schema'daki tabloya erişim"""
    return sb.schema("nabizai").from_(table_name)

# ── SQLite Bağlantısı ────────────────────────────────────

def connect_sqlite():
    if not os.path.exists(SQLITE_DB):
        print(f"❌ SQLite veritabanı bulunamadı: {SQLITE_DB}")
        sys.exit(1)
    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    return conn

# ── 1. Müşteri Göçü ─────────────────────────────────────

def migrate_clients(sb):
    """Müşteri panellerini aktar"""
    paneller_file = os.path.join(DATA_DIR, "musteri_panelleri.json")
    
    # Migration SQL'deki varsayılan müşteriyi kontrol et
    existing = sb_table(sb, "clients").select("id").eq("id", DEFAULT_CLIENT_ID).execute()
    if existing.data:
        print(f"✅ Varsayılan müşteri zaten var: {DEFAULT_CLIENT_ID}")
    
    if not os.path.exists(paneller_file):
        print("⚠️ musteri_panelleri.json bulunamadı, sadece varsayılan müşteri kullanılacak")
        return DEFAULT_CLIENT_ID
    
    try:
        with open(paneller_file, "r", encoding="utf-8") as f:
            paneller = json.load(f)
        
        for panel in paneller:
            slug = panel.get("musteriAd", "musteri").lower().replace(" ", "-")[:50]
            slug = slug + "-" + str(hash(panel.get("id", "")))[-6:]
            
            record = {
                "name": panel.get("musteriAd", ""),
                "slug": slug,
                "plan": panel.get("paket", "izleme"),
                "keywords": panel.get("anahtar_kelimeler", []),
                "source_urls": panel.get("haber_kaynaklari", []),
                "config": panel,
                "active": True,
            }
            
            try:
                sb_table(sb, "clients").insert(record).execute()
                print(f"  ✅ Müşteri eklendi: {record['name']}")
            except Exception as e:
                print(f"  ⚠️ Müşteri atlandi: {record['name']} — {e}")
        
        print(f"✅ {len(paneller)} müşteri paneli işlendi")
    except Exception as e:
        print(f"⚠️ Müşteri göçü hatası: {e}")
    
    return DEFAULT_CLIENT_ID

# ── 2. Kullanıcı Göçü ───────────────────────────────────

def migrate_users(sb):
    """Kullanıcıları JSON'dan Supabase'e aktar"""
    users_file = os.path.join(DATA_DIR, "kullanicilar.json")
    
    if not os.path.exists(users_file):
        print("⚠️ kullanicilar.json bulunamadı, sadece SQL seed'deki admin kullanılacak")
        return
    
    try:
        with open(users_file, "r", encoding="utf-8") as f:
            users = json.load(f)
        
        for user in users:
            record = {
                "id": user["id"],
                "ad": user["ad"],
                "email": user["email"],
                "sifre_hash": user["sifre_hash"],
                "sifre_salt": user["sifre_salt"],
                "rol": user.get("rol", "musteri"),
                "musteri_ids": user.get("musteri_ids", []),
            }
            
            try:
                sb_table(sb, "users").upsert(record, on_conflict="id").execute()
                print(f"  ✅ Kullanıcı: {record['email']} ({record['rol']})")
            except Exception as e:
                print(f"  ⚠️ Kullanıcı atlandı: {record['email']} — {e}")
        
        print(f"✅ {len(users)} kullanıcı işlendi")
    except Exception as e:
        print(f"⚠️ Kullanıcı göçü hatası: {e}")

# ── 3. Haber Göçü ───────────────────────────────────────

def migrate_news(sqlite_conn, sb, client_id):
    """Haberleri SQLite'tan Supabase'e aktar"""
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM content")
    total = cursor.fetchone()[0]
    print(f"\n📰 {total} haber bulundu, aktarılıyor...")
    
    cursor.execute("""
        SELECT id, source, title, url, content, status, category,
               published_date, ingested_date, tags, metadata
        FROM content
        ORDER BY ingested_date DESC
    """)
    
    batch = []
    migrated = 0
    skipped = 0
    
    for row in cursor:
        try:
            tags = json.loads(row["tags"] or "[]")
        except:
            tags = []
        
        try:
            meta = json.loads(row["metadata"] or "{}")
        except:
            meta = {}
        
        risk = meta.get("risk_assessment", {})
        risk_level = risk.get("risk_level", "low")
        risk_reason = risk.get("reason", "")
        ai_summary = meta.get("ai_summary", "")
        image_url = meta.get("image_url", "")
        
        record = {
            "client_id": client_id,
            "title": row["title"] or "",
            "url": row["url"] or "",
            "source": row["source"] or "",
            "platform": "web",
            "content": row["content"] or "",
            "category": row["category"] or "",
            "tags": tags if isinstance(tags, list) else [],
            "ai_summary": ai_summary,
            "image_url": image_url if image_url else None,
            "risk_level": risk_level if risk_level in ("low", "medium", "high") else "low",
            "risk_reason": risk_reason,
            "status": row["status"] or "new",
            "published_at": row["published_date"] or None,
            "created_at": row["ingested_date"] or datetime.now().isoformat(),
        }
        
        batch.append(record)
        
        if len(batch) >= 50:
            try:
                sb_table(sb, "news_items").insert(batch).execute()
                migrated += len(batch)
                print(f"  ✅ {migrated}/{total} aktarıldı...")
            except Exception as e:
                print(f"  ⚠️ Batch hatası: {e}")
                skipped += len(batch)
            batch = []
    
    if batch:
        try:
            sb_table(sb, "news_items").insert(batch).execute()
            migrated += len(batch)
        except Exception as e:
            print(f"  ⚠️ Son batch hatası: {e}")
            skipped += len(batch)
    
    print(f"\n📊 Sonuç: {migrated} aktarıldı, {skipped} atlandı")
    return migrated

# ── 4. Site Ayarları Göçü ────────────────────────────────

def migrate_site_settings(sb):
    """Site ayarlarını JSON'dan Supabase'e aktar"""
    settings_file = os.path.join(DATA_DIR, "site_settings.json")
    if not os.path.exists(settings_file):
        print("\n⚠️ site_settings.json bulunamadı, SQL seed değerleri kullanılacak")
        return
    
    try:
        with open(settings_file, "r", encoding="utf-8") as f:
            settings = json.load(f)
        
        for key, value in settings.items():
            sb_table(sb, "site_settings").upsert(
                {"key": key, "value": str(value)},
                on_conflict="key"
            ).execute()
        
        print(f"\n✅ {len(settings)} site ayarı aktarıldı")
    except Exception as e:
        print(f"\n⚠️ Site ayarları aktarılamadı: {e}")

# ── 5. Demo Talepleri Göçü ───────────────────────────────

def migrate_demo_requests(sb):
    """Demo taleplerini JSON'dan Supabase'e aktar"""
    demo_file = os.path.join(DATA_DIR, "demo_talepleri.json")
    if not os.path.exists(demo_file):
        print("\n⚠️ demo_talepleri.json bulunamadı, atlanıyor")
        return
    
    try:
        with open(demo_file, "r", encoding="utf-8") as f:
            talepler = json.load(f)
        
        for t in talepler:
            record = {
                "ad": t.get("ad", ""),
                "email": t.get("email", ""),
                "sirket": t.get("kurum", ""),
                "telefon": t.get("telefon", ""),
                "mesaj": t.get("mesaj", ""),
                "durum": t.get("durum", "yeni"),
            }
            try:
                sb_table(sb, "demo_requests").insert(record).execute()
            except:
                pass
        
        print(f"✅ {len(talepler)} demo talebi aktarıldı")
    except Exception as e:
        print(f"⚠️ Demo talepleri aktarılamadı: {e}")

# ── Ana Akış ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  nabızai — SQLite + JSON → Supabase Veri Göçü (v2)")
    print("=" * 60)
    print(f"\nSQLite: {SQLITE_DB}")
    print(f"Supabase: {SUPABASE_URL}")
    
    sb = get_sb()
    print("✅ Supabase bağlantısı kuruldu")
    
    sqlite_conn = connect_sqlite()
    print("✅ SQLite bağlantısı kuruldu")
    
    # 1. Müşterileri aktar
    print("\n─── 1. Müşteriler ───")
    client_id = migrate_clients(sb)
    
    # 2. Kullanıcıları aktar
    print("\n─── 2. Kullanıcılar ───")
    migrate_users(sb)
    
    # 3. Haberleri aktar
    print("\n─── 3. Haberler ───")
    migrated = migrate_news(sqlite_conn, sb, client_id)
    
    # 4. Site ayarlarını aktar
    print("\n─── 4. Site Ayarları ───")
    migrate_site_settings(sb)
    
    # 5. Demo taleplerini aktar
    print("\n─── 5. Demo Talepleri ───")
    migrate_demo_requests(sb)
    
    sqlite_conn.close()
    
    print("\n" + "=" * 60)
    print(f"  ✅ Göç tamamlandı! {migrated} haber aktarıldı.")
    print(f"  Müşteri ID: {client_id}")
    print("=" * 60)
    print("\n📌 Sonraki adımlar:")
    print("  1. Vercel'de environment variables'ı ayarlayın")
    print("  2. git push ile deploy edin")
    print("  3. nabizai.com üzerinden test edin")

if __name__ == "__main__":
    main()
