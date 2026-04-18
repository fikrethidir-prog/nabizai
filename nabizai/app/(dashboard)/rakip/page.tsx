"use client";

import { useState, useEffect } from "react";

interface KaynakStat {
  source: string;
  count: number;
}

interface TagStat {
  tag: string;
  count: number;
}

interface StatsData {
  total: number;
  today: number;
  bySource: KaynakStat[];
  topTags: TagStat[];
  byStatus: Record<string, number>;
}

function BarChart({ data, color, maxVal }: { data: { label: string; value: number }[]; color: string; maxVal: number }) {
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-32 truncate text-right font-medium">{d.label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
              style={{ width: `${Math.round((d.value / (maxVal || 1)) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-nabiz-dark w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RakipPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const bySource = stats?.bySource ?? [];
  const topTags = stats?.topTags ?? [];
  const total = stats?.total ?? 0;
  const today = stats?.today ?? 0;

  // Kaynak bazlı performans analizi
  const topSourceMax = bySource[0]?.count || 1;

  // Kaynak çeşitliliği skoru (0-100)
  const diversityScore = bySource.length > 0 
    ? Math.min(100, Math.round((bySource.length / 26) * 100))
    : 0;

  // Günlük aktivite yoğunluğu
  const activityRate = total > 0 ? Math.round((today / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-nabiz-dark">Rakip Analiz</h1>
        <p className="text-sm text-gray-400 mt-0.5">Bölgesel medya performans karşılaştırması</p>
      </div>

      {/* Medya izleme kapsamı - üst kart */}
      <div className="gradient-orange rounded-2xl p-6 text-white shadow-lg shadow-nabiz-orange/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Medya İzleme Kapsamı</p>
            <p className="text-5xl font-extrabold mt-1">{loading ? "—" : bySource.length}</p>
            <p className="text-white/80 text-sm mt-2">
              Aktif <span className="font-bold text-white">kaynak</span> taranıyor
            </p>
          </div>
          <div className="text-right space-y-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performans Skor Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <p className="text-sm text-gray-500 mb-1">Toplam İçerik</p>
          <p className="text-3xl font-extrabold text-nabiz-navy">{loading ? "—" : total}</p>
          <p className="text-xs text-gray-400 mt-1">Tüm zamanlar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <p className="text-sm text-gray-500 mb-1">Bugün Eklenen</p>
          <p className="text-3xl font-extrabold text-nabiz-orange">{loading ? "—" : today}</p>
          <p className="text-xs text-gray-400 mt-1">Son 24 saat</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <p className="text-sm text-gray-500 mb-1">Kaynak Çeşitliliği</p>
          <div className="flex items-end gap-1">
            <p className="text-3xl font-extrabold text-nabiz-green">{loading ? "—" : `%${diversityScore}`}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{bySource.length}/26 aktif kaynak</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
          <p className="text-sm text-gray-500 mb-1">Günlük Aktivite</p>
          <p className="text-3xl font-extrabold text-nabiz-amber">{loading ? "—" : `%${activityRate}`}</p>
          <p className="text-xs text-gray-400 mt-1">Bugün / Toplam oran</p>
        </div>
      </div>

      {/* Main Grid: Kaynak Performansı + Konu Dağılımı */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Kaynak Performansı */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Kaynak Performans Sıralaması</h3>
            <span className="text-xs text-gray-400">{bySource.length} kaynak</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded-full" />
                ))}
              </div>
            ) : bySource.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Henüz kaynak verisi yok</p>
            ) : (
              <BarChart
                data={bySource.slice(0, 10).map((s) => ({ label: s.source, value: s.count }))}
                color="bg-nabiz-navy"
                maxVal={topSourceMax}
              />
            )}
          </div>
        </div>

        {/* Konu Dağılımı */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Konu Dağılım Analizi</h3>
            <span className="text-xs text-gray-400">{topTags.length} konu</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-5 bg-gray-100 rounded-full" />
                ))}
              </div>
            ) : topTags.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Henüz konu verisi yok</p>
            ) : (
              <BarChart
                data={topTags.slice(0, 10).map((t) => ({ label: t.tag, value: t.count }))}
                color="bg-nabiz-orange"
                maxVal={topTags[0]?.count || 1}
              />
            )}
          </div>
        </div>
      </div>

      {/* Kaynak Detay Tablosu */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-bold text-nabiz-dark">Detaylı Kaynak Karşılaştırması</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Kaynak</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">İçerik Sayısı</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Oran</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Performans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : bySource.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Veri bekleniyor</td>
                </tr>
              ) : (
                bySource.map((s, idx) => {
                  const pct = Math.round((s.count / total) * 100);
                  const perf = pct >= 15 ? "Yüksek" : pct >= 5 ? "Orta" : "Düşük";
                  const perfColor = perf === "Yüksek" ? "bg-green-100 text-nabiz-green" : perf === "Orta" ? "bg-amber-100 text-nabiz-amber" : "bg-gray-100 text-gray-500";
                  return (
                    <tr key={s.source} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-6 py-3 font-semibold text-nabiz-dark">{s.source}</td>
                      <td className="px-6 py-3 font-bold text-nabiz-navy">{s.count}</td>
                      <td className="px-6 py-3 text-gray-500">%{pct}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${perfColor}`}>
                          {perf}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gelecek Özellikler */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            ),
            baslik: "Kurum Karşılaştırma",
            aciklama: "Rakip kurumları ekleyerek medya performanslarını yan yana karşılaştırın",
            durum: "Yakında",
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            ),
            baslik: "Zaman Bazlı Trend",
            aciklama: "Haftalık ve aylık mention trendleri ile grafsel analiz",
            durum: "Geliştiriliyor",
          },
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
              </svg>
            ),
            baslik: "AI Skor Kartı",
            aciklama: "Yapay zeka ile otomatik medya performans puanlaması",
            durum: "İstihbarat+",
          },
        ].map((item) => (
          <div
            key={item.baslik}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-nabiz-navy/10 flex items-center justify-center text-nabiz-navy mb-4">
              {item.icon}
            </div>
            <h3 className="font-bold text-nabiz-dark text-sm">{item.baslik}</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.aciklama}</p>
            <div className="mt-4">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-nabiz-orange/10 text-nabiz-orange rounded-md">
                {item.durum}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
