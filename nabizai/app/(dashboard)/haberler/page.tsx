"use client";

import { useState, useEffect, useCallback } from "react";
import type { NewsItem } from "@/lib/db";
import { translateTag, translateTags } from "@/lib/tagTranslation";

const riskConfig = {
  high:   { label: "Yüksek Risk", color: "bg-nabiz-red",   textColor: "text-nabiz-red",   bg: "bg-red-50" },
  medium: { label: "Orta Risk",   color: "bg-nabiz-amber", textColor: "text-nabiz-amber", bg: "bg-amber-50" },
  low:    { label: "Düşük Risk",  color: "bg-nabiz-green", textColor: "text-nabiz-green", bg: "bg-green-50" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} gün önce`;
  if (h >= 1)  return `${h} saat önce`;
  if (m >= 1)  return `${m} dk önce`;
  return "Az önce";
}

function SkeletonRow() {
  return (
    <div className="px-6 py-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function HaberlerPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | string | null>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (search)                       params.set("search", search);
    if (riskFilter && riskFilter !== "all") params.set("risk_level", riskFilter);

    try {
      const res = await fetch(`/api/haberler?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchNews, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchNews, search]);

  async function handleScan() {
    setScanning(true);
    setScanMsg("");
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      setScanMsg(
        data.status === "done"
          ? `${data.new_items} yeni haber eklendi`
          : data.status === "timeout"
          ? "Tarama zaman aşımına uğradı"
          : "Tarama hatası"
      );
      if (data.new_items > 0) fetchNews();
    } catch {
      setScanMsg("Bağlantı hatası");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(""), 5000);
    }
  }

  const counts = {
    high:   items.filter((n) => n.risk_level === "high").length,
    medium: items.filter((n) => n.risk_level === "medium").length,
    low:    items.filter((n) => n.risk_level === "low").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-nabiz-dark">Haberler</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Yükleniyor..." : `${total} içerik tarandı`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {scanMsg && (
            <span className="text-sm font-semibold text-nabiz-green">{scanMsg}</span>
          )}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-nabiz-orange text-white text-sm font-semibold rounded-xl hover:bg-nabiz-orange-light transition-colors shadow-md shadow-nabiz-orange/20 disabled:opacity-60"
          >
            {scanning ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Taranıyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Şimdi Tara
              </>
            )}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nabiz-green/10 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nabiz-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-nabiz-green" />
            </span>
            <span className="text-xs font-semibold text-nabiz-green">Canlı</span>
          </div>
        </div>
      </div>

      {/* Risk özeti */}
      <div className="grid grid-cols-3 gap-4">
        {(["high", "medium", "low"] as const).map((r) => {
          const c = riskConfig[r];
          return (
            <button
              key={r}
              onClick={() => setRiskFilter(riskFilter === r ? "all" : r)}
              className={`${c.bg} border rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                riskFilter === r ? `ring-2 ring-offset-1 ${c.textColor} ring-current` : "border-transparent"
              } ${c.textColor}`}
            >
              <p className="text-3xl font-extrabold">{loading ? "—" : counts[r]}</p>
              <p className="text-sm font-semibold mt-1">{c.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Haberlerde ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
          />
        </div>
        {(riskFilter !== "all" || search) && (
          <button
            onClick={() => { setRiskFilter("all"); setSearch(""); }}
            className="px-3 py-2.5 text-xs text-nabiz-orange hover:underline bg-white border border-gray-200 rounded-xl"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            {loading ? "..." : `${items.length} sonuç`}
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : items.length === 0
            ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <p className="font-semibold">Sonuç bulunamadı</p>
                <p className="text-sm mt-1">Filtreleri değiştirin veya yeni tarama başlatın</p>
              </div>
            )
            : items.map((news) => {
              const r = riskConfig[news.risk_level] || riskConfig.low;
              const isOpen = expanded === news.id;
              return (
                <div
                  key={news.id}
                  className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : news.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${r.color} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-nabiz-dark leading-snug">{news.title}</p>
                        <svg
                          className={`w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-nabiz-navy/10 text-nabiz-navy">
                          {news.source}
                        </span>
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${r.bg} ${r.textColor}`}>
                          {r.label}
                        </span>
                        {news.category && news.category !== "uncategorized" && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-gray-100 text-gray-500">
                            {news.category}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{timeAgo(news.ingested_date)}</span>
                      </div>

                      {isOpen && (
                        <div className="mt-3 space-y-3">
                          {news.ai_summary && (
                            <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-nabiz-orange/30 pl-3">
                              {news.ai_summary}
                            </p>
                          )}
                          {news.risk_reason && (
                            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                              <span className="font-semibold">Risk notu:</span> {news.risk_reason}
                            </p>
                          )}
                          {news.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {translateTags(news.tags).map((t) => (
                                <span key={t} className="px-2 py-0.5 text-[10px] font-medium bg-nabiz-navy/5 text-nabiz-navy rounded-md">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-nabiz-orange hover:underline"
                          >
                            Kaynağa git
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
