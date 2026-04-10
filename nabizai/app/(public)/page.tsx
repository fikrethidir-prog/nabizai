import Image from "next/image";
import Link from "next/link";

// ===== Statik fallback verisi (Supabase bağlanana kadar) =====
const defaultSettings: Record<string, string> = {
  badge_text: "Canlı izleme · 26 kaynak + sosyal medya",
  hero_title_1: "Yerel medyanın",
  hero_title_2: "nabzı",
  hero_desc:
    "Yerel haberler, sosyal medya ve rakip analizi tek ekranda. Kriz öncesi sizi uyarır, fırsatları kaçırmazsınız.",
  stat_1_n: "26+",
  stat_1_l: "yerel kaynak",
  stat_2_n: "4",
  stat_2_l: "sosyal platform",
  stat_3_n: "30dk",
  stat_3_l: "güncelleme sıklığı",
  stat_4_n: "AI",
  stat_4_l: "destekli analiz",
  pkg_1_name: "İzleme",
  pkg_1_price: "15.000 ₺",
  pkg_2_name: "Radar Pro",
  pkg_2_price: "35.000 ₺",
  pkg_3_name: "İstihbarat",
  pkg_3_price: "75.000+ ₺",
};

// Supabase'den site_settings çekme (bağlantı kurulduğunda aktif olacak)
async function getSettings(): Promise<Record<string, string>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return defaultSettings;
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from("site_settings").select("key, value");

    if (!data || data.length === 0) return defaultSettings;

    const settings: Record<string, string> = {};
    data.forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });

    return { ...defaultSettings, ...settings };
  } catch {
    return defaultSettings;
  }
}

export const revalidate = 3600; // ISR: 1 saat

// ===== Feature Data =====
const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
    title: "Kriz Erken Uyarı",
    desc: "Olumsuz haberleri anında tespit eder, kriz skoru hesaplar ve Telegram üzerinden bildirim gönderir.",
    color: "text-nabiz-red",
    bg: "bg-red-50",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: "Rakip Medya Takibi",
    desc: "Rakiplerinizin medya yansımalarını analiz eder, karşılaştırmalı raporlar üretir.",
    color: "text-nabiz-navy",
    bg: "bg-blue-50",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423Z" />
      </svg>
    ),
    title: "AI Günlük Brifing",
    desc: "Her sabah AI destekli özet rapor hazırlar. Ne önemli, ne riskli, ne fırsat — tek bakışta görün.",
    color: "text-nabiz-orange",
    bg: "bg-orange-50",
  },
];

// ===== Package Data =====
const packageFeatures = {
  pkg_1: [
    "26+ yerel kaynak tarama",
    "Günlük AI brifing",
    "Duygu analizi",
    "E-posta raporları",
  ],
  pkg_2: [
    "İzleme'deki her şey",
    "Sosyal medya izleme",
    "Rakip medya analizi",
    "Kriz erken uyarı",
    "Telegram bildirimleri",
  ],
  pkg_3: [
    "Radar Pro'daki her şey",
    "Özel kaynak ekleme",
    "API erişimi",
    "Haftalık strateji raporu",
    "Öncelikli destek",
    "Özel dashboard",
  ],
};

