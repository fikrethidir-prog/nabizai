"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { translateTag, translateTags } from "@/lib/tagTranslation";
import type { NewsItem } from "@/lib/db";

interface Stats {
  total: number;
  today: number;
  byStatus: Record<string, number>;
  topTags: { tag: string; count: number }[];
  bySource: { source: string; count: number }[];
}

function StatCard({ label, value, change, color }: { label: string; value: string; change?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-extrabold ${color}`}>{value}</span>
        {change && <span className="text-xs font-semibold mb-1 text-nabiz-green">{change}</span>}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} gün önce`;
  if (h >= 1) return `${h} saat önce`;
  if (m >= 1) return `${m} dk önce`;
  return "Az önce";
}

const riskColors: Record<string, string> = {
  high: "bg-nabiz-red",
  medium: "bg-nabiz-amber",
  low: "bg-nabiz-green",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sonHaberler, setSonHaberler] = useState<NewsItem[]>([]);
  const [aiBrifing, setAiBrifing] = useState<string>("");
  const [aiBrifingKaynak, setAiBrifingKaynak] = useState<string>("");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/haberler?limit=8")
      .then(r => r.json())
      .then(d => setSonHaberler(d.items || []))
      .catch(() => {});

    // AI Brifing
    fetch("/api/ai-brifing")
      .then(r => r.json())
      .then(d => {
        if (d.brifing) setAiBrifing(d.brifing);
        if (d.kaynak) setAiBrifingKaynak(d.kaynak);
      })
      .catch(() => {});
  }, []);

  const total = stats?.total ?? 0;
  const today = stats?.today ?? 0;
  const normalized = stats?.byStatus?.["normalized"] ?? stats?.byStatus?.["waiting_for_approval"] ?? 0;
  const topSource = stats?.bySource?.[0]?.source ?? "—";
  const topTags = stats?.topTags ?? [];
  const bySource = stats?.bySource ?? [];

  const highRisk = sonHaberler.filter(h => h.risk_level === "high").length;

  return (
    <div className="space-y-6">
      {/* AI Briefing */}
      <div className="gradient-orange rounded-2xl p-6 text-white shadow-lg shadow-nabiz-orange/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">AI Günlük Brifing</h3>
              {aiBrifingKaynak === "claude-ai" && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded-full">Claude AI</span>
              )}
            </div>
            {loading && !aiBrifing ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-white/20 rounded w-3/4" />
                <div className="h-3 bg-white/20 rounded w-1/2" />
              </div>
            ) : (
              <p className="text-white/90 text-sm leading-relaxed">
                {aiBrifing || (
                  <>
                    Sistemde toplam <strong>{total}</strong> içerik mevcut. Bugün <strong>{today}</strong> yeni içerik tarandı.
                    En aktif kaynak: <strong>{topSource}</strong>.
                    {topTags.length > 0 && (
                      <> Öne çıkan konular: <strong>{topTags.slice(0, 3).map((t) => translateTag(t.tag)).join(", ")}</strong>.</>
                    )}
                    {highRisk > 0 && (
                      <> ⚠️ <strong>{highRisk} yüksek riskli</strong> içerik tespit edildi.</>
                    )}
                  </>
                )}
              </p>
            )}
            <p className="text-white/50 text-xs mt-2">Gerçek zamanlı — {new Date().toLocaleString("tr-TR")}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam İçerik" value={loading ? "—" : String(total)} color="text-nabiz-navy" />
        <StatCard label="Bugün Eklenen" value={loading ? "—" : String(today)} change={today > 0 ? `+${today}` : undefined} color="text-nabiz-navy" />
        <StatCard label="İşlenen" value={loading ? "—" : String(normalized)} color="text-nabiz-green" />
        <StatCard label="Kaynak Sayısı" value={loading ? "—" : String(bySource.length)} color="text-nabiz-navy" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Son Haberler */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Son Haberler</h3>
            <Link href="/haberler" className="text-xs font-semibold text-nabiz-orange hover:underline">
              Tümünü Gör →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : sonHaberler.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Henüz haber yok. Tarama butonuna tıklayarak başlayın.
              </div>
            ) : (
              sonHaberler.map((h) => (
                <div key={h.id} className="px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${riskColors[h.risk_level] || "bg-gray-300"} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <a href={h.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-nabiz-dark leading-snug line-clamp-1 hover:text-nabiz-orange transition-colors">
                        {h.title}
                      </a>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-gray-400">{h.source}</span>
                        <span className="text-[11px] text-gray-300">·</span>
                        <span className="text-[11px] text-gray-400">{timeAgo(h.ingested_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Öne Çıkan Etiketler</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-wrap gap-2 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-7 bg-gray-100 rounded-lg w-20" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topTags.map(({ tag, count }, i) => {
                  const label = translateTag(tag);
                  return (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-default transition-all duration-200 hover:scale-105 ${
                        i < 3
                          ? "bg-nabiz-navy/10 text-nabiz-navy"
                          : i < 6
                          ? "bg-nabiz-orange/10 text-nabiz-orange"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      title={`${count} içerikte geçiyor`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kaynak Dağılımı + İçerik Durumları */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Kaynak Dağılımı */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Kaynak Dağılımı</h3>
            <span className="text-xs text-gray-400">{bySource.length} aktif kaynak</span>
          </div>
          <div className="p-6 space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="flex-1 h-3 bg-gray-100 rounded-full" />
                    <div className="h-3 bg-gray-100 rounded w-8" />
                  </div>
                ))
              : bySource.slice(0, 8).map((s) => (
                  <div key={s.source} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-36 truncate">{s.source}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-nabiz-navy rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((s.count / (bySource[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-nabiz-dark w-8 text-right">{s.count}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* İçerik Durumları */}
        {stats && Object.keys(stats.byStatus).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-nabiz-dark mb-4">İçerik Durumları</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="px-4 py-3 bg-gray-50 rounded-xl flex-1 min-w-[120px]">
                  <span className="text-xs text-gray-500 block capitalize">{status.replace(/_/g, " ")}</span>
                  <span className="text-2xl font-extrabold text-nabiz-dark">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
