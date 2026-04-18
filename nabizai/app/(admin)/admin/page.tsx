"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  total?: number;
  today?: number;
  byStatus?: Record<string, number>;
  topTags?: { tag: string; count: number }[];
  topSources?: { source: string; count: number }[];
}

interface Musteri {
  id: string;
  musteriAd: string;
  paket: string;
  olusturulma?: string;
}

interface DemoTalep {
  id: string;
  ad: string;
  kurum?: string;
  sirket?: string;
  email: string;
  telefon?: string;
  sektor?: string;
  mesaj?: string;
  durum: string;
  tarih?: string;
}

interface LogEntry {
  ts: string;
  ad?: string;
  rol: string;
  eylem: string;
  musteri_id?: string;
}

const PAKET_RENK: Record<string, string> = {
  izleme: "bg-nabiz-navy/10 text-nabiz-navy",
  radar_pro: "bg-nabiz-orange/10 text-nabiz-orange",
  istihbarat: "bg-purple-100 text-purple-700",
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({});
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [loglar, setLoglar] = useState<LogEntry[]>([]);
  const [talepler, setTalepler] = useState<DemoTalep[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function yukle() {
      setYukleniyor(true);
      try {
        const [sRes, mRes, lRes, tRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/musteri-paneli"),
          fetch("/api/log?limit=10"),
          fetch("/api/demo"),
        ]);
        if (sRes.ok) setStats(await sRes.json());
        if (mRes.ok) setMusteriler(await mRes.json());
        if (lRes.ok) setLoglar(await lRes.json());
        if (tRes.ok) setTalepler(await tRes.json());
      } finally {
        setYukleniyor(false);
      }
    }
    yukle();
  }, []);

  const rizikoluHaber = Object.entries(stats.byStatus || {})
    .filter(([k]) => k.includes("waiting"))
    .reduce((a, [, v]) => a + v, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4">
          <h1 className="text-lg font-extrabold text-nabiz-dark">
            Genel Bakış
          </h1>
          <p className="text-xs text-gray-400">nabızai Yönetim Paneli</p>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Stat kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Toplam Haber",
              val: stats.total ?? "—",
              cls: "text-nabiz-navy",
              sub: "Tüm zamanlar",
            },
            {
              label: "Bugün",
              val: stats.today ?? "—",
              cls: "text-nabiz-orange",
              sub: "Yeni haber",
            },
            {
              label: "Aktif Müşteri",
              val: musteriler.length,
              cls: "text-teal-600",
              sub: "Kayıtlı müşteri",
            },
            {
              label: "Onay Bekleyen",
              val: rizikoluHaber,
              cls: "text-amber-500",
              sub: "İşlem bekliyor",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <p className={`text-3xl font-extrabold ${s.cls}`}>{s.val}</p>
              <p className="text-xs text-gray-400 font-semibold mt-1">
                {s.label}
              </p>
              <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* L5 Apex Liderler & Karşılaştırmalar (YENİ) */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
               <h2 className="text-sm font-extrabold text-nabiz-dark">L5 Çatı Analiz: Bölgesel Liderler ve Kurum Karnesi</h2>
               <p className="text-xs text-gray-500 mt-1">Yapay zeka (Qwen2.5) metriklerine dayalı genel dijital görünürlük ve PR Değeri Karşılaştırması</p>
            </div>
            <span className="bg-nabiz-orange/10 text-nabiz-orange px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
               Canlı Simülasyon
            </span>
          </div>
          <div className="p-0 overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Lider / Kurum</th>
                    <th className="px-6 py-3">Bölge (İlçe)</th>
                    <th className="px-6 py-3">Toplam Haber/Bahis</th>
                    <th className="px-6 py-3">Ortalama Etki (Rating)</th>
                    <th className="px-6 py-3 text-right">Reklam Eşdeğeri (AVE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { ad: "Ahmet Aras", bolge: "Muğla BB", haber: 1542, rating: 88, ave: 4500000, trend: "up" },
                    { ad: "Tamer Mandalinci", bolge: "Bodrum", haber: 840, rating: 82, ave: 1250000, trend: "up" },
                    { ad: "Alim Karaca", bolge: "Fethiye", haber: 650, rating: 76, ave: 980000, trend: "neutral" },
                    { ad: "Gonca Köksal", bolge: "Menteşe", haber: 512, rating: 74, ave: 850000, trend: "up" },
                    { ad: "Acar Ünlü", bolge: "Marmaris", haber: 480, rating: 72, ave: 750000, trend: "down" },
                    { ad: "Fevzi Topuz", bolge: "Milas", haber: 412, rating: 71, ave: 620000, trend: "down" },
                    { ad: "Evren Tezcan", bolge: "Ortaca", haber: 320, rating: 69, ave: 410000, trend: "up" },
                    { ad: "Sezer Durmuş", bolge: "Dalaman", haber: 285, rating: 65, ave: 380000, trend: "neutral" },
                    { ad: "Aytaç Kurt", bolge: "Datça", haber: 240, rating: 67, ave: 320000, trend: "up" },
                    { ad: "Önder Akdenizli", bolge: "Seydikemer", haber: 215, rating: 62, ave: 280000, trend: "neutral" },
                    { ad: "Ali İlhan", bolge: "Köyceğiz", haber: 195, rating: 64, ave: 210000, trend: "up" },
                    { ad: "Mesut Günay", bolge: "Yatağan", haber: 180, rating: 60, ave: 195000, trend: "down" },
                    { ad: "Salih Timur", bolge: "Ula", haber: 150, rating: 63, ave: 180000, trend: "up" },
                    { ad: "Mehmet Demir", bolge: "Kavaklıdere", haber: 98, rating: 55, ave: 120000, trend: "neutral" },
                  ].map((lider, i) => (
                    <tr key={lider.ad} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-nabiz-navy text-white flex items-center justify-center font-bold text-xs shadow">
                              {lider.ad[0]}
                           </div>
                           <div>
                              <p className="font-bold text-nabiz-dark">{lider.ad}</p>
                              {i === 0 && <p className="text-[10px] text-nabiz-orange font-bold uppercase flex items-center gap-1 mt-0.5">🌟 Apex Leader</p>}
                           </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-500">{lider.bolge}</td>
                      <td className="px-6 py-4 font-black text-nabiz-navy">{lider.haber}</td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${lider.rating > 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {lider.rating} / 100
                            </span>
                            {lider.trend === 'up' && <span className="text-green-500 text-xs">↗</span>}
                            {lider.trend === 'down' && <span className="text-red-500 text-xs">↘</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-600">
                         ₺ {lider.ave.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol Kolon (Kapsayıcı) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Müşteri listesi */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">Müşteriler</p>
                <Link
                  href="/admin/musteriler"
                  className="text-xs text-nabiz-orange font-semibold hover:underline"
                >
                  Tümünü Yönet
                </Link>
              </div>
              {yukleniyor ? (
                <div className="flex items-center justify-center py-12 text-gray-300 text-sm gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Yükleniyor...
                </div>
              ) : musteriler.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 text-sm gap-3">
                  <p>Henüz müşteri yok</p>
                  <Link
                    href="/admin/panel-olustur"
                    className="text-nabiz-orange font-semibold hover:underline text-xs"
                  >
                    İlk müşteriyi oluştur
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {musteriler.map((m) => (
                    <Link
                      key={m.id}
                      href={`/admin/musteri/${m.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-nabiz-navy flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {m.musteriAd[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-nabiz-dark text-sm">
                          {m.musteriAd}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(m.olusturulma || "").toLocaleDateString(
                            "tr-TR",
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${PAKET_RENK[m.paket] || "bg-gray-100 text-gray-500"}`}
                      >
                        {m.paket === "izleme"
                          ? "İzleme"
                          : m.paket === "radar_pro"
                            ? "Radar Pro"
                            : "İstihbarat"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <div className="px-5 py-3 border-t border-gray-50">
                <Link
                  href="/admin/panel-olustur"
                  className="flex items-center gap-2 text-xs font-semibold text-nabiz-orange hover:underline"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Yeni Müşteri Ekle
                </Link>
              </div>
            </div>

            {/* Web Başvuruları (Demo Talepleri) */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">
                  Webden Gelen Başvurular
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 bg-nabiz-navy/10 text-nabiz-navy rounded-full">
                  {talepler.length} Talep
                </span>
              </div>
              {yukleniyor ? (
                <div className="flex justify-center flex-col items-center py-8 text-gray-300">
                  <svg
                    className="animate-spin w-5 h-5 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              ) : talepler.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 text-sm gap-3">
                  <p>Henüz web üzerinden gelen bir talep yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                  {talepler.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-nabiz-dark text-sm">
                            {t.ad}{" "}
                            <span className="text-gray-400 font-normal">
                              ({t.kurum || t.sirket || "Bireysel"})
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <a
                              href={`mailto:${t.email}`}
                              className="hover:text-nabiz-navy"
                            >
                              {t.email}
                            </a>{" "}
                            {t.telefon && ` • ${t.telefon}`}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${t.durum === "yeni" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {t.durum === "yeni" ? "YENİ" : "OKUNDU"}
                        </span>
                      </div>
                      {t.mesaj && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                            {t.mesaj}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">
                          {new Date(t.tarih || "").toLocaleString("tr-TR")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              alert("WhatsApp Entegrasyonu eklenecek")
                            }
                            className="text-[10px] bg-green-50 text-green-600 font-bold px-2 py-1 rounded hover:bg-green-100 transition hidden sm:inline-block"
                          >
                            WhatsApp
                          </button>
                          <Link
                            href={`mailto:${t.email}`}
                            className="text-[10px] bg-nabiz-navy/10 text-nabiz-navy font-bold px-2 py-1 rounded hover:bg-nabiz-navy/20 transition"
                          >
                            E-Posta
                          </Link>
                          <Link
                            href={`/admin/panel-olustur?ad=${encodeURIComponent(t.ad || "")}&kurum=${encodeURIComponent(t.kurum || t.sirket || "")}&email=${encodeURIComponent(t.email || "")}`}
                            className="text-[10px] bg-nabiz-orange text-white font-bold px-3 py-1 rounded shadow-sm hover:bg-orange-500 transition ml-2"
                          >
                            PANEL OLUŞTUR
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ kolon */}
          <div className="space-y-4">
            {/* Top kaynaklar */}
            {(stats.topSources || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-bold text-nabiz-dark">
                    En Aktif Kaynaklar
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {(stats.topSources || []).slice(0, 5).map((s) => (
                    <div
                      key={s.source}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <span className="text-xs font-medium text-gray-600 truncate">
                        {s.source}
                      </span>
                      <span className="text-xs font-bold text-nabiz-navy ml-2">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Son işlemler */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">
                  Son İşlemler
                </p>
                <Link
                  href="/admin/loglar"
                  className="text-xs text-nabiz-orange font-semibold hover:underline"
                >
                  Tümü
                </Link>
              </div>
              {loglar.length === 0 ? (
                <p className="text-center text-gray-300 text-xs py-6">
                  Henüz kayıt yok
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {loglar.map((l, i) => (
                    <div
                      key={i}
                      className="px-5 py-2.5 flex items-center gap-3"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${l.rol === "admin" ? "bg-nabiz-orange" : "bg-blue-400"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-nabiz-dark">
                          {l.eylem}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {l.ad || l.rol} ·{" "}
                          {new Date(l.ts).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hızlı linkler */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                Hızlı Erişim
              </p>
              {[
                {
                  href: "/admin/panel-olustur",
                  label: "Yeni Panel Oluştur",
                  color: "text-nabiz-orange",
                },
                {
                  href: "/admin/kullanicilar",
                  label: "Kullanıcı Yönetimi",
                  color: "text-nabiz-navy",
                },
                {
                  href: "/admin/loglar",
                  label: "İşlem Kayıtları",
                  color: "text-gray-600",
                },
                {
                  href: "/admin/landing",
                  label: "Landing CMS",
                  color: "text-teal-600",
                },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 text-sm font-semibold ${l.color} hover:underline`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
