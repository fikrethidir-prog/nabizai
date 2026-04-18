import React from "react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function DistrictLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { slug } = await params;

  // Ideally, fetch district details from DB using slug here
  // Mock data for initial implementation logic
  const districtName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="space-y-6">
      {/* Upper Context Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nabiz-navy text-white flex items-center justify-center font-bold text-lg shadow-md shadow-nabiz-navy/20">
             📍
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-nabiz-dark">{districtName}</h1>
            <p className="text-sm font-semibold text-gray-400 mt-1">Katman 1 — Ham Veri & İstihbarat Merkezi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right">
             <p className="text-xs font-bold text-gray-400">Son Tarama</p>
             <p className="text-sm font-semibold text-green-600">5dk önce (Çalışıyor)</p>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white border border-gray-100 p-1 rounded-xl shadow-sm overflow-x-auto">
        {[
          { id: "sources", label: "🌐 L1 Kaynaklar", path: `/admin/districts/${slug}/sources` },
          { id: "mentions", label: "📰 Mentions (Ham Akış)", path: `/admin/districts/${slug}/mentions` },
          { id: "analytics", label: "📈 Analitik & Zeka", path: `/admin/districts/${slug}/analytics` },
          { id: "settings", label: "⚙️ İlçe Ayarları", path: `/admin/districts/${slug}/settings` },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.path}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-1 text-center 
               bg-gray-50 text-gray-500 hover:text-nabiz-navy hover:bg-nabiz-navy/5`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Dynamic Tab Content */}
      <div className="bg-transparent rounded-2xl">
        {children}
      </div>
    </div>
  );
}
