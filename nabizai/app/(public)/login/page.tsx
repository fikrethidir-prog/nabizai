"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        console.log("[nabızai] Login denemesi:", email);
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("[nabızai] Login sonucu:", { data, authError });

        if (authError) {
          console.error("[nabızai] Auth hatası:", authError.message, authError.status);
          if (authError.message.includes("Invalid login credentials")) {
            setError("E-posta veya şifre hatalı.");
          } else if (authError.message.includes("Email not confirmed")) {
            setError("E-posta adresinizi doğrulamanız gerekiyor. Lütfen gelen kutunuzu kontrol edin.");
          } else {
            setError(authError.message);
          }
          return;
        }

        console.log("[nabızai] Giriş başarılı! Dashboard'a yönlendiriliyor...");
        router.push("/dashboard");
        router.refresh();
      } else {
        // Kayıt ol
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
          } else {
            setError(signUpError.message);
          }
          return;
        }

        setSuccess("Hesap oluşturuldu! Şimdi giriş yapabilirsiniz.");
        setMode("login");
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-nabiz-navy/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-nabiz-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 p-8 md:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link href="/">
              <img
                src="/nabizai_logo.svg"
                alt="nabızai"
                className="h-10 hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-nabiz-dark">
              {mode === "login" ? "Hoş geldiniz" : "Hesap Oluştur"}
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              {mode === "login"
                ? "Hesabınıza giriş yaparak panele erişin"
                : "Yeni bir hesap oluşturun"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-nabiz-red flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-nabiz-green flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@sirket.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-nabiz-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nabiz-navy/30 focus:border-nabiz-navy transition-all duration-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Şifre
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-nabiz-orange hover:text-nabiz-orange-light transition-colors"
                  >
                    Şifremi unuttum
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-nabiz-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nabiz-navy/30 focus:border-nabiz-navy transition-all duration-200"
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-gray-400">En az 6 karakter</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-nabiz-navy text-white font-semibold rounded-xl hover:bg-nabiz-navy-light transition-all duration-300 shadow-lg shadow-nabiz-navy/20 hover:shadow-xl hover:shadow-nabiz-navy/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {mode === "login" ? "Giriş yapılıyor..." : "Hesap oluşturuluyor..."}
                </>
              ) : mode === "login" ? (
                "Giriş Yap"
              ) : (
                "Hesap Oluştur"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-8 text-center">
            {mode === "login" ? (
              <p className="text-sm text-gray-500">
                Hesabınız yok mu?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                  className="text-nabiz-orange font-semibold hover:text-nabiz-orange-light transition-colors"
                >
                  Kayıt olun
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Zaten hesabınız var mı?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                  className="text-nabiz-orange font-semibold hover:text-nabiz-orange-light transition-colors"
                >
                  Giriş yapın
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 nabızai — Yerel medya izleme platformu
        </p>
      </div>
    </div>
  );
}
