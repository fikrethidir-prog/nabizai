"use client";

import { useState } from "react";
import Link from "next/link";

interface JSONRules {
  max_districts: number;
  max_keywords: number;
  max_sources: number;
  refresh_interval_minutes: number;
  sentiment_alerts: boolean;
  crisis_threshold: number;
  allowed_widgets: string[];
  ai_prompt_profile: string;
  report_frequency: string;
}

interface PackageDef {
  id: string;
  code: string;
  name: string;
  tier: string;
  monthly_price_tl: number;
  rules: JSONRules;
}

const DEFAULT_PACKAGES: PackageDef[] = [
  {
    id: "pkg_1", code: "izleme", name: "Temel İzleme Paketi", tier: "basic", monthly_price_tl: 2500,
    rules: { max_districts: 1, max_keywords: 20, max_sources: 10, refresh_interval_minutes: 120, sentiment_alerts: true, crisis_threshold: 8.5, allowed_widgets: ["feed"], ai_prompt_profile: "basic_v1", report_frequency: "weekly" }
  },
  {
    id: "pkg_2", code: "radar_pro", name: "Radar Pro Paket", tier: "pro", monthly_price_tl: 7500,
    rules: { max_districts: 3, max_keywords: 50, max_sources: 30, refresh_interval_minutes: 30, sentiment_alerts: true, crisis_threshold: 6.0, allowed_widgets: ["feed", "sentiment", "trends", "alerts"], ai_prompt_profile: "pro_v1", report_frequency: "daily" }
  },
  {
    id: "pkg_3", code: "istihbarat", name: "İstihbarat / Kurumsal", tier: "enterprise", monthly_price_tl: 15000,
    rules: { max_districts: 99, max_keywords: 999, max_sources: 999, refresh_interval_minutes: 5, sentiment_alerts: true, crisis_threshold: 4.0, allowed_widgets: ["feed", "sentiment", "trends", "alerts", "map", "rivals"], ai_prompt_profile: "enterprise_v1", report_frequency: "instant" }
  }
];

export default function PackagesManagementPage() {
  const [packages, setPackages] = useState<PackageDef[]>(DEFAULT_PACKAGES);
  const [selectedPkg, setSelectedPkg] = useState<PackageDef | null>(packages[1]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-nabiz-dark">Paket ve Kural Yönetimi</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            "Rules JSONB" mantığı ile SaaS Müşteri abonelik paketlerinin AI kapasite sınırlarını ayarlayın.
          </p>
        </div>
        <button className="px-4 py-2 bg-nabiz-navy text-white text-xs font-bold rounded-xl shadow-md hover:bg-nabiz-navy/90 transition-all">
          ➕ Yeni Paket Tanımla
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Paket Listesi Sidemenu */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
               <p className="text-sm font-bold text-nabiz-dark">Mevcut SaaS Paketleri</p>
            </div>
            <div className="divide-y divide-gray-50">
              {packages.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPkg(p)}
                  className={`w-full text-left px-5 py-4 transition-colors ${selectedPkg?.id === p.id ? "bg-nabiz-navy/5 border-l-4 border-nabiz-navy" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                >
                  <p className="font-bold text-nabiz-dark text-sm">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1 -ml-1">
                     <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                       p.tier === "enterprise" ? "bg-red-100 text-red-700" :
                       p.tier === "pro" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                     }`}>{p.tier}</span>
                     <span className="text-xs font-semibold text-green-600">{p.monthly_price_tl.toLocaleString()} ₺ / Ay</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seçili Paket Kural JSON Editörü */}
        {selectedPkg && (
          <div className="w-full lg:w-2/3">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-full">
               <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                 <h2 className="text-lg font-bold text-nabiz-dark">{selectedPkg.name} — <span className="text-gray-400">Kurallar Katmanı (Rules)</span></h2>
                 <button className="px-4 py-1.5 text-xs font-bold text-nabiz-orange bg-nabiz-orange/10 rounded-lg hover:bg-nabiz-orange/20">Kaydet (UPSERT)</button>
               </div>
               <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Paket Kodu (Code)</label>
                        <input type="text" value={selectedPkg.code} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-nabiz-dark" disabled />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Aylık Fiyat (TL)</label>
                        <input type="number" value={selectedPkg.monthly_price_tl} onChange={()=>{}} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-nabiz-dark" />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-gray-700 mb-2 mt-4 flex items-center gap-2">
                        🧠 JSONB AI Rules 
                        <span className="text-[10px] font-normal text-gray-400">(Bu alan arka plandaki Küratör İşçinin okuyacağı konfigürasyondur)</span>
                     </label>
                     <div className="relative">
                       <textarea
                         className="w-full h-80 bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm font-mono text-green-400 focus:outline-none focus:ring-2 focus:ring-nabiz-orange/50 custom-scrollbar"
                         value={JSON.stringify(selectedPkg.rules, null, 2)}
                         onChange={(e) => {
                            try {
                              const newRules = JSON.parse(e.target.value);
                              setSelectedPkg({...selectedPkg, rules: newRules});
                            } catch(err) {
                              // Let user type
                            }
                         }}
                       />
                       <div className="absolute top-2 right-2 flex space-x-1">
                          <span className="bg-gray-800/80 px-2 py-1 text-[10px] text-gray-400 rounded-md uppercase tracking-wider font-bold">Valid JSON object</span>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
