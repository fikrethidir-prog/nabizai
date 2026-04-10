"""
Agent-Mailer: E-posta Bildirim Sistemi
=======================================
Medya takip raporlarını ve uyarıları e-posta ile gönderir.
Alıcı bazlı bildirim yönlendirmesi destekler.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
import os
import json

AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.dirname(AGENT_DIR)
sys.path.insert(0, SRC_DIR)
sys.path.insert(0, os.path.join(SRC_DIR, "core"))

from core.config import Config


class MailerAgent:
    def __init__(self):
        self.name = "Agent-Mailer"
        self.user = Config.GMAIL_USER
        self.password = Config.GMAIL_PASSWORD
        self.rcpt_file = os.path.join(Config.DATA_DIR, "recipients.json")
        self.recipients = self._load_recipients()

    def _safe_print(self, msg):
        """Windows cp1254 safe print."""
        try:
            print(msg)
        except UnicodeEncodeError:
            print(msg.encode('ascii', errors='replace').decode('ascii'))

    def _load_recipients_data(self):
        """Load full recipients data from JSON."""
        try:
            if os.path.exists(self.rcpt_file):
                with open(self.rcpt_file, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return {"sender": Config.GMAIL_USER, "recipients": []}

    def _load_recipients(self):
        """Load all active recipient emails."""
        data = self._load_recipients_data()
        active = [r["email"] for r in data.get("recipients", []) if r.get("active", True)]
        if active:
            return active
        return Config.RECIPIENT_EMAILS

    def _get_recipients_for(self, notification_type):
        """Get recipients who opted-in for a specific notification type."""
        data = self._load_recipients_data()
        filtered = []
        for r in data.get("recipients", []):
            if not r.get("active", True):
                continue
            if r.get("notifications", {}).get(notification_type, False):
                filtered.append(r["email"])
        return filtered if filtered else self.recipients

    def send_email(self, subject, body_html, notification_type=None, target_emails=None):
        """Send email with optional notification-type-based recipient filtering."""
        if not self.password:
            print(f"[{self.name}] Error: No GMAIL_PASSWORD set. Email not sent.")
            return False

        # Determine recipients
        if target_emails:
            to_list = target_emails if isinstance(target_emails, list) else [target_emails]
        elif notification_type:
            to_list = self._get_recipients_for(notification_type)
        else:
            to_list = self.recipients

        if not to_list:
            print(f"[{self.name}] No recipients for notification type: {notification_type}")
            return False

        msg = MIMEMultipart()
        msg['From'] = self.user
        msg['To'] = ", ".join(to_list)
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.user, self.password)
            server.sendmail(self.user, to_list, msg.as_string())
            server.quit()
            self._safe_print(f"[{self.name}] Email sent ({notification_type or 'all'}): {subject} -> {', '.join(to_list)}")
            return True
        except Exception as e:
            self._safe_print(f"[{self.name}] Email failed: {e}")
            return False

    def send_analysis_report(self, report_content):
        subject = "Gunluk Medya Analiz Raporu"
        body = f"""
        <h2>Günlük Medya Analiz Raporu</h2>
        <pre style="font-family: Arial; white-space: pre-wrap;">{report_content}</pre>
        """
        return self.send_email(subject, body, notification_type='gunluk_rapor')
