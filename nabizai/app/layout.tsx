import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "nabızai — Yerel Medya İzleme ve Erken Uyarı Platformu",
  description:
    "Yerel haberler, sosyal medya ve rakip analizi tek ekranda. Kriz öncesi sizi uyarır, fırsatları kaçırmazsınız. AI destekli medya takip SaaS.",
  keywords: [
    "medya takip",
    "yerel medya",
    "kriz yönetimi",
    "rakip analizi",
    "AI medya izleme",
    "nabızai",
    "Bodrum",
    "Muğla",
  ],
  authors: [{ name: "nabızai" }],
  openGraph: {
    title: "nabızai — Yerel Medya İzleme Platformu",
    description:
      "Yerel haberler, sosyal medya ve rakip analizi tek ekranda.",
    url: "https://nabizai.com",
    siteName: "nabızai",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
