/**
 * nabızai DB Abstraction Layer (v2)
 * ==================================
 * - SUPABASE_SERVICE_ROLE_KEY varsa → Supabase PostgreSQL kullanır
 * - Yoksa → SQLite + JSON dosyaları (lokal geliştirme) kullanır
 *
 * Tüm API route'ları bu modülü kullanır. Böylece deploy ortamı
 * otomatik olarak doğru DB'yi seçer.
 * 
 * Vercel'de fs erişimi yok → tüm veri Supabase'den gelir.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  is_safe: boolean;
  flags: string[];
  reason: string;
}

export interface NewsItem {
  id: number | string;
  source: string;
  title: string;
  url: string;
  status: string;
  category: string;
  published_date: string;
  ingested_date: string;
  tags: string[];
  ai_summary: string;
  image_url: string | null;
  risk_level: 'low' | 'medium' | 'high';
  risk_reason: string;
  is_safe: boolean;
  metadata?: Record<string, any>;
}

export interface StatsResult {
  total: number;
  today: number;
  byStatus: Record<string, number>;
  topTags: { tag: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export interface NewsFilters {
  search?: string;
  risk_level?: string;
  source?: string;
  limit?: number;
  offset?: number;
  client_ids?: string[];
}

export interface UserRecord {
  id: string;
  ad: string;
  email: string;
  sifre_hash: string;
  sifre_salt: string;
  rol: 'admin' | 'musteri';
  musteri_ids: string[];
}

export interface LogEntry {
  kullanici_id: string;
  ad: string;
  rol: string;
  eylem: string;
  detay: Record<string, unknown>;
}

export interface DemoTalep {
  id: string;
  ad: string;
  kurum?: string;
  sirket?: string;
  email: string;
  telefon?: string;
  sektor?: string;
  mesaj?: string;
  tarih?: string;
  durum: 'yeni' | 'iletisime_gecildi' | 'demo_yapildi' | 'musteri_oldu';
}

// ── Backend Detection ──────────────────────────────────────────────

const USE_SUPABASE =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key';

// ═══════════════════════════════════════════════════════════════════
// SUPABASE BACKEND
// ═══════════════════════════════════════════════════════════════════

async function supabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'public' } }
  );
}

function supabaseRowToNewsItem(row: Record<string, unknown>): NewsItem {
  return {
    id: row.id as string,
    source: (row.source as string) || '',
    title: (row.title as string) || '',
    url: (row.url as string) || '',
    status: (row.status as string) || 'new',
    category: (row.category as string) || '',
    published_date: (row.published_at as string) || '',
    ingested_date: (row.created_at as string) || '',
    tags: (row.tags as string[]) || [],
    ai_summary: (row.ai_summary as string) || '',
    image_url: (row.image_url as string) || null,
    risk_level: ((row.risk_level as string) || 'low') as 'low' | 'medium' | 'high',
    risk_reason: (row.risk_reason as string) || '',
    is_safe: (row.risk_level as string) !== 'high',
    metadata: (row.metadata as Record<string, any>) || {},
  };
}

async function getNewsSupabase(filters: NewsFilters): Promise<{ items: NewsItem[]; total: number }> {
  const sb = await supabaseClient();
  const { search, risk_level, source, limit = 50, offset = 0, client_ids } = filters;

  let query = sb.from('news_items').select('*', { count: 'exact' });

  if (client_ids && client_ids.length > 0) {
    query = query.in('client_id', client_ids);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }
  if (source) {
    query = query.eq('source', source);
  }
  if (risk_level && risk_level !== 'all') {
    query = query.eq('risk_level', risk_level);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Supabase getNews]', error);
    return { items: [], total: 0 };
  }

  return {
    items: (data || []).map(supabaseRowToNewsItem),
    total: count || 0,
  };
}

async function getCrisisItemsSupabase(client_ids?: string[]): Promise<NewsItem[]> {
  const sb = await supabaseClient();

  let query = sb.from('news_items').select('*')
    .in('risk_level', ['high', 'medium'])
    .order('created_at', { ascending: false })
    .limit(200);

  if (client_ids && client_ids.length > 0) {
    query = query.in('client_id', client_ids);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase getCrisisItems]', error);
    return [];
  }
  return (data || []).map(supabaseRowToNewsItem);
}

async function getStatsSupabase(client_ids?: string[]): Promise<StatsResult> {
  const sb = await supabaseClient();

  // Total
  let totalQuery = sb.from('news_items').select('*', { count: 'exact', head: true });
  if (client_ids?.length) totalQuery = totalQuery.in('client_id', client_ids);
  const { count: total } = await totalQuery;

  // Today
  const todayStr = new Date().toISOString().slice(0, 10);
  let todayQuery = sb.from('news_items').select('*', { count: 'exact', head: true })
    .gte('created_at', todayStr);
  if (client_ids?.length) todayQuery = todayQuery.in('client_id', client_ids);
  const { count: today } = await todayQuery;

  // By Source
  let sourceQuery = sb.from('news_items').select('source');
  if (client_ids?.length) sourceQuery = sourceQuery.in('client_id', client_ids);
  const { data: sourceData } = await sourceQuery;

  const sourceCounts: Record<string, number> = {};
  for (const r of sourceData || []) {
    const s = (r as Record<string, string>).source || 'unknown';
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  }
  const bySource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([source, count]) => ({ source, count }));

  // By Status
  let statusQuery = sb.from('news_items').select('status');
  if (client_ids?.length) statusQuery = statusQuery.in('client_id', client_ids);
  const { data: statusData } = await statusQuery;

  const byStatus: Record<string, number> = {};
  for (const r of statusData || []) {
    const s = (r as Record<string, string>).status || 'new';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  // Top Tags
  let tagsQuery = sb.from('news_items').select('tags');
  if (client_ids?.length) tagsQuery = tagsQuery.in('client_id', client_ids);
  const { data: tagsData } = await tagsQuery;

  const tagCounts: Record<string, number> = {};
  for (const r of tagsData || []) {
    const tags = (r as Record<string, string[]>).tags || [];
    for (const t of tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  return {
    total: total || 0,
    today: today || 0,
    byStatus,
    topTags,
    bySource,
  };
}

// ── Supabase: Kullanıcı Yönetimi ──────────────────────────────────

async function getUserByEmailSupabase(email: string): Promise<UserRecord | null> {
  const sb = await supabaseClient();
  const { data, error } = await sb.from('users').select('*').eq('email', email).single();
  if (error || !data) return null;
  return {
    id: data.id,
    ad: data.ad,
    email: data.email,
    sifre_hash: data.sifre_hash,
    sifre_salt: data.sifre_salt,
    rol: data.rol,
    musteri_ids: data.musteri_ids || [],
  };
}

async function getAllUsersSupabase(): Promise<UserRecord[]> {
  const sb = await supabaseClient();
  const { data, error } = await sb.from('users').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    ad: d.ad as string,
    email: d.email as string,
    sifre_hash: d.sifre_hash as string,
    sifre_salt: d.sifre_salt as string,
    rol: d.rol as 'admin' | 'musteri',
    musteri_ids: (d.musteri_ids as string[]) || [],
  }));
}

// ── Supabase: Log ─────────────────────────────────────────────────

async function appendLogSupabase(entry: LogEntry): Promise<void> {
  try {
    const sb = await supabaseClient();
    await sb.from('logs').insert({
      kullanici_id: entry.kullanici_id,
      ad: entry.ad,
      rol: entry.rol,
      eylem: entry.eylem,
      detay: entry.detay,
    });
  } catch (e) {
    console.error('[Supabase appendLog]', e);
  }
}

async function getLogsSupabase(limit = 100): Promise<Record<string, unknown>[]> {
  const sb = await supabaseClient();
  const { data, error } = await sb.from('logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) return [];
  return (data || []).map((d: Record<string, unknown>) => ({
    ts: d.created_at,
    kullanici_id: d.kullanici_id,
    ad: d.ad,
    rol: d.rol,
    eylem: d.eylem,
    detay: d.detay || {},
  }));
}

// ── Supabase: Demo Talepleri ──────────────────────────────────────

async function addDemoRequestSupabase(talep: DemoTalep): Promise<string> {
  const sb = await supabaseClient();
  const { data, error } = await sb.from('demo_requests').insert({
    ad: talep.ad,
    email: talep.email,
    sirket: talep.kurum || talep.sirket || '',
    telefon: talep.telefon || '',
    mesaj: talep.mesaj || '',
    durum: 'yeni',
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function getDemoRequestsSupabase(): Promise<DemoTalep[]> {
  const sb = await supabaseClient();
  const { data, error } = await sb.from('demo_requests').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    ad: d.ad as string,
    email: d.email as string,
    kurum: (d.sirket as string) || '',
    sirket: (d.sirket as string) || '',
    telefon: (d.telefon as string) || '',
    mesaj: (d.mesaj as string) || '',
    tarih: d.created_at as string,
    durum: (d.durum as DemoTalep['durum']) || 'yeni',
  }));
}

// ═══════════════════════════════════════════════════════════════════
// SQLITE BACKEND (lokal geliştirme)
// ═══════════════════════════════════════════════════════════════════

function getSqliteDb() {
  // Dynamic import to avoid bundling issues in production
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  const DB_PATH = path.join(process.cwd(), '..', 'data', 'medya_takip.db');
  return new Database(DB_PATH, { readonly: true });
}

function parseRow(row: Record<string, unknown>): NewsItem {
  let tags: string[] = [];
  let meta: Record<string, unknown> = {};

  try { tags = JSON.parse(row.tags as string || '[]'); } catch { tags = []; }
  try { meta = JSON.parse(row.metadata as string || '{}'); } catch { meta = {}; }

  const risk = (meta.risk_assessment as RiskAssessment) || {};

  return {
    id: row.id as number,
    source: row.source as string,
    title: row.title as string,
    url: row.url as string,
    status: row.status as string,
    category: row.category as string,
    published_date: row.published_date as string,
    ingested_date: row.ingested_date as string,
    tags,
    ai_summary: (meta.ai_summary as string) || '',
    image_url: (meta.image_url as string) || null,
    risk_level: risk.risk_level || 'low',
    risk_reason: risk.reason || '',
    is_safe: risk.is_safe !== false,
    metadata: meta,
  };
}

function getNewsSqlite(filters: NewsFilters): { items: NewsItem[]; total: number } {
  const db = getSqliteDb();
  const { search, risk_level, source, limit = 50, offset = 0, client_ids } = filters;

  let where = '1=1';
  const params: unknown[] = [];

  if (client_ids && client_ids.length > 0) {
    const placeholders = client_ids.map(() => '?').join(',');
    where += ` AND client_id IN (${placeholders})`;
    params.push(...client_ids);
  }
  if (search) {
    where += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (source) {
    where += ' AND source = ?';
    params.push(source);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM content WHERE ${where}`).get(...params) as { cnt: number };
  const total = countRow.cnt;

  const rows = db.prepare(
    `SELECT id, source, title, url, status, category, published_date, ingested_date, tags, metadata
     FROM content WHERE ${where}
     ORDER BY ingested_date DESC
     LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Record<string, unknown>[];

  let items = rows.map(parseRow);

  if (risk_level && risk_level !== 'all') {
    items = items.filter((i) => i.risk_level === risk_level);
  }

  db.close();
  return { items, total };
}

function getCrisisItemsSqlite(client_ids?: string[]): NewsItem[] {
  const db = getSqliteDb();
  let where = '1=1';
  const params: unknown[] = [];
  if (client_ids && client_ids.length > 0) {
    const ph = client_ids.map(() => '?').join(',');
    where += ` AND client_id IN (${ph})`;
    params.push(...client_ids);
  }
  const rows = db.prepare(
    `SELECT id, source, title, url, status, category, published_date, ingested_date, tags, metadata
     FROM content WHERE ${where}
     ORDER BY ingested_date DESC
     LIMIT 200`
  ).all(...params) as Record<string, unknown>[];

  const items = rows.map(parseRow);
  db.close();
  return items.filter(i => i.risk_level === 'high' || i.risk_level === 'medium');
}

function getStatsSqlite(client_ids?: string[]): StatsResult {
  const db = getSqliteDb();
  let where = '1=1';
  const params: unknown[] = [];
  if (client_ids && client_ids.length > 0) {
    const ph = client_ids.map(() => '?').join(',');
    where += ` AND client_id IN (${ph})`;
    params.push(...client_ids);
  }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM content WHERE ${where}`).get(...params) as { cnt: number }).cnt;

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = (
    db.prepare(`SELECT COUNT(*) as cnt FROM content WHERE ${where} AND ingested_date LIKE ?`).get(...params, `${todayStr}%`) as { cnt: number }
  ).cnt;

  const statusRows = db.prepare(`SELECT status, COUNT(*) as cnt FROM content WHERE ${where} GROUP BY status`).all(...params) as { status: string; cnt: number }[];
  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r.status] = r.cnt;

  const sourceRows = db.prepare(
    `SELECT source, COUNT(*) as cnt FROM content WHERE ${where} GROUP BY source ORDER BY cnt DESC LIMIT 10`
  ).all(...params) as { source: string; cnt: number }[];
  const bySource = sourceRows.map((r) => ({ source: r.source, count: r.cnt }));

  const tagRows = db.prepare(`SELECT tags FROM content WHERE ${where}`).all(...params) as { tags: string }[];
  const tagCount: Record<string, number> = {};
  for (const { tags } of tagRows) {
    try {
      const arr: string[] = JSON.parse(tags || '[]');
      for (const t of arr) tagCount[t] = (tagCount[t] || 0) + 1;
    } catch { /* skip */ }
  }
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  db.close();
  return { total, today, byStatus, topTags, bySource };
}

