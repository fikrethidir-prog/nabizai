"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  ts: string;
  kullanici_id: string;
  ad?: string;
  rol: "admin" | "musteri";
  eylem: string;
  musteri_id?: string;
  detay: Record<string, unknown>;
}

const EYLEM_RENK: Record<string, string> = {
  login:              "bg-green-100 text-green-700",
  logout:             "bg-gray-100 text-gray-600",
  musteri_olustur:    "bg-blue-100 text-blue-700",
  musteri_sil:        "bg-red-100 text-red-600",
  musteri_guncelle:   "bg-amber-100 text-amber-700",
  kullanici_olustur:  "bg-purple-100 text-purple-700",
  kullanici_sil:      "bg-red-100 text-red-600",
  tarama_baslat:      "bg-nabiz-orange/10 text-nabiz-orange",
  tarama_tamamlandi:  "bg-teal-100 text-teal-700",
  haberler_goruntule: "bg-sky-100 text-sky-700",
  rapor_goruntule:    "bg-indigo-100 text-indigo-700",
  rapor_indir:        "bg-violet-100 text-violet-700",
};

function formatTarih(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function LoglarPage() {
  const [loglar, setLoglar] = useState<LogEntry[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [eylemFilter, setEylemFilter] = useState("tumu");
  const [arama, setArama] = useState("");

  useEffect(() => {
    async function veriCek() {
      setYukleniyor(true);
      try {
        const res = await fetch("/api/log?limit=500");
        if (res.ok) setLoglar(await res.json());
      } finally {
        setYukleniyor(false);
      }
    }
    veriCek();
    const interval = setInterval(veriCek, 15000); // 15sn'de bir yenile
    return () => clearInterval(interval);
  }, []);

  const tumEylemler = [...new Set(loglar.map(l => l.eylem))].sort();

  const filtreliLoglar = loglar.filter(l => {
    if (eylemFilter !== "tumu" && l.eylem !== eylemFilter) return false;
    if (arama) {
      const aramaKuc = arama.toLowerCase();
      return (l.ad || "").toLowerCase().includes(aramaKuc) ||
        l.eylem.includes(aramaKuc) ||
        l.kullanici_id.includes(aramaKuc) ||
        (l.musteri_id || "").includes(aramaKuc);
    }
    return true;
  });

  function csvIndir() {
    const header = "Zaman,Kullanıcı,Rol,Eylem,Müşteri ID,Detay";
    const rows = filtreliLoglar.map(l =>
      `"${formatTarih(l.ts)}","${l.ad || l.kullanici_id}","${l.rol}","${l.eylem}","${l.musteri_id || ""}","${JSON.stringify(l.detay).replace(/"/g, "'")}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nabizai-loglar-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const istatistikler = {
    login: loglar.filter(l => l.eylem === "login").length,
    tarama: loglar.filter(l => l.eylem === "tarama_baslat").length,
    musteri_islem: loglar.filter(l => l.eylem.startsWith("musteri_")).length,
    kullanici_islem: loglar.filter(l => l.eylem.startsWith("kullanici_")).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">İşlem Kayıtları</h1>
            <p className="text-xs text-gray-400">Audit log — tüm sistem hareketleri</p>
          </div>
          <button
            onClick={csvIndir}
            className="flex items-center gap-2 px-4 py-2 bg-nabiz-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            CSV İndir
          </button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Toplam Kayıt", val: loglar.length, cls: "text-nabiz-navy" },
            { label: "Giriş Yapma", val: istatistikler.login, cls: "text-green-600" },
            { label: "Tarama", val: istatistikler.tarama, cls: "text-nabiz-orange" },
            { label: "Müşteri İşlemi", val: istatistikler.musteri_islem, cls: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className={`text-3xl font-extrabold ${s.cls}`}>{s.val}</p>
              <p className="text-xs text-gray-400 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtreler */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Kullanıcı, eylem ara..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
          </div>
          <select
            value={eylemFilter}
            onChange={e => setEylemFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 text-gray-600"
          >
            <option value="tumu">Tüm Eylemler</option>
            {tumEylemler.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Log tablosu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 text-sm font-semibold text-gray-400">
            {yukleniyor ? "Yükleniyor..." : `${filtreliLoglar.length} kayıt`}
            <span className="ml-2 text-xs text-gray-300">• 15sn'de bir güncellenir</span>
          </div>

          {yukleniyor ? (
            <div className="flex items-center justify-center py-16 text-gray-300 text-sm gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Yükleniyor...
            </div>
          ) : filtreliLoglar.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-300 text-sm">
              {loglar.length === 0 ? "Henüz işlem kaydı yok" : "Eşleşen kayıt bulunamadı"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Zaman</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Kullanıcı</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Rol</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Eylem</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtreliLoglar.map((l, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap font-mono">
                        {formatTarih(l.ts)}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-nabiz-dark text-xs">{l.ad || l.kullanici_id.slice(0, 8)}</p>
                        {l.musteri_id && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{l.musteri_id.slice(0, 12)}...</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${l.rol === "admin" ? "bg-nabiz-orange/10 text-nabiz-orange" : "bg-blue-50 text-blue-600"}`}>
                          {l.rol === "admin" ? "Yönetici" : "Müşteri"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${EYLEM_RENK[l.eylem] || "bg-gray-100 text-gray-500"}`}>
                          {l.eylem}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono max-w-xs truncate">
                        {Object.keys(l.detay || {}).length > 0
                          ? JSON.stringify(l.detay).slice(0, 80)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
