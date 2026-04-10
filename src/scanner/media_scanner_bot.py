import time
import schedule
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
from bs4 import BeautifulSoup
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import config
import datetime
import json
import os
from urllib.parse import urljoin, urlparse
import re

# History saves sent URLs to avoid duplicates
# Use absolute path relative to this script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORY_FILE = os.path.join(SCRIPT_DIR, "sent_history.json")
DOMAIN_STATES_FILE = os.path.join(SCRIPT_DIR, "domain_states.json")

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
             return []
    return []

def save_history(history):
    # Keep history size manageable (last 5000 links)
    if len(history) > 5000:
        history = history[-5000:]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def load_domain_states():
    if os.path.exists(DOMAIN_STATES_FILE):
        try:
            with open(DOMAIN_STATES_FILE, "r", encoding="utf-8") as f:
                # Load dates as strings, consumer handles conversion if needed, 
                # but it's easier to keep them as ISO strings in JSON
                return json.load(f)
        except:
            return {}
    return {}

def save_domain_states(states):
    with open(DOMAIN_STATES_FILE, "w", encoding="utf-8") as f:
        json.dump(states, f, ensure_ascii=False, indent=2)

def is_quiet_hours():
    """
    Returns True if current time is between 00:00 and 06:00
    """
    current_hour = datetime.datetime.now().hour
    if 0 <= current_hour < 6:
        return True
    return False

