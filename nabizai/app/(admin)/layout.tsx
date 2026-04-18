"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/sidebar/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Header (Visible only on small screens) */}
      <div className="md:hidden bg-nabiz-dark p-4 flex items-center justify-between z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-nabiz-orange rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-nabiz-orange/30">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"/>
            </svg>
          </div>
          <span className="text-white font-extrabold text-sm">nabızai <span className="text-[10px] text-white/50 block">Admin Paneli</span></span>
        </div>
        <button 
          className="text-white/80 p-2 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>
          )}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar Wrapper */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 w-64 transition-transform duration-300 ease-in-out`}>
         <Sidebar onClickLink={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen pt-4 pb-12 px-4 md:px-8 w-full max-w-[100vw]">
        {children}
      </div>
    </div>
  );
}
