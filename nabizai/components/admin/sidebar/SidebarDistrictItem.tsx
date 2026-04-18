"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarDistrictItem({ 
  district, 
  isActive 
}: { 
  district: { slug: string; name: string; sources_count: number }; 
  isActive: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // If we are on a page belonging to this district, keep it open automatically
  useEffect(() => {
    if (pathname.startsWith(`/admin/districts/${district.slug}`)) {
      setIsOpen(true);
    }
  }, [pathname, district.slug]);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
          isActive || isOpen ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>{district.name}</span>
        </div>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="ml-5 mt-1 border-l border-white/10 pl-2 space-y-0.5">
          <Link href={`/admin/districts/${district.slug}/sources`} className={`block px-2 py-1.5 text-[11px] rounded-md ${pathname.includes(`/sources`) && pathname.includes(district.slug) ? 'text-nabiz-orange font-bold' : 'text-white/40 hover:text-white'}`}>
             🌐 Kaynaklar ({district.sources_count})
          </Link>
          <Link href={`/admin/districts/${district.slug}/mentions`} className={`block px-2 py-1.5 text-[11px] rounded-md ${pathname.includes(`/mentions`) && pathname.includes(district.slug) ? 'text-nabiz-orange font-bold' : 'text-white/40 hover:text-white'}`}>
             📰 Son Bahsetmeler 
          </Link>
          <Link href={`/admin/districts/${district.slug}/analytics`} className={`block px-2 py-1.5 text-[11px] rounded-md ${pathname.includes(`/analytics`) && pathname.includes(district.slug) ? 'text-nabiz-orange font-bold' : 'text-white/40 hover:text-white'}`}>
             📈 Analitik
          </Link>
          <Link href={`/admin/districts/${district.slug}/settings`} className={`block px-2 py-1.5 text-[11px] rounded-md ${pathname.includes(`/settings`) && pathname.includes(district.slug) ? 'text-nabiz-orange font-bold' : 'text-white/40 hover:text-white'}`}>
             ⚙️ Ayarlar
          </Link>
        </div>
      )}
    </div>
  );
}