// ── SQLite: Kullanıcı Yönetimi (dosya tabanlı) ───────────────────

function getUserByEmailSqlite(email: string): UserRecord | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const users = JSON.parse(raw) as UserRecord[];
    return users.find(u => u.email === email) || null;
  } catch {
    return null;
  }
}

function getAllUsersSqlite(): UserRecord[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'kullanicilar.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

// ── SQLite: Log (dosya tabanlı) ──────────────────────────────────

function appendLogSqlite(entry: LogEntry): void {
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), '..', 'data');
    const logFile = path.join(dataDir, 'audit_log.jsonl');
    fs.mkdirSync(dataDir, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch { /* log hataları ana akışı bloklamamalı */ }
}

function getLogsSqlite(limit = 100): Record<string, unknown>[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(process.cwd(), '..', 'data', 'audit_log.jsonl');
    if (!fs.existsSync(logFile)) return [];
    const raw = fs.readFileSync(logFile, 'utf-8');
    return raw.trim().split('\n')
      .filter((l: string) => l.trim())
      .map((l: string) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean)
      .reverse()
      .slice(0, limit);
  } catch { return []; }
}

// ── SQLite: Demo Talepleri (dosya tabanlı) ────────────────────────

function addDemoRequestSqlite(talep: DemoTalep): string {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), '..', 'data', 'demo_talepleri.json');
  let talepler: DemoTalep[] = [];
  try {
    if (fs.existsSync(filePath)) {
      talepler = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch { talepler = []; }

  const id = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const yeni: DemoTalep = {
    ...talep,
    id,
    tarih: new Date().toISOString(),
    durum: 'yeni',
  };
  talepler.push(yeni);
  fs.writeFileSync(filePath, JSON.stringify(talepler, null, 2), 'utf-8');
  return id;
}

function getDemoRequestsSqlite(): DemoTalep[] {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), '..', 'data', 'demo_talepleri.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT — Otomatik backend seçimi
// ═══════════════════════════════════════════════════════════════════

// ── Haberler ──────────────────────────────────────────────────────
export async function getNews(filters: NewsFilters = {}): Promise<{ items: NewsItem[]; total: number }> {
  if (USE_SUPABASE) return getNewsSupabase(filters);
  return getNewsSqlite(filters);
}

export async function getCrisisItems(client_ids?: string[]): Promise<NewsItem[]> {
  if (USE_SUPABASE) return getCrisisItemsSupabase(client_ids);
  return getCrisisItemsSqlite(client_ids);
}

export async function getStats(client_ids?: string[]): Promise<StatsResult> {
  if (USE_SUPABASE) return getStatsSupabase(client_ids);
  return getStatsSqlite(client_ids);
}

// ── Kullanıcılar ──────────────────────────────────────────────────
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  if (USE_SUPABASE) return getUserByEmailSupabase(email);
  return getUserByEmailSqlite(email);
}

