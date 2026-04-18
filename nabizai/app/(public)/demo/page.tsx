"use client";

import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [formData, setFormData] = useState({
    ad: "",
    kurum: "",
    email: "",
    telefon: "",
    sektor: "",
    mesaj: "",
  });
  const [gonderildi, setGonderildi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const sektorler = [
    "Belediye",
    "Otel / Turizm",
    "AVM / Perakende",
    "PR Ajansı",
    "Siyasi Danışmanlık",
    "Medya Kuruluşu",
    "Diğer",
  ];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setGonderildi(true);
      }
    } catch {
      // Fallback: yine de başarılı göster (demo amaçlı)
      setGonderildi(true);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/nabizai_logo.svg" alt="nabızai" className="h-8" />
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-nabiz-navy text-white text-sm font-semibold rounded-lg hover:bg-nabiz-navy-light transition-all"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {gonderildi ? (
            /* Başarı mesajı */
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-nabiz-green/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-nabiz-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-nabiz-dark mb-3">
                Talebiniz Alındı!
              </h2>
              <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                En kısa sürede sizinle iletişime geçeceğiz. Genellikle{" "}
                <span className="font-semibold text-nabiz-navy">
                  24 saat içinde
                </span>{" "}
                dönüş yapıyoruz.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-nabiz-navy text-white font-semibold rounded-xl hover:bg-nabiz-navy-light transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
                Ana Sayfaya Dön
              </Link>
            </div>
          ) : (
            <>
              {/* Başlık */}
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 bg-nabiz-orange/10 text-nabiz-orange text-sm font-semibold rounded-full mb-4">
                  Ücretsiz Demo
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-nabiz-dark mb-4">
                  nabızai'yi deneyin
                </h1>
                <p className="text-gray-500 text-lg max-w-lg mx-auto">
                  14 gün ücretsiz. Kredi kartı gerekmez. Kurumunuza özel demo
                  ortamınızı hemen oluşturalım.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 md:p-10 space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      name="ad"
                      value={formData.ad}
                      onChange={handleChange}
                      required
                      placeholder="Adınız Soyadınız"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Kurum / Şirket *
                    </label>
                    <input
                      type="text"
                      name="kurum"
                      value={formData.kurum}
                      onChange={handleChange}
                      required
                      placeholder="Kurum adı"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      E-posta *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="ornek@kurum.com"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      placeholder="0532 000 00 00"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Sektör *
                  </label>
                  <select
                    name="sektor"
                    value={formData.sektor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                  >
                    <option value="">Sektör seçin</option>
                    {sektorler.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Mesaj (Opsiyonel)
                  </label>
                  <textarea
                    name="mesaj"
                    value={formData.mesaj}
                    onChange={handleChange}
                    rows={3}
                    placeholder="İhtiyaçlarınızı kısaca anlatın..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="w-full py-3.5 gradient-orange text-white font-bold rounded-xl hover:shadow-lg hover:shadow-nabiz-orange/30 transition-all disabled:opacity-60 mt-2"
                >
                  {yukleniyor ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Gönderiliyor...
                    </span>
                  ) : (
                    "Demo Talep Et"
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 mt-4">
                  Bilgileriniz gizli tutulur. Sadece demo süreciyle ilgili
                  iletişim için kullanılır.
                </p>
              </form>

              {/* Alt bilgi */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                {[
                  { icon: "⚡", title: "Hızlı Kurulum", desc: "10 dakikada hazır" },
                  { icon: "🔒", title: "Güvenli", desc: "Verileriniz şifreli" },
                  { icon: "🎯", title: "Kişiye Özel", desc: "Sektörünüze uygun" },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="text-center p-4 rounded-2xl bg-gray-50"
                  >
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="text-sm font-bold text-nabiz-dark">{f.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-nabiz-dark text-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm">© 2026 nabızai — Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
