"""
Yerel Medya Takip Ajansı – Kontrol Paneli v2.0
================================================
SaaS-Ready Medya İzleme & Analiz Dashboard
- Medya Takip (RSS + Web Scraping)
- AI Analiz & Raporlama
- Kaynak Yönetimi
- Bildirim Sistemi
"""

import streamlit as st
import sys
import os
import json
import time
import datetime
import re

# ------------------------------------------------------------------ #
# PATH SETUP
# ------------------------------------------------------------------ #
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)
sys.path.insert(0, os.path.join(SCRIPT_DIR, "core"))

# ------------------------------------------------------------------ #
# PAGE CONFIG  (must be first Streamlit call)
# ------------------------------------------------------------------ #
st.set_page_config(
    page_title="Yerel Medya Takip Ajansı",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ------------------------------------------------------------------ #
# CUSTOM CSS – premium dark theme
# ------------------------------------------------------------------ #
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

.stApp {
    background: linear-gradient(135deg, #0a0e1a 0%, #0d1526 50%, #111d33 100%);
    min-height: 100vh;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #080c18 0%, #0b1322 100%);
    border-right: 1px solid rgba(99,102,241,0.15);
}
[data-testid="stSidebar"] * { color: #c0c8e0 !important; }
[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 { color: #818cf8 !important; }

.mta-header {
    background: linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 16px;
    padding: 20px 28px;
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 16px;
}
.mta-header-title { font-size: 1.8rem; font-weight: 700; color: #ffffff; }
.mta-header-sub   { font-size: 0.9rem; color: #8b92b0; margin-top: 4px; }

.metric-card {
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 12px; padding: 18px 20px; text-align: center;
    transition: transform 0.2s, border-color 0.2s;
}
.metric-card:hover { transform: translateY(-3px); border-color: rgba(99,102,241,0.5); }
.metric-card .val { font-size: 2rem; font-weight: 700; color: #818cf8; }
.metric-card .lbl { font-size: 0.78rem; color: #8b92b0; margin-top: 4px; }

.section-title {
    font-size: 1rem; font-weight: 600; color: #818cf8;
    border-left: 3px solid #818cf8; padding-left: 10px; margin: 18px 0 12px 0;
}

.badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }
.badge-new  { background: rgba(99,102,241,0.2); color:#818cf8; border:1px solid rgba(99,102,241,0.4); }
.badge-ok   { background: rgba(0,210,100,0.15); color:#00d264; border:1px solid rgba(0,210,100,0.35); }

.news-row {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; transition: background 0.2s;
}
.news-row:hover { background: rgba(99,102,241,0.06); }
.news-row .nt { font-size: 0.9rem; font-weight: 600; color: #e0eaf4; }
.news-row .ns { font-size: 0.73rem; color: #6b7394; margin-top: 3px; }

[data-testid="stTabs"] [role="tab"] {
    color: #8b92b0; font-weight:500; font-size:0.88rem;
    padding: 8px 16px; border-radius: 8px 8px 0 0;
}
[data-testid="stTabs"] [role="tab"][aria-selected="true"] {
    color: #818cf8 !important; border-bottom: 2px solid #818cf8;
    background: rgba(99,102,241,0.08);
}

.stButton > button {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white; border: none; border-radius: 8px;
    font-weight: 600; font-size: 0.85rem;
    transition: opacity 0.2s, transform 0.1s;
}
.stButton > button:hover { opacity: 0.88; transform: translateY(-1px); }

[data-testid="stExpander"] {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08) !important;
    border-radius: 10px;
}

.stDataFrame { border-radius: 10px; overflow: hidden; }
p, li, label, .stMarkdown { color: #c0c8e0; }
h1, h2, h3, h4 { color: #e8edf8; }
small { color: #6b7394; }
hr { border-color: rgba(255,255,255,0.08) !important; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #080c18; }
::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
</style>
""", unsafe_allow_html=True)


# ================================================================== #
#  IMPORT MODULES  (graceful fallback)
# ================================================================== #
from core.config import Config

try:
    from core.content_db_lib import ContentDB
    db = ContentDB(db_path=Config.DB_PATH)
    DB_OK = True
except Exception as e:
    DB_OK, db = False, None

try:
    from agents.agent_mailer import MailerAgent
    mailer = MailerAgent()
    MAILER_OK = bool(mailer.password)
except Exception:
    mailer, MAILER_OK = None, False

try:
    from core.llm_local import llm as ai_engine
    AI_OK = ai_engine.is_available()
    AI_MODEL = ai_engine.model if AI_OK else "—"
except Exception:
    ai_engine, AI_OK, AI_MODEL = None, False, "—"

# File paths
DATA_DIR = Config.DATA_DIR
RECIPIENTS_FILE = os.path.join(DATA_DIR, "recipients.json")
HISTORY_FILE = os.path.join(DATA_DIR, "sent_history.json")
DOMAIN_FILE = os.path.join(DATA_DIR, "domain_states.json")


# ================================================================== #
#  RECIPIENTS MANAGEMENT
# ================================================================== #
def load_recipients() -> dict:
    try:
        if os.path.exists(RECIPIENTS_FILE):
            with open(RECIPIENTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {"sender": Config.GMAIL_USER, "recipients": []}


def save_recipients(data: dict) -> bool:
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(RECIPIENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False


# ================================================================== #
#  HELPER: Bot stats
# ================================================================== #
def get_bot_stats():
    stats = {"history_count": 0, "domain_states": {}, "history_sample": []}
    try:
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                hist = json.load(f)
            stats["history_count"] = len(hist)
            stats["history_sample"] = hist[-30:] if len(hist) >= 30 else hist
        if os.path.exists(DOMAIN_FILE):
            with open(DOMAIN_FILE, "r", encoding="utf-8") as f:
                stats["domain_states"] = json.load(f)
    except Exception:
        pass
    return stats


def get_db_stats():
    if not DB_OK:
        return {}
    try:
        return db.get_stats()
    except Exception:
        return {}


# ================================================================== #
#  RUN SCAN
# ================================================================== #
def run_ingestion_scan():
    """Run ingestion agent to fetch new content."""
    try:
        from agents.agent_ingestion import IngestionAgent
        agent = IngestionAgent(db)
        return True, agent.run()
    except Exception as e:
        return False, str(e)


def run_normalizer():
    """Run normalizer on new content."""
    try:
        from agents.agent_normalizer import NormalizerAgent
        agent = NormalizerAgent(db)
        return True, agent.run()
    except Exception as e:
        return False, str(e)


def run_analyst():
    """Generate daily report."""
    try:
        from agents.agent_analyst import AnalystAgent
        agent = AnalystAgent(db)
        report = agent.run()
        return True, report
    except Exception as e:
        return False, str(e)


# ================================================================== #
#  SIDEBAR
# ================================================================== #
with st.sidebar:
    st.markdown("""
    <div style="text-align:center; padding-bottom:12px;">
        <span style="font-size:2.2rem;">📡</span>
        <div style="font-size:1.1rem; font-weight:700; color:#818cf8; margin-top:4px;">Yerel Medya Takip</div>
        <div style="font-size:0.72rem; color:#6b7394;">Ajansı v2.0 – SaaS Medya İzleme</div>
    </div>
    """, unsafe_allow_html=True)

    st.divider()

    st.markdown("**🔌 Sistem Durumu**")
    col_s1, col_s2 = st.columns(2)
    col_s1.markdown(f"{'🟢' if DB_OK else '🔴'} **Veritabanı**")
    col_s2.markdown(f"{'🟢' if MAILER_OK else '🟡'} **E-posta**")
    col_s3, col_s4 = st.columns(2)
    col_s3.markdown(f"{'🟢' if AI_OK else '🔴'} **AI**")
    col_s4.markdown(f"**{len(Config.MONITOR_URLS)}** kaynak")

    st.divider()

    st.markdown("**⚡ Hızlı İşlemler**")

    if st.button("🔍 İçerik Topla (Ingestion)", use_container_width=True, key="sb_ingest"):
        with st.spinner("RSS ve web kaynakları taranıyor..."):
            ok, result = run_ingestion_scan()
        if ok:
            st.success(f"✅ Tarama tamamlandı: {result} yeni içerik")
        else:
            st.error(f"❌ Hata: {result}")

    if st.button("🧠 Normalize & Etiketle", use_container_width=True, key="sb_norm"):
        with st.spinner("İçerikler normalize ediliyor..."):
            ok, result = run_normalizer()
        if ok:
            st.success(f"✅ {result} içerik normalize edildi")
        else:
            st.error(f"❌ Hata: {result}")

    if st.button("📊 Günlük Rapor Üret", use_container_width=True, key="sb_report"):
        with st.spinner("AI rapor hazırlanıyor..."):
            ok, result = run_analyst()
        if ok:
            st.success("✅ Rapor oluşturuldu!")
        else:
            st.error(f"❌ Hata: {result}")

    st.divider()
    st.caption(f"⏰ {datetime.datetime.now().strftime('%d.%m.%Y %H:%M')}")


# ================================================================== #
#  HEADER
# ================================================================== #
st.markdown(f"""
<div class="mta-header">
    <div style="font-size:2.4rem;">📡</div>
    <div>
        <div class="mta-header-title">Yerel Medya Takip Ajansı</div>
        <div class="mta-header-sub">
            {len(Config.MONITOR_URLS)} Haber Kaynağı &nbsp;|&nbsp;
            {len(Config.RSS_FEEDS)} RSS Feed &nbsp;|&nbsp; AI Analiz & Raporlama
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ================================================================== #
#  KPI ROW
# ================================================================== #
bot_stats = get_bot_stats()
db_stats  = get_db_stats()

total_in_db      = sum(db_stats.values()) if db_stats else 0
new_items        = db_stats.get("new", 0)
normalized_items = db_stats.get("normalized", 0)
history_count    = bot_stats.get("history_count", 0)
domain_count     = len(bot_stats.get("domain_states", {}))

kpi_data = [
    (len(Config.MONITOR_URLS), "İzlenen Kaynak"),
    (total_in_db,        "DB İçerik"),
    (new_items,          "Yeni İçerik"),
    (normalized_items,   "Normalize"),
    (history_count,      "Taranmış Link"),
    (domain_count,       "Aktif Domain"),
]
for col, (val, label) in zip(st.columns(6), kpi_data):
    col.markdown(f"""
    <div class="metric-card">
        <div class="val">{val:,}</div>
        <div class="lbl">{label}</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)


# ================================================================== #
#  MAIN TABS
# ================================================================== #
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📡 Medya Takip",
    "🌐 Kaynak Yönetimi",
    "🧠 İçerik Analiz",
    "📊 Raporlar",
    "🤖 AI Chat",
    "⚙️ Sistem",
])


# ================================================================= #
#  TAB 1 – MEDYA TAKİP
# ================================================================= #
with tab1:
    st.markdown('<div class="section-title">📡 Medya Takip – Son Tespit Edilen İçerikler</div>', unsafe_allow_html=True)

    if DB_OK:
        all_content = db.get_all_content(limit=50)
        if all_content:
            # Search filter
            search_q = st.text_input("🔍 İçerik Ara", "", key="tab1_search", placeholder="Başlık veya içerikte arayın...")
            if search_q:
                all_content = db.search_content(search_q, limit=50)

            for item in all_content:
                status = item.get('status', 'new')
                badge_cls = "badge-new" if status == 'new' else "badge-ok"
                date_str = item.get('published_date', '')[:10] or item.get('ingested_date', '')[:10]
                tags_display = ", ".join(item.get('tags', [])[:3]) if item.get('tags') else ""

                st.markdown(f"""
                <div class="news-row">
                    <div class="nt">{item['title'][:100]}</div>
                    <div class="ns">
                        <span class="badge {badge_cls}">{status}</span>
                        &nbsp; 📅 {date_str} &nbsp; 🔗 {item.get('source', '')}
                        {f' &nbsp; 🏷️ {tags_display}' if tags_display else ''}
                    </div>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("Henüz içerik bulunamadı. Sidebar'dan '🔍 İçerik Topla' butonuna tıklayın.")
    else:
        st.error("Veritabanı bağlantısı kurulamadı.")


# ================================================================= #
#  TAB 2 – KAYNAK YÖNETİMİ
# ================================================================= #
with tab2:
    st.markdown('<div class="section-title">🌐 İzlenen Kaynak Siteleri</div>', unsafe_allow_html=True)

    for i, url in enumerate(Config.MONITOR_URLS):
        domain = url.replace("https://", "").replace("http://", "").rstrip("/")
        domain_states = bot_stats.get("domain_states", {})
        base = f"https://{domain.split('/')[0]}" if '/' in domain else f"https://{domain}"

        last_date = domain_states.get(base, "")
        if last_date:
            try:
                dt = datetime.datetime.fromisoformat(last_date)
                age = (datetime.datetime.now() - dt).days
                freshness = f"🟢 {age}g" if age == 0 else (f"🟡 {age}g" if age < 3 else f"🔴 {age}g")
            except:
                freshness = "—"
        else:
            freshness = "⚪ Henüz taranmadı"

        st.markdown(f"""
        <div class="news-row" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div class="nt">{domain}</div>
                <div class="ns">{url}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.78rem; color:#8b92b0;">{freshness}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.divider()
    st.markdown('<div class="section-title">📻 RSS Feed Kaynakları</div>', unsafe_allow_html=True)
    for feed in Config.RSS_FEEDS:
        st.markdown(f"- **{feed['name']}**: `{feed['url']}`")


# ================================================================= #
#  TAB 3 – İÇERİK ANALİZ
# ================================================================= #
with tab3:
    st.markdown('<div class="section-title">🧠 AI İçerik Analiz</div>', unsafe_allow_html=True)

    if DB_OK:
        # Top Tags
        top_tags = db.get_top_tags(limit=15)
        if top_tags:
            st.markdown("### 🏷️ En Popüler Etiketler")
            import pandas as pd
            tag_df = pd.DataFrame(top_tags, columns=["Etiket", "Sayı"])
            st.bar_chart(tag_df.set_index("Etiket"))

        # Content stats by status
        st.markdown("### 📊 İçerik Durumu")
        if db_stats:
            stats_df = pd.DataFrame(list(db_stats.items()), columns=["Durum", "Adet"])
            col1, col2 = st.columns([1, 2])
            with col1:
                st.dataframe(stats_df, use_container_width=True, hide_index=True)
            with col2:
                st.bar_chart(stats_df.set_index("Durum"))

        # Recent normalized content with AI summaries
        st.markdown("### 🔍 Son Normalize Edilen İçerikler")
        normalized = db.get_pending_content(limit=10, status='normalized')
        for item in normalized:
            metadata = item.get('metadata', {})
            summary = metadata.get('ai_summary', '')
            risk = metadata.get('risk_assessment', {})

            with st.expander(f"📄 {item['title'][:80]}"):
                if summary:
                    st.markdown(f"**AI Özet:** {summary}")
                if risk:
                    level = risk.get('risk_level', 'low')
                    emoji = "🟢" if level == 'low' else ("🟡" if level == 'medium' else "🔴")
                    st.markdown(f"**Risk:** {emoji} {level} – {risk.get('reason', '')[:100]}")
                st.markdown(f"**Etiketler:** {', '.join(item.get('tags', []))}")
                st.markdown(f"**Kaynak:** {item.get('source', '')} | **Tarih:** {item.get('published_date', '')[:10]}")
    else:
        st.error("Veritabanı bağlantısı kurulamadı.")


# ================================================================= #
#  TAB 4 – RAPORLAR
# ================================================================= #
with tab4:
    st.markdown('<div class="section-title">📊 Günlük & Haftalık Raporlar</div>', unsafe_allow_html=True)

    reports_dir = Config.REPORTS_DIR
    if os.path.exists(reports_dir):
        report_files = sorted(
            [f for f in os.listdir(reports_dir) if f.endswith('.md')],
            reverse=True
        )

        if report_files:
            for rf in report_files[:10]:
                filepath = os.path.join(reports_dir, rf)
                with st.expander(f"📄 {rf}"):
                    with open(filepath, "r", encoding="utf-8") as f:
                        st.markdown(f.read())
        else:
            st.info("Henüz rapor üretilmedi. Sidebar'dan '📊 Günlük Rapor Üret' butonuna tıklayın.")
    else:
        st.info("Rapor dizini bulunamadı.")


# ================================================================= #
#  TAB 5 – AI CHAT
# ================================================================= #
with tab5:
    st.markdown('<div class="section-title">🤖 AI Asistan – Medya Analiz</div>', unsafe_allow_html=True)

    if AI_OK:
        st.caption(f"Model: **{AI_MODEL}** | Ollama üzerinden lokal çalışıyor")

        # Chat history in session state
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []

        # Display chat history
        for msg in st.session_state.chat_history:
            if msg["role"] == "user":
                st.chat_message("user").markdown(msg["content"])
            else:
                st.chat_message("assistant").markdown(msg["content"])

        # Chat input
        user_input = st.chat_input("Medya analiz sorunuzu yazın...")
        if user_input:
            st.session_state.chat_history.append({"role": "user", "content": user_input})
            st.chat_message("user").markdown(user_input)

            with st.chat_message("assistant"):
                with st.spinner("Düşünüyorum..."):
                    # Build context with recent content
                    context = ""
                    if DB_OK:
                        recent = db.get_all_content(limit=5)
                        if recent:
                            context = "\n".join([f"- {r['title']}" for r in recent])

                    messages = [
                        {"role": "system", "content": f"""Sen yerel medya takip sistemi asistanısın. 
Kullanıcının yerel medya, haberler ve trend analizi sorularını yanıtla.
Son haberler:
{context}"""},
                    ]
                    for m in st.session_state.chat_history:
                        messages.append({"role": m["role"], "content": m["content"]})

                    response = ai_engine.chat(messages)
                    if not response:
                        response = "Üzgünüm, şu anda yanıt üretemiyorum. Ollama sunucusunu kontrol edin."

                    st.markdown(response)
                    st.session_state.chat_history.append({"role": "assistant", "content": response})

        if st.button("🗑️ Sohbeti Temizle", key="clear_chat"):
            st.session_state.chat_history = []
            st.rerun()
    else:
        st.warning("⚠️ AI modülü kullanılamıyor. Ollama sunucusunun çalıştığından emin olun.")
        st.code("ollama serve  # Terminal'de çalıştırın", language="bash")


# ================================================================= #
#  TAB 6 – SİSTEM
# ================================================================= #
with tab6:
    st.markdown('<div class="section-title">⚙️ Sistem Bilgileri</div>', unsafe_allow_html=True)

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### 🔌 Modül Durumu")
        modules = [
            ("Veritabanı (SQLite)", DB_OK),
            ("E-posta Sistemi", MAILER_OK),
            ("AI Engine (Ollama)", AI_OK),
        ]
        for name, status in modules:
            emoji = "🟢" if status else "🔴"
            st.markdown(f"{emoji} **{name}**")

        st.markdown(f"\n**Proje:** {Config.PROJECT_NAME} v{Config.VERSION}")
        st.markdown(f"**AI Model:** {AI_MODEL}")
        st.markdown(f"**DB Path:** `{Config.DB_PATH}`")

    with col2:
        st.markdown("### 📧 Bildirim Ayarları")
        recipients_data = load_recipients()
        st.markdown(f"**Gönderici:** `{Config.GMAIL_USER}`")

        if recipients_data.get("recipients"):
            for r in recipients_data["recipients"]:
                active = "🟢" if r.get("active", True) else "🔴"
                st.markdown(f"{active} {r.get('name', '')} – `{r['email']}`")
        else:
            st.caption("Alıcı listesi: " + ", ".join(Config.RECIPIENT_EMAILS))

    st.divider()

    st.markdown("### 📁 Proje Yapısı")
    st.code(f"""
Yerel Media Takip Ajani/
├── .env                    # Ortam değişkenleri
├── requirements.txt        # Bağımlılıklar
├── src/
│   ├── core/
│   │   ├── config.py       # Merkezi konfigürasyon
│   │   ├── content_db_lib.py  # Veritabanı katmanı
│   │   └── llm_local.py    # AI/LLM entegrasyonu
│   ├── agents/
│   │   ├── agent_ingestion.py    # İçerik toplama
│   │   ├── agent_normalizer.py   # Normalleştirme & etiketleme
│   │   ├── agent_analyst.py      # Raporlama
│   │   └── agent_mailer.py       # E-posta bildirimleri
│   ├── scanner/
│   │   ├── media_scanner_bot.py  # Site tarama botu
│   │   └── scanner_config.py     # Tarama ayarları
│   └── dashboard.py               # Bu dashboard
├── data/                   # Veritabanı & state dosyaları
└── outputs/
    ├── reports/            # Üretilen raporlar
    └── logs/               # Sistem logları
""", language="text")
