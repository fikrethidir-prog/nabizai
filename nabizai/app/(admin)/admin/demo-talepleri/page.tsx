"use client";

import { useState, useEffect } from "react";

interface DemoTalep {
  id: string;
  ad: string;
  kurum: string;
  email: string;
  telefon?: string;
  sektor: string;
  mesaj?: string;
  tarih: string;
  durum: "yeni" | "iletisime_gecildi" | "demo_yapildi" | "musteri_oldu";
}

const DURUM_LABEL: Record<string, { label: string; cls: string }> = {
  yeni: { label: "Yeni", cls: "bg-blue-100 text-blue-700" },
  iletisime_gecildi: { label: "İletişime Geçildi", cls: "bg-amber-100 text-amber-700" },
  demo_yapildi: { label: "Demo Yapıldı", cls: "bg-green-100 text-green-700" },
  musteri_oldu: { label: "Müşteri Oldu", cls: "bg-nabiz-navy/10 text-nabiz-navy" },
};

export default function DemoTalepleriPage() {
  const [talepler, setTalepler] = useState<DemoTalep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/demo")
      .then((r) => r.json())
      .then((d) => { setTalepler(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const yeniSayisi = talepler.filter(t => t.durum === "yeni").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">Demo Talepleri</h1>
            <p className="text-xs text-gray-400">Web sitesinden gelen demo istekleri</p>
          </div>
          {yeniSayisi > 0 && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl">
              {yeniSayisi} yeni talep
            </span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Yükleniyor...
          </div>
        ) : talepler.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <p className="text-lg font-semibold mb-1">Henüz demo talebi yok</p>
            <p className="text-sm">Web sitesinden gelen talepler burada görünecek.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Ad / Kurum</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">İletişim</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Sektör</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Tarih</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {talepler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).map((t) => {
                    const durum = DURUM_LABEL[t.durum] || DURUM_LABEL.yeni;
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-nabiz-dark">{t.ad}</p>
                          <p className="text-xs text-gray-400">{t.kurum}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-nabiz-dark">{t.email}</p>
                          {t.telefon && <p className="text-xs text-gray-400">{t.telefon}</p>}
                        </td>
                        <td className="px-5 py-4 text-gray-500">{t.sektor}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(t.tarih).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${durum.cls}`}>
                            {durum.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
