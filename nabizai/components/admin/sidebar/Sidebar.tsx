"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SidebarDistrictItem from "./SidebarDistrictItem";
// import SidebarCustomerPanelList from "./SidebarCustomerPanelList";

// Dummy data for migration period to prevent breaking the flow before backend is fully bound
const DEMO_DISTRICTS = [
  { slug: "buyuksehir", name: "Büyükşehir Bld.", sources_count: 55 },
  { slug: "bodrum", name: "Bodrum", sources_count: 15 },
  { slug: "dalaman", name: "Dalaman", sources_count: 5 },
  { slug: "datca", name: "Datça", sources_count: 6 },
  { slug: "fethiye", name: "Fethiye", sources_count: 12 },
  { slug: "kavaklidere", name: "Kavaklıdere", sources_count: 4 },
  { slug: "koycegiz", name: "Köyceğiz", sources_count: 5 },
  { slug: "marmaris", name: "Marmaris", sources_count: 11 },
  { slug: "mentese", name: "Menteşe", sources_count: 19 },
  { slug: "milas", name: "Milas", sources_count: 8 },
  { slug: "ortaca", name: "Ortaca", sources_count: 7 },
  { slug: "seydikemer", name: "Seydikemer", sources_count: 4 },
  { slug: "ula", name: "Ula", sources_count: 5 },
  { slug: "yatagan", name: "Yatağan", sources_count: 6 }
];

export default function Sidebar({ onClickLink }: { onClickLink?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function cikisYap() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-nabiz-dark flex flex-col h-full fixed left-0 top-0 bottom-0 z-40 overflow-hidden">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
        <Link href="/admin" onClick={onClickLink} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-nabiz-orange rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-nabiz-orange/30 overflow-hidden">
             <img src="/01_nabizai_logo_horizontal_light_1600w.png" alt="ai" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          <div className="flex flex-col items-start gap-1">
             <img src="/01_nabizai_logo_horizontal_light_1600w.png" alt="nabız ai" className="h-4" onError={(e) => (e.currentTarget.style.display = 'none')} />
             <p className="text-white font-extrabold text-sm">nabız<span className="text-nabiz-orange">ai</span></p>
             <p className="text-white/50 text-[9px] font-bold tracking-widest uppercase">Yerelin Nabzı</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto w-full custom-scrollbar pt-4 pb-12">
        {/* 1. LAYER A: HAM VERI (ILCELER) */}
        <div className="px-3 mb-6">
          <p className="px-3 text-[10px] items-center flex gap-1.5 font-bold text-nabiz-orange uppercase tracking-widest mb-2">
            L1 — Ham Veri Bağları
          </p>
          <div className="flex flex-col">
            {DEMO_DISTRICTS.map(dist => (
              <SidebarDistrictItem 
                key={dist.slug} 
                district={dist} 
                isActive={pathname.includes(`/districts/${dist.slug}`)} 
              />
            ))}
            <Link href="/admin/districts/new" onClick={onClickLink} className="mt-2 flex items-center justify-center border border-white/10 hover:border-white/20 gap-1.5 text-[11px] text-white/50 px-2 py-1.5 rounded-lg border-dashed">
               <span>➕</span> Yeni İlçe Tanımla
            </Link>
          </div>
        </div>

        {/* 2. LAYER B: MUSTERI PANELLERI */}
        <div className="px-3 mb-6">
          <p className="px-3 text-[10px] items-center flex gap-1.5 font-bold text-[#b4c6e4] uppercase tracking-widest mb-2 border-t border-white/10 pt-4">
             L5 — Sunum (Paneller)
          </p>
          {/* We will replace this with SidebarCustomerPanelList soon */}
          <div className="space-y-1 mt-1 pl-2">
             <Link href="/admin/musteri/demo-belediye" onClick={onClickLink} className="block text-xs font-semibold px-2 py-1.5 text-white/60 hover:text-white rounded hover:bg-white/5">
                🏢 Bodrum Belediyesi
             </Link>
             <Link href="/admin/panel-olustur" onClick={onClickLink} className="mt-1 flex items-center text-[11px] space-x-1.5 font-bold text-nabiz-orange/80 hover:text-nabiz-orange px-2 py-1">
                <span>➕</span> <span>Yeni Panel Oluştur</span>
             </Link>
          </div>
        </div>

        {/* 3. PAKET VE SISTEM AYARLARI */}
        <div className="px-3">
          <p className="px-3 text-[10px] items-center flex gap-1.5 font-bold text-white/30 uppercase tracking-widest mb-2 border-t border-white/10 pt-4">
             Sistem Yönetimi
          </p>
          <div className="space-y-0.5">
             <Link href="/admin/packages" onClick={onClickLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/50 hover:text-white hover:bg-white/8">
                📦 Paket Tanımları
             </Link>
             <Link href="/admin/system/layer-settings" onClick={onClickLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/50 hover:text-white hover:bg-white/8">
                ⚙️ Katman Ayarları
             </Link>
             <Link href="/admin/system/ai-prompts" onClick={onClickLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/50 hover:text-white hover:bg-white/8">
                🧠 AI İstem Profilleri
             </Link>
          </div>
        </div>
      </nav>

      {/* Alt Footer */}
      <div className="px-4 py-4 border-t border-white/10 bg-nabiz-dark">
        <button
          onClick={cikisYap}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          Çıkış Yap
        </button>
      </div>

    </aside>
  );
}
