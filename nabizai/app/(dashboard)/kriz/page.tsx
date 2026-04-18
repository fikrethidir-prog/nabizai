"use client";

import { useState, useEffect } from "react";
import type { NewsItem } from "@/lib/db";
import { translateTags } from "@/lib/tagTranslation";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor(diff / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)} gün önce`;
  if (h >= 1) return `${h} saat önce`;
  if (m >= 1) return `${m} dk önce`;
  return "Az önce";
}

function crisisScore(item: NewsItem): number {
  let score = 0;
  // Risk seviyesine göre baz skor
  if (item.risk_level === "high") score = 7.5;
  else if (item.risk_level === "medium") score = 5.0;
  else score = 2.0;

  // AI özeti varsa +0.5 (daha derin analiz yapılmış)
  if (item.ai_summary && item.ai_summary.length > 50) score += 0.3;

  // Risk açıklaması uzunsa, daha detaylı değerlendirme yapılmış
  if (item.risk_reason && item.risk_reason.length > 100) score += 0.5;

  // Etiket sayısına göre ince ayar
  if (item.tags.length > 3) score += 0.2;

  // 0-10 arasında sınırla
  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "text-nabiz-red bg-red-100 border-red-200"
      : score >= 5
      ? "text-nabiz-amber bg-amber-100 border-amber-200"
      : "text-nabiz-green bg-green-100 border-green-200";
  return (
    <span className={`px-3 py-1 text-sm font-extrabold rounded-xl border ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

export default function KrizPage() {
  const [alerts, setAlerts] = useState<(NewsItem & { score: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  useEffect(() => {
    fetch("/api/kriz")
      .then((r) => r.json())
      .then((data) => {
        const scored = (data.alerts || []).map((item: NewsItem) => ({
          ...item,
          score: crisisScore(item),
        }));
        // Yüksek riskler önce
        scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
        setAlerts(scored);
        if (scored.length > 0) setSelectedId(scored[0].id);
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = alerts.find((a) => a.id === selectedId);
  const highCount = alerts.filter((a) => a.risk_level === "high").length;
  const medCount = alerts.filter((a) => a.risk_level === "medium").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nabiz-dark">Kriz Takibi</h1>
          <p className="text-sm text-gray-400 mt-0.5">Risk değerlendirmeli içerikler</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nabiz-red/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-nabiz-red animate-pulse" />
            <span className="text-xs font-semibold text-nabiz-red">
              {highCount} yüksek · {medCount} orta
            </span>
          </div>
        )}
      </div>

      {/* Risk skala */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { range: "0–4", label: "Düşük Risk", color: "bg-green-50 border-green-100 text-nabiz-green" },
          { range: "5–7", label: "Orta Risk", color: "bg-amber-50 border-amber-100 text-nabiz-amber" },
          { range: "8–10", label: "Yüksek Risk", color: "bg-red-50 border-red-100 text-nabiz-red" },
        ].map((r) => (
          <div key={r.range} className={`${r.color} border rounded-xl px-4 py-3 text-center`}>
            <p className="text-lg font-extrabold">{r.range}</p>
            <p className="text-xs font-semibold mt-0.5">{r.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded" />
              ))}
            </div>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-nabiz-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-400 mb-2">Aktif kriz uyarısı yok</h3>
          <p className="text-sm text-gray-300">Tüm içerikler düşük risk seviyesinde</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Alert list */}
          <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              {alerts.length} uyarı
            </p>
            {alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedId(alert.id)}
                className={`w-full text-left bg-white rounded-2xl border p-4 transition-all duration-200 hover:shadow-md ${
                  selectedId === alert.id
                    ? "border-nabiz-orange shadow-md shadow-nabiz-orange/10"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-nabiz-dark leading-snug line-clamp-2">
                    {alert.title}
                  </p>
                  <ScoreBadge score={alert.score} />
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    alert.risk_level === "high"
                      ? "bg-red-100 text-nabiz-red"
                      : "bg-amber-100 text-nabiz-amber"
                  }`}>
                    {alert.risk_level === "high" ? "Yüksek" : "Orta"} Risk
                  </span>
                  <span className="text-xs text-gray-400">{alert.source}</span>
                  <span className="text-xs text-gray-400">{timeAgo(alert.ingested_date)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="font-extrabold text-nabiz-dark text-lg leading-snug">
                        {selected.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-sm text-gray-400">{selected.source}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-400">{timeAgo(selected.ingested_date)}</span>
                      </div>
                    </div>
                    <ScoreBadge score={selected.score} />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* AI özeti */}
                  {selected.ai_summary && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Özeti</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                        {selected.ai_summary}
                      </p>
                    </div>
                  )}

                  {/* Risk açıklaması */}
                  {selected.risk_reason && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Risk Değerlendirmesi</p>
                      <div className={`rounded-xl px-4 py-3 border ${
                        selected.risk_level === "high"
                          ? "bg-red-50 border-red-100"
                          : "bg-amber-50 border-amber-100"
                      }`}>
                        <p className="text-sm text-gray-700 leading-relaxed">{selected.risk_reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Etiketler */}
                  {selected.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Etiketler</p>
                      <div className="flex flex-wrap gap-2">
                        {translateTags(selected.tags).map((t) => (
                          <span key={t} className="px-3 py-1 bg-nabiz-navy/8 text-nabiz-navy text-xs font-semibold rounded-lg">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kaynak linki */}
                  <div className="pt-2 border-t border-gray-50">
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-nabiz-navy text-white text-sm font-semibold rounded-xl hover:bg-nabiz-navy-light transition-colors"
                    >
                      Kaynağa git
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 h-48 flex items-center justify-center text-gray-400">
                Bir uyarı seçin
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
