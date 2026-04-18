"use client";

import { useState, useEffect } from "react";

interface Rapor {
  id: string;
  baslik: string;
  dosyaAdi: string;
  tarih: string;
  boyut: string;
  url: string;
}

export default function RaporlarPage() {
  const [raporlar, setRaporlar] = useState<Rapor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tümü");

  useEffect(() => {
    fetch("/api/raporlar")
      .then((r) => r.json())
      .then((data) => {
        setRaporlar(Array.isArray(data) ? data : []);
      })
      .catch(() => setRaporlar([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtre: başlığa göre rapor türünü tahmin et
  function raporTuru(baslik: string): string {
    const l = baslik.toLowerCase();
    if (l.includes("hafta")) return "Haftalık";
    if (l.includes("aylık") || l.includes("aylik")) return "Aylık";
    if (l.includes("kriz")) return "Özel";
    return "Genel";
  }

  const typeColors: Record<string, string> = {
    Haftalık: "bg-nabiz-navy/10 text-nabiz-navy",
    Aylık: "bg-nabiz-orange/10 text-nabiz-orange",
    Özel: "bg-red-100 text-nabiz-red",
    Genel: "bg-gray-100 text-gray-600",
  };

  const filtered = raporlar.filter((r) => {
    if (filter === "Tümü") return true;
    return raporTuru(r.baslik) === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nabiz-dark">Raporlar</h1>
          <p className="text-sm text-gray-400 mt-0.5">PDF raporlarınız otomatik olarak oluşturulur</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Rapor", value: loading ? "—" : String(raporlar.length), color: "text-nabiz-navy" },
          { label: "Bu Ay", value: loading ? "—" : String(raporlar.filter(r => {
            const parts = r.tarih.split(".");
            if (parts.length < 2) return false;
            const now = new Date();
            return parseInt(parts[1]) === now.getMonth() + 1 && parseInt(parts[2]) === now.getFullYear();
          }).length), color: "text-nabiz-orange" },
          { label: "Son İndirme", value: loading ? "—" : raporlar.length > 0 ? raporlar[0].tarih : "—", color: "text-nabiz-green" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schedule info */}
      <div className="bg-nabiz-navy/5 border border-nabiz-navy/10 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-nabiz-navy flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-nabiz-dark">Otomatik Rapor Takvimi</p>
          <p className="text-sm text-gray-500">
            Haftalık raporlar her <span className="font-semibold text-nabiz-navy">Pazartesi 09:00</span>&apos;da,
            aylık raporlar her ayın <span className="font-semibold text-nabiz-navy">1&apos;inde</span> e-posta ile gönderilir.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {["Tümü", "Haftalık", "Aylık", "Özel"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              filter === t
                ? "bg-nabiz-navy text-white"
                : "bg-white border border-gray-200 text-gray-500 hover:text-nabiz-dark"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Report list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-400 mb-2">Henüz rapor oluşturulmamış</h3>
          <p className="text-sm text-gray-300">
            {raporlar.length === 0
              ? "Sistem tarama verisi topladıkça otomatik raporlar oluşturulacaktır."
              : "Bu filtreye uygun rapor bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rapor) => {
            const tur = raporTuru(rapor.baslik);
            return (
              <div
                key={rapor.id}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-nabiz-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-nabiz-dark leading-snug">{rapor.baslik}</h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${typeColors[tur]}`}>
                            {tur}
                          </span>
                          <span className="text-xs text-gray-400">{rapor.tarih}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{rapor.boyut}</span>
                        </div>
                      </div>

                      <a
                        href={rapor.url}
                        className="flex items-center gap-1.5 px-3 py-2 bg-nabiz-navy text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        İndir
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