export async function getAllUsers(): Promise<UserRecord[]> {
  if (USE_SUPABASE) return getAllUsersSupabase();
  return getAllUsersSqlite();
}

// ── Loglar ────────────────────────────────────────────────────────
export async function appendLog(entry: LogEntry): Promise<void> {
  if (USE_SUPABASE) return appendLogSupabase(entry);
  appendLogSqlite(entry);
}

export async function getLogs(limit = 100): Promise<Record<string, unknown>[]> {
  if (USE_SUPABASE) return getLogsSupabase(limit);
  return getLogsSqlite(limit);
}

// ── Demo Talepleri ────────────────────────────────────────────────
export async function addDemoRequest(talep: DemoTalep): Promise<string> {
  if (USE_SUPABASE) return addDemoRequestSupabase(talep);
  return addDemoRequestSqlite(talep);
}

export async function getDemoRequests(): Promise<DemoTalep[]> {
  if (USE_SUPABASE) return getDemoRequestsSupabase();
  return getDemoRequestsSqlite();
}

// ── Utility ───────────────────────────────────────────────────────
export function isSupabaseMode(): boolean {
  return USE_SUPABASE;
}

// Hangi backend kullanıldığını logla (ilk import'ta)
console.log(`[nabızai DB] Backend: ${USE_SUPABASE ? '☁️ Supabase PostgreSQL' : '💾 SQLite (lokal)'}`);
