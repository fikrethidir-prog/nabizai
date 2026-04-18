"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const hata_param = searchParams.get("hata");

  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(
    hata_param === "yetkisiz" ? "Bu sayfaya erişim yetkiniz yok." :
    hata_param === "erisim-yok" ? "Bu müşteri paneline erişim yetkiniz bulunmuyor." : ""
  );

  const [sifreyiGoster, setSifreyiGoster] = useState(false);

  // Şifremi unuttum state
  const [sifremiUnuttum, setSifremiUnuttum] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetYukleniyor, setResetYukleniyor] = useState(false);
  const [resetMesaj, setResetMesaj] = useState("");

  async function girisYap(e: React.FormEvent) {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sifre }),
      });
      const data = await res.json();
      if (!res.ok) { setHata(data.error || "Giriş başarısız"); return; }

      if (redirect && redirect !== "/login") {
        router.push(redirect);
      } else if (data.rol === "admin") {
        router.push("/admin");
      } else if (data.rol === "musteri" && data.musteri_ids?.length > 0) {
        router.push(`/musteri/${data.musteri_ids[0]}`);
      } else {
        router.push("/");
      }
    } catch {
      setHata("Sunucu bağlantı hatası");
    } finally {
      setYukleniyor(false);
    }
  }

  async function sifreSifirla(e: React.FormEvent) {
    e.preventDefault();
    setResetYukleniyor(true);
    setResetMesaj("");
    try {
      const res = await fetch("/api/auth/sifre-sifirla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      setResetMesaj(data.mesaj || "İşlem tamamlandı.");
    } catch {
      setResetMesaj("Sunucu bağlantı hatası");
    } finally {
      setResetYukleniyor(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nabiz-navy via-nabiz-navy/90 to-nabiz-orange/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-nabiz-orange rounded-2xl flex items-center justify-center shadow-lg shadow-nabiz-orange/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">nabızai</h1>
              <p className="text-xs text-white/50 font-medium">Medya Takip Sistemi</p>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            {sifremiUnuttum ? "Şifrenizi sıfırlayın" : "Hesabınıza giriş yapın"}
          </p>
        </div>

        {/* Form kartı */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 p-8">
          {hata && !sifremiUnuttum && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {hata}
            </div>
          )}

          {!sifremiUnuttum ? (
            /* ─── Giriş Formu ─── */
            <>
              <form onSubmit={girisYap} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Şifre
                    </label>
                    <button
                      type="button"
                      onClick={() => { setSifremiUnuttum(true); setResetEmail(email); setResetMesaj(""); }}
                      className="text-xs text-nabiz-navy hover:text-nabiz-orange font-bold transition-colors"
                      tabIndex={-1}
                    >
                      Şifremi unuttum
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={sifreyiGoster ? "text" : "password"}
                      value={sifre}
                      onChange={e => setSifre(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setSifreyiGoster(!sifreyiGoster)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-nabiz-navy focus:outline-none transition-colors"
                      tabIndex={-1}
                    >
                      {sifreyiGoster ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="w-full py-3 bg-nabiz-navy text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 mt-2 shadow-md shadow-nabiz-navy/20"
                >
                  {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
              </form>

              <div className="mt-4 pt-5 border-t border-gray-100 text-center">
                <a href="/demo" className="text-xs text-nabiz-orange font-semibold hover:underline">
                  Hesabınız yok mu? Demo talep edin →
                </a>
              </div>
            </>
          ) : (
            /* ─── Şifremi Unuttum Formu ─── */
            <>
              {resetMesaj ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                    <svg className="w-7 h-7 text-nabiz-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-4">{resetMesaj}</p>
                  <button
                    onClick={() => { setSifremiUnuttum(false); setResetMesaj(""); }}
                    className="text-sm text-nabiz-navy font-semibold hover:underline"
                  >
                    ← Giriş ekranına dön
                  </button>
                </div>
              ) : (
                <form onSubmit={sifreSifirla} className="space-y-5">
                  <p className="text-sm text-gray-500 mb-2">
                    Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      required
                      autoFocus
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy/30 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetYukleniyor}
                    className="w-full py-3 bg-nabiz-orange text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-nabiz-orange/20"
                  >
                    {resetYukleniyor ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setSifremiUnuttum(false)}
                      className="text-xs text-gray-400 hover:text-nabiz-navy font-medium transition-colors"
                    >
                      ← Giriş ekranına dön
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © 2026 nabızai — Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
