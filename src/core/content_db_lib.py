import sqlite3
import json
from typing import List, Dict, Any
from datetime import datetime

class ContentDB:
    def __init__(self, db_path="content_store.db"):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Main content table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id TEXT,
                source TEXT,
                title TEXT,
                content TEXT,
                url TEXT,
                published_date TEXT,
                ingested_date TEXT,
                status TEXT DEFAULT 'new',
                tags TEXT,
                category TEXT,
                metadata TEXT,
                UNIQUE(source, source_id)
            )
        ''')
        
        # User profiles table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                interests TEXT,
                last_visit TEXT,
                segment TEXT
            )
        ''')

        # Comments table for social listening
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                content_id INTEGER,
                platform TEXT,
                text TEXT,
                user TEXT,
                intent TEXT,
                sentiment TEXT,
                reply_sent TEXT,
                status TEXT DEFAULT 'new',
                ingested_at TEXT,
                FOREIGN KEY(content_id) REFERENCES content(id)
            )
        ''')

        # Publish log – her Instagram/sosyal medya yayınını kaydeder
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS publish_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_id INTEGER,
                platform TEXT NOT NULL,
                ig_media_id TEXT,
                permalink TEXT,
                image_url TEXT,
                caption TEXT,
                status TEXT DEFAULT 'published',
                published_at TEXT,
                error_message TEXT,
                FOREIGN KEY(content_id) REFERENCES content(id)
            )
        ''')

        # ── Schema Migrations ─────────────────────────────────────
        # Ensure 'analysis' column exists in comments table (added post-v1)
        try:
            cursor.execute("ALTER TABLE comments ADD COLUMN analysis TEXT")
        except Exception:
            pass  # column already exists

        conn.commit()
        conn.close()

    def add_content(self, item: Dict[str, Any]) -> bool:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            now = datetime.now().isoformat()
            cursor.execute('''
                INSERT INTO content (
                    source_id, source, title, content, url, published_date, 
                    ingested_date, status, tags, category, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(item.get('id', '')),
                item.get('source', 'unknown'),
                item.get('title', ''),
                item.get('content', ''),
                item.get('url', ''),
                item.get('published_date', ''),
                now,
                'new',
                json.dumps(item.get('tags', [])),
                item.get('category', 'uncategorized'),
                json.dumps(item.get('metadata', {}))
            ))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False 
        except Exception as e:
            print(f"DB Error: {e}")
            return False
        finally:
            conn.close()

    def get_pending_content(self, limit=10, status='new') -> List[Dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM content WHERE status = ? ORDER BY id DESC LIMIT ?", (status, limit))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            r = dict(row)
            # Parse JSON fields if necessary
            if r.get('tags'):
                try:
                    r['tags'] = json.loads(r['tags'])
                except:
                    r['tags'] = []
            
            if r.get('metadata'):
                try:
                    r['metadata'] = json.loads(r['metadata'])
                except:
                    r['metadata'] = {}
            else:
                r['metadata'] = {}
            results.append(r)
            
        conn.close()
        return results

    def update_metadata(self, db_id: int, metadata: Dict):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE content SET metadata = ? WHERE id = ?", (json.dumps(metadata), db_id))
        conn.commit()
        conn.close()

    def update_status(self, db_id: int, status: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE content SET status = ? WHERE id = ?", (status, db_id))
        conn.commit()
        conn.close()

    def update_item_content(self, db_id: int, content: str, tags: List[str]):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE content SET content = ?, tags = ? WHERE id = ?", (content, json.dumps(tags), db_id))
        conn.commit()
        conn.close()

    def get_content_by_tag(self, tag_keyword, limit=5):
        """Simple text search in tags column."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # LIKE query for simple keyword matching in JSON string or text component
        cursor.execute("SELECT * FROM content WHERE tags LIKE ? ORDER BY ingested_date DESC LIMIT ?", (f'%{tag_keyword}%', limit))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            r = dict(row)
            # Parse JSON fields
            if r.get('tags'):
                try: 
                    r['tags'] = json.loads(r['tags'])
                except: 
                    r['tags'] = []
            if r.get('metadata'):
                try: 
                    r['metadata'] = json.loads(r['metadata'])
                except: 
                    r['metadata'] = {}
            results.append(r)
            
        conn.close()
        return results

    def get_stats(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT status, COUNT(*) FROM content GROUP BY status")
        rows = cursor.fetchall()
        conn.close()
        return dict(rows)

    def get_top_tags(self, limit=5):
        """Returns most frequent tags."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Since tags are stored as JSON strings in this simple setup,
        # we realistically pull all and count in python for now, 
        # or use simple text matching if valid. 
        # For prototype speed:
        cursor.execute("SELECT tags FROM content")
        rows = cursor.fetchall()
        conn.close()
        
        tag_counts = {}
        for row in rows:
            try:
                tags = json.loads(row[0])
                for tag in tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
            except:
                pass
        
        # Sort by count desc
        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        return sorted_tags[:limit]
        
    def log_crisis_event(self, topic, count, risk_level):
        """Logs a crisis event."""
        # Ideally we'd have a separate table, but printing to log is fine for now
        print(f"!!! CRISIS LOGGED in DB: {topic} (Count: {count}, Level: {risk_level})")

    def add_comment(self, comment_data: Dict[str, Any]):
        """Adds a comment to the DB."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO comments (id, content_id, platform, text, user, intent, sentiment, reply_sent, status, ingested_at, analysis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(comment_data.get('id')),
                comment_data.get('content_id'), # Can be None
                comment_data.get('platform'),
                comment_data.get('text'),
                comment_data.get('user'),
                comment_data.get('intent'),
                comment_data.get('sentiment'),
                comment_data.get('reply_sent'),
                'processed',
                datetime.now().isoformat(),
                json.dumps(comment_data.get('analysis', {}))
            ))
            conn.commit()
        except Exception as e:
            print(f"Error adding comment: {e}")
        finally:
            conn.close()

    def get_comments(self, limit=50):
        """Retrieves comments for dashboard."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM comments ORDER BY ingested_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        
        results = [dict(row) for row in rows]
        conn.close()
        return results

    def get_comments_by_content(self, content_id):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM comments WHERE content_id = ? ORDER BY ingested_at DESC", (content_id,))
        rows = cursor.fetchall()
        
        results = [dict(row) for row in rows]
        conn.close()
        return results

    # ── Publish Log ───────────────────────────────────────────────
    def log_publish(
        self,
        content_id: int,
        platform: str,
        ig_media_id: str = None,
        permalink: str = None,
        image_url: str = None,
        caption: str = None,
        status: str = "published",
        error_message: str = None,
    ):
        """Yayınlanan bir içeriği publish_log tablosuna kaydeder."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO publish_log
                    (content_id, platform, ig_media_id, permalink, image_url, caption, status, published_at, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                content_id,
                platform,
                ig_media_id,
                permalink,
                image_url,
                caption[:500] if caption else None,
                status,
                datetime.now().isoformat(),
                error_message,
            ))
            conn.commit()
        except Exception as e:
            print(f"DB log_publish error: {e}")
        finally:
            conn.close()

    def get_publish_log(self, limit: int = 50) -> List[Dict]:
        """Son yayınları getirir (dashboard için)."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pl.*, c.title as content_title
            FROM publish_log pl
            LEFT JOIN content c ON pl.content_id = c.id
            ORDER BY pl.published_at DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def get_comments_with_context(self, limit=50):
        """Retrieves comments joined with content titles."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # We need a LEFT JOIN to ensure we get comments even if content is deleted, 
        # though ideally data integrity is maintained.
        query = """
            SELECT comments.*, content.title as content_title 
            FROM comments 
            LEFT JOIN content ON comments.content_id = content.id
            ORDER BY comments.ingested_at DESC 
            LIMIT ?
        """
        cursor.execute(query, (limit,))
        rows = cursor.fetchall()
        
        results = []
        for row in rows:
            r = dict(row)
            # Add title if missing
            if not r.get('content_title'):
                r['content_title'] = "Bilinmeyen İçerik"
            results.append(r)
            
        conn.close()
        return results

    def get_all_content(self, limit: int = 200) -> List[Dict]:
        """Tüm içerikleri getirir (status fark etmeksizin)."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM content ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        results = []
        for row in rows:
            r = dict(row)
            if r.get('tags'):
                try:
                    r['tags'] = json.loads(r['tags'])
                except:
                    r['tags'] = []
            if r.get('metadata'):
                try:
                    r['metadata'] = json.loads(r['metadata'])
                except:
                    r['metadata'] = {}
            results.append(r)
        conn.close()
        return results

    def search_content(self, query: str, limit: int = 20) -> List[Dict]:
        """Başlık veya içerikte arama yapar."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM content WHERE title LIKE ? OR content LIKE ? ORDER BY id DESC LIMIT ?",
            (f"%{query}%", f"%{query}%", limit)
        )
        rows = cursor.fetchall()
        results = []
        for row in rows:
            r = dict(row)
            if r.get('tags'):
                try:
                    r['tags'] = json.loads(r['tags'])
                except:
                    r['tags'] = []
            if r.get('metadata'):
                try:
                    r['metadata'] = json.loads(r['metadata'])
                except:
                    r['metadata'] = {}
            results.append(r)
        conn.close()
        return results
