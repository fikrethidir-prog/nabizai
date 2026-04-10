"use client";

export default function Topbar() {
  const today = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile logo */}
          <img
            src="/nabizai_logo.svg"
            alt="nabızai"
            className="h-7 lg:hidden"
          />
          <div className="hidden lg:block">
            <h2 className="text-lg font-bold text-nabiz-dark">Dashboard</h2>
            <p className="text-sm text-gray-400">{today}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nabiz-green/10 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nabiz-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-nabiz-green" />
            </span>
            <span className="text-xs font-semibold text-nabiz-green">
              Canlı
            </span>
          </div>

          {/* Source count */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="text-xs font-medium text-gray-500">
              26+ kaynak
            </span>
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
