"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/haberler": "Haberler",
  "/kriz": "Kriz Takibi",
  "/rakip": "Rakip Analiz",
  "/raporlar": "Raporlar",
};

export default function Topbar() {
  const pathname = usePathname();
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState("");

  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";

  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleScan() {
    setScanning(true);
    setToast("");
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      if (data.status === "done") {
        setToast(data.new_items > 0 ? `+${data.new_items} yeni haber` : "Yeni haber yok");
      } else {
        setToast("Tarama hatası");
      }
    } catch {
      setToast("Bağlantı hatası");
    } finally {
      setScanning(false);
      setTimeout(() => setToast(""), 5000);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="lg:hidden flex flex-col items-start gap-0.5">
            <img src="/06_nabizai_logo_dark_1600w.png" alt="nabız ai" className="h-6" onError={(e) => (e.currentTarget.src = "/nabizai_logo.svg")} />
            <span className="text-[9px] font-extrabold tracking-widest text-nabiz-orange uppercase">Yerelin Nabzı</span>
          </div>
          <div className="hidden lg:block">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-nabiz-dark">{pageTitle}</h2>
                <div className="px-2 py-0.5 rounded-md bg-nabiz-orange/10 border border-nabiz-orange/20">
                  <span className="text-[10px] font-extrabold text-nabiz-orange tracking-widest uppercase">Yapay Zekâ Destekli Bölgesel İstihbarat Ağı</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{today}</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Toast */}
          {toast && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              toast.startsWith("+") ? "bg-nabiz-green/10 text-nabiz-green" : "bg-gray-100 text-gray-500"
            }`}>
              {toast}
            </span>
          )}

          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={scanning}
            title="Şimdi Tara — RSS'ten yeni haberleri çek"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-nabiz-navy/5 hover:bg-nabiz-navy/10 text-nabiz-navy text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Taranıyor
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Tara
              </>
            )}
          </button>

          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nabiz-green/10 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nabiz-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-nabiz-green" />
            </span>
            <span className="text-xs font-semibold text-nabiz-green">Canlı</span>
          </div>

          {/* Source count */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.132-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="text-xs font-medium text-gray-500">26+ kaynak</span>
          </div>

          {/* Profile */}
          <button className="w-9 h-9 rounded-full bg-nabiz-navy/10 flex items-center justify-center hover:bg-nabiz-navy/20 transition-colors">
            <svg className="w-5 h-5 text-nabiz-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