export default async function LandingPage() {
  const s = await getSettings();

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/nabizai_logo.svg"
                alt="nabızai"
                className="h-8"
              />
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#ozellikler" className="text-sm text-gray-600 hover:text-nabiz-navy transition-colors">
                Özellikler
              </a>
              <a href="#fiyatlar" className="text-sm text-gray-600 hover:text-nabiz-navy transition-colors">
                Fiyatlar
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-nabiz-navy text-white text-sm font-semibold rounded-lg hover:bg-nabiz-navy-light transition-all duration-300 shadow-lg shadow-nabiz-navy/20 hover:shadow-xl hover:shadow-nabiz-navy/30 hover:-translate-y-0.5"
              >
                Giriş Yap
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Mobile menu button */}
            <Link
              href="/login"
              className="md:hidden px-4 py-2 bg-nabiz-navy text-white text-sm font-semibold rounded-lg"
            >
              Giriş
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-nabiz-orange rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-nabiz-navy rounded-full blur-[150px]" />
        </div>

        {/* Animated radar rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5">
          <div className="w-[600px] h-[600px] rounded-full border-2 border-white animate-pulse-ring" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-white/90 text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nabiz-green opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-nabiz-green" />
              </span>
              {s.badge_text}
            </div>

            {/* Title */}
            <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6" style={{ animationFillMode: "both" }}>
              {s.hero_title_1}
              <br />
              <span className="text-nabiz-orange">{s.hero_title_2}</span>
            </h1>

            {/* Description */}
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed" style={{ animationFillMode: "both" }}>
              {s.hero_desc}
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationFillMode: "both" }}>
              <Link
                href="/demo"
                className="group relative px-8 py-4 gradient-orange text-white font-semibold rounded-xl shadow-lg shadow-nabiz-orange/30 hover:shadow-xl hover:shadow-nabiz-orange/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Demo Talep Et
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 glass text-white font-semibold rounded-xl hover:bg-white/15 transition-all duration-300"
              >
                Giriş Yap →
              </Link>
            </div>
          </div>
        </div>

        {/* Gradient separator */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { n: s.stat_1_n, l: s.stat_1_l },
              { n: s.stat_2_n, l: s.stat_2_l },
              { n: s.stat_3_n, l: s.stat_3_l },
              { n: s.stat_4_n, l: s.stat_4_l },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl md:text-4xl font-extrabold text-nabiz-navy group-hover:text-nabiz-orange transition-colors duration-300">
                  {stat.n}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-medium">
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="ozellikler" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-nabiz-orange/10 text-nabiz-orange text-sm font-semibold rounded-full mb-4">
              Özellikler
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-nabiz-dark">
              Medyanın nabzını tutun
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              26+ yerel kaynak ve 4 sosyal medya platformunu anlık olarak izleyin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl bg-white border border-gray-100 hover:border-nabiz-navy/20 hover:shadow-2xl hover:shadow-nabiz-navy/5 transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`inline-flex p-3 rounded-xl ${f.bg} ${f.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-nabiz-dark mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-nabiz-navy to-nabiz-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="fiyatlar" className="py-24 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-nabiz-navy/10 text-nabiz-navy text-sm font-semibold rounded-full mb-4">
              Fiyatlandırma
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-nabiz-dark">
              İhtiyacınıza uygun plan
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Her ölçek için esnek paketler. Tüm planlar 14 gün ücretsiz deneme içerir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Package 1 — İzleme */}
            <div className="relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-nabiz-navy/30 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-lg font-bold text-nabiz-dark">{s.pkg_1_name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-nabiz-navy">{s.pkg_1_price}</span>
                <span className="text-gray-400 text-sm">/ay</span>
              </div>
              <ul className="mt-8 space-y-3">
                {packageFeatures.pkg_1.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-nabiz-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/demo"
                className="mt-8 w-full inline-flex justify-center py-3 px-6 border-2 border-nabiz-navy text-nabiz-navy font-semibold rounded-xl hover:bg-nabiz-navy hover:text-white transition-all duration-300"
              >
                Başla
              </Link>
            </div>

            {/* Package 2 — Radar Pro (Featured) */}
            <div className="relative p-8 rounded-2xl bg-nabiz-navy text-white shadow-2xl shadow-nabiz-navy/30 scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-nabiz-orange text-white text-xs font-bold rounded-full">
                Popüler
              </div>
              <h3 className="text-lg font-bold">{s.pkg_2_name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{s.pkg_2_price}</span>
                <span className="text-white/50 text-sm">/ay</span>
              </div>
              <ul className="mt-8 space-y-3">
                {packageFeatures.pkg_2.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                    <svg className="w-5 h-5 text-nabiz-orange flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/demo"
                className="mt-8 w-full inline-flex justify-center py-3 px-6 gradient-orange font-semibold rounded-xl hover:shadow-lg hover:shadow-nabiz-orange/30 transition-all duration-300"
              >
                Başla
              </Link>
            </div>

            {/* Package 3 — İstihbarat */}
            <div className="relative p-8 rounded-2xl bg-white border border-gray-200 hover:border-nabiz-navy/30 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-lg font-bold text-nabiz-dark">{s.pkg_3_name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-nabiz-navy">{s.pkg_3_price}</span>
                <span className="text-gray-400 text-sm">/ay</span>
              </div>
              <ul className="mt-8 space-y-3">
                {packageFeatures.pkg_3.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-nabiz-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/demo"
                className="mt-8 w-full inline-flex justify-center py-3 px-6 border-2 border-nabiz-navy text-nabiz-navy font-semibold rounded-xl hover:bg-nabiz-navy hover:text-white transition-all duration-300"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 bg-nabiz-dark text-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img
              src="/nabizai_logo_dark.svg"
              alt="nabızai"
              className="h-7"
            />
            <p className="text-sm">
              © 2026 nabızai — Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
