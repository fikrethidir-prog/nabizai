import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 sadece lokal geliştirme için gerekli
  // Production'da (Vercel) Supabase kullanılır
  serverExternalPackages: ['better-sqlite3'],

  // Production optimizasyonları
  poweredByHeader: false,
  compress: true,

  // Resim optimizasyonu
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },

  // Environment bilgisi
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

export default nextConfig;