def get_base_domain(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def find_date(url, text_content, html_node=None):
    """
    Attempts to find a date in the URL or text content.
    Returns a datetime object or None.
    """
    # Check if a time node is near the html node
    if html_node:
        parent_container = html_node.find_parent(['article', 'div', 'li', 'td'])
        if parent_container:
            time_node = parent_container.find('time')
            if time_node:
                time_text = time_node.get_text(" ", strip=True).lower()
                months = {
                    'ocak': 1, 'şubat': 2, 'subat': 2, 'mart': 3, 'nisan': 4,
                    'mayıs': 5, 'mayis': 5, 'haziran': 6, 'temmuz': 7,
                    'ağustos': 8, 'agustos': 8, 'eylül': 9, 'eylul': 9,
                    'ekim': 10, 'kasım': 11, 'kasim': 11, 'aralık': 12, 'aralik': 12
                }
                m = re.search(r'(\d{1,2})\s+([a-zşçöğıü]+)\s+(\d{4})', time_text)
                if m:
                    d, m_str, y = int(m.group(1)), m.group(2), int(m.group(3))
                    if m_str in months:
                        try:
                            return datetime.datetime(y, months[m_str], d)
                        except: pass

    # 1. Check URL for YYYY/MM/DD patterns
    match = re.search(r'/(\d{4})/(\d{1,2})/(\d{1,2})/', url)
    if match:
        try:
            return datetime.datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except: pass
    
    match = re.search(r'-(\d{4})-(\d{1,2})-(\d{1,2})', url)
    if match:
        try:
            return datetime.datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        except: pass

    # 2. Check Text for DD.MM.YYYY or DD/MM/YYYY
    # Regex for DD.MM.YYYY
    date_pattern = r'(\d{1,2})[\./-](\d{1,2})[\./-](\d{4})'
    match = re.search(date_pattern, text_content)
    if match:
        try:
            d, m, y = int(match.group(1)), int(match.group(2)), int(match.group(3))
            # Basic validation
            if 2000 < y < 2100 and 1 <= m <= 12 and 1 <= d <= 31:
                return datetime.datetime(y, m, d)
        except: pass
        
    return None

def extract_news_links(url):
    """
    Scrapes a given URL for likely news articles.
    Returns a list of dicts: {'title': str, 'link': str, 'source': str, 'date': datetime|None}
    """
    print(f"Taraniyor: {url}")
    found_items = []
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            print(f"Hata: {url} durum kodu {response.status_code}")
            return []

        # Otomatik encoding tespiti
        response.encoding = response.apparent_encoding
        soup = BeautifulSoup(response.text, 'html.parser')
        
        base_domain = get_base_domain(url)
        
        for a in soup.find_all('a', href=True):
            link = a['href']
            title = a.get_text(" ", strip=True)
            
            # Normalize link
            if not link.startswith('http'):
                link = urljoin(url, link)
            
            # Filter logic
            if len(title) < 15: # Too short to be a news headline
                continue
            
            # Skip common navigation items
            skip_words = ['ana sayfa', 'iletişim', 'künye', 'hakkımızda', 'reklam', 'yazarlar', 'foto galeri', 'video', 'gündem', 'spor', 'siyaset', 'arşiv']
            if any(w in title.lower() for w in skip_words) and len(title) < 30: 
                continue

            # Skip same-page links or files
            if '#' in link or link.endswith('.jpg') or link.endswith('.png') or link.endswith('.pdf'):
                continue
                
            # Domain check - ensure we are not collecting ads or external links
            if get_base_domain(link) != base_domain:
                 pass

            # Try to find date
            # Look in parent text (which often contains the snippet or metadata)
            parent_text = a.parent.get_text(" ", strip=True) if a.parent else ""
            found_date = find_date(link, parent_text, html_node=a)

            found_items.append({
                'title': title,
                'link': link,
                'source': url,
                'date': found_date
            })
            
    except Exception as e:
        print(f"Tarama hatasi ({url}): {e}")
        return []

    return found_items

def send_summary_email(news_items):
    """
    Sends a summary email with the list of new news items.
    """
    if not news_items:
        return

    print(f"Mail hazirlaniyor: {len(news_items)} yeni haber.")
    recipients = config.RECIPIENT_EMAILS
    
    msg = MIMEMultipart()
    msg['From'] = config.GMAIL_USER
    msg['To'] = ", ".join(recipients)
    
    date_str = datetime.datetime.now().strftime("%d-%m-%Y %H:%M")
    msg['Subject'] = f"Medya Takip Raporu - {date_str}"
    
    # Build HTML Table
    html_rows = ""
    for item in news_items:
        date_display = item['date'].strftime("%d.%m.%Y") if item['date'] else "-"
        html_rows += f"""
        <tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;"><b><a href="{item['link']}">{item['title']}</a></b></td>
            <td style="padding:8px; border-bottom:1px solid #ddd; color:#666;">{item['source']}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd; font-size:12px;">{date_display}</td>
        </tr>
        """
    
    body = f"""
    <html>
    <head>
    <style>
        table {{ width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }}
        th {{ background-color: #f2f2f2; padding: 10px; text-align: left; }}
    </style>
    </head>
    <body>
        <h2>Medya Takip Raporu ({date_str})</h2>
        <p>Aşağıdaki yeni haberler tespit edilmiştir:</p>
        <table>
            <thead>
                <tr>
                    <th>Başlık</th>
                    <th>Kaynak</th>
                    <th>Tarih</th>
                </tr>
            </thead>
            <tbody>
                {html_rows}
            </tbody>
        </table>
        <br>
        <small>Bu rapor xbodrum otomasyon sistemi tarafından oluşturulmuştur.</small>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(config.GMAIL_USER, config.GMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(config.GMAIL_USER, recipients, text)
        server.quit()
        print("Rapor maili basariyla gonderildi.")
    except Exception as e:
        print(f"Mail gonderme hatasi: {e}")

def job():
    print(f"\n[{datetime.datetime.now()}] Tarama basliyor...")
    
    if is_quiet_hours():
        print("Gece modu (00:00-06:00). Tarama yapilmiyor.")
        return

    history = load_history()
    seen_links = set(history)
    
    domain_states = load_domain_states()
    
    batch_seen_links = set()
    new_news_batch = []
    
    # Track updates to states
    states_updated = False

    for url in config.MONITOR_URLS:
        # Get last scraped date for this domain
        base_domain = get_base_domain(url)
        last_date_str = domain_states.get(base_domain)
        last_date = None
        if last_date_str:
            try:
                last_date = datetime.datetime.fromisoformat(last_date_str)
            except: pass
            
        items = extract_news_links(url)
        
        # Track max date for this domain in this run
        current_max_date = last_date
        
        # Tracking for 'today' requirements
        today_date = datetime.datetime.now().date()
        is_bodrumania = "bodrumania.com" in url

        for item in items:
            link = item['link']
            item_date = item['date']
            
            # If the site is bodrumania, enforce that the news is from exactly today
            if is_bodrumania:
                if not item_date or item_date.date() != today_date:
                    continue
            
            # Date Filtering Logic
            if item_date:
                # Son 24 saat dışındaki haberleri atla
                cutoff_24h = datetime.datetime.now() - datetime.timedelta(hours=24)
                if item_date < cutoff_24h:
                    continue

                # Update max date found
                if current_max_date is None or item_date > current_max_date:
                    current_max_date = item_date
                
                # Exclude if older than last_date
                # Note: We use strictly older (<) because sometimes we want to see news from the same day if we haven't seen them yet.
                # However, history logic also protects us. 
                if last_date and item_date < last_date:
                    continue
            
            # Link History Logic
            if link not in seen_links and link not in batch_seen_links:
                new_news_batch.append(item)
                batch_seen_links.add(link)
                seen_links.add(link)
        
        # Update state for this domain if we found a newer date
        if current_max_date and (last_date is None or current_max_date > last_date):
            domain_states[base_domain] = current_max_date.isoformat()
            states_updated = True
    
    if new_news_batch:
        print(f"Toplam {len(new_news_batch)} yeni haber bulundu.")
        send_summary_email(new_news_batch)
        
        history.extend([item['link'] for item in new_news_batch])
        save_history(history)
        
        if states_updated:
            save_domain_states(domain_states)
    elif states_updated:
        # Save states even if no new checked items (maybe we just updated dates but all links were in history?)
        # Actually logic above only adds to batch if not in history.
        # But if we updated max_date, we should save it.
        save_domain_states(domain_states)
        print("Tarih bilgileri guncellendi (yeni URL yok).")
    else:
        print("Yeni haber bulunamadi.")

if __name__ == "__main__":
    # Ilk calistirma
    try:
        job()
    except Exception as e:
        print(f"Ilk turda hata: {e}")

    # Zamanlama
    schedule.every().hour.do(job)
    
    print("Sistem saatlik tarama modunda calisiyor (Medya Takip).")
    while True:
        schedule.run_pending()
        time.sleep(60)

