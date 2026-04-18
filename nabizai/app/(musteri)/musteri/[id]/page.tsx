"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface MusteriPanel {
  id: string; musteriAd: string; yetkili?: string; email?: string; il?: string;
  paket: string; olusturulma?: string; kategoriler?: string[];
  anahtar_kelimeler?: string[]; sosyal_medya?: { platform: string; aktif: boolean }[];
  duygu_analizi?: boolean; kriz_erken_uyari?: boolean; ai_yorum?: boolean;
  telegram_aktif?: boolean; whatsapp_aktif?: boolean;
  gunluk_email?: boolean; email_saati?: string; haftalik_pdf?: boolean;
  durum?: "aktif" | "askida" | "iptal";
}

interface Haber {
  id: number; baslik: string; kaynak?: string; tarih?: string;
  risk_skoru?: number; duygu?: string; kategori?: string;
  metadata?: Record<string, any>;
}

const PAKET_LABEL: Record<string, string> = {
  izleme: "İzleme", radar_pro: "Radar Pro", istihbarat: "İstihbarat",
};

function RiskBadge({ skor }: { skor?: number }) {
  if (!skor) return null;
  const cls = skor >= 8 ? "bg-red-100 text-red-600" : skor >= 5 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-700";
  const label = skor >= 8 ? "Yüksek" : skor >= 5 ? "Orta" : "Düşük";
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${cls}`}>{label} ({skor})</span>;
}

type Sekme = "dashboard" | "haberler" | "raporlar" | "hesabim";

function RaporlarSekme({ musteri }: { musteri: MusteriPanel }) {
  const [raporlar, setRaporlar] = useState<{ dosya: string; boyut: number; tarih: string }[]>([]);
  const [rLoading, setRLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raporlar")
      .then(r => r.json())
      .then(d => { setRaporlar(Array.isArray(d) ? d : (d.raporlar || [])); setRLoading(false); })
      .catch(() => setRLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-nabiz-dark">Raporlar</p>
          <span className="text-xs text-gray-400">{raporlar.length} rapor</span>
        </div>
        {rLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Yükleniyor...
          </div>
        ) : raporlar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-3">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            <p className="text-sm font-semibold">Henüz rapor oluşturulmadı</p>
            <p className="text-xs text-center max-w-xs">Raporlar, raporlama planınıza göre otomatik oluşturulacak.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {raporlar.map(r => (
              <div key={r.dosya} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-nabiz-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-nabiz-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-nabiz-dark truncate">{r.dosya}</p>
                    <p className="text-xs text-gray-400">{(r.boyut / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <a
                  href={`/api/raporlar/indir?dosya=${encodeURIComponent(r.dosya)}`}
                  className="px-3 py-1.5 bg-nabiz-navy/5 text-nabiz-navy text-xs font-semibold rounded-lg hover:bg-nabiz-navy/10 transition-colors flex-shrink-0"
                >
                  İndir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-bold text-nabiz-dark">Raporlama Planınız</p>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {musteri.gunluk_email && <span className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl">Günlük E-posta — {musteri.email_saati}</span>}
          {musteri.haftalik_pdf && <span className="px-3 py-2 bg-orange-50 text-nabiz-orange text-xs font-bold rounded-xl">Haftalık PDF</span>}
          {!musteri.gunluk_email && !musteri.haftalik_pdf && <p className="text-gray-400 text-sm">Otomatik raporlama aktif değil</p>}
        </div>
      </div>
    </div>
  );
}

export default function MusteriPaneliPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [musteri, setMusteri] = useState<MusteriPanel | null>(null);
  const [haberler, setHaberler] = useState<Haber[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sekme, setSekme] = useState<Sekme>("dashboard");
  const [arama, setArama] = useState("");
  const [zamanFiltresi, setZamanFiltresi] = useState<"1h" | "6h" | "24h" | "7d" | "custom">("24h");
  const [baslangicTarihi, setBaslangicTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [cikisYukleniyor, setCikisYukleniyor] = useState(false);

  useEffect(() => {
    async function yukle() {
      setYukleniyor(true);
      try {
        const [listRes, haberRes] = await Promise.all([
          fetch("/api/musteri-paneli"),
          fetch(`/api/customer-feed?panel_id=${id}`),
        ]);
        if (listRes.ok) {
          const list: MusteriPanel[] = await listRes.json();
          const bulunan = list.find(m => m.id === id);
          if (bulunan) setMusteri(bulunan);
        }
        if (haberRes.ok) {
          const hd = await haberRes.json();
          const rawItems = Array.isArray(hd) ? hd : (hd.items || []);
          const mapped = rawItems.map((r: any) => ({
            id: r.id,
            baslik: r.title || r.baslik || "",
            kaynak: r.source || r.kaynak || "",
            tarih: r.published_date || r.ingested_date || r.tarih || "",
            risk_skoru: (r.risk_level === 'high' ? 9 : r.risk_level === 'medium' ? 6 : 2),
            kategori: r.category || "",
            metadata: r.metadata || {}
          }));
          setHaberler(mapped);
        }
        // Görüntüleme logu
        fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eylem: "haberler_goruntule", musteri_id: id, detay: {} }),
        }).catch(() => {});
      } finally {
        setYukleniyor(false);
      }
    }
    yukle();
  }, [id]);

  async function cikisYap() {
    setCikisYukleniyor(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!musteri) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-lg font-semibold">Panel bulunamadı</p>
        <button onClick={cikisYap} className="text-nabiz-orange font-semibold hover:underline text-sm">Çıkış Yap</button>
      </div>
    );
  }

  if (musteri.durum === "askida") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <p className="text-xl font-bold text-nabiz-dark">Hesabınız Askıya Alındı</p>
        <p className="text-sm max-w-sm text-center">Ödeme veya hizmet durdurma nedeniyle platform erişiminiz geçici olarak askıya alınmıştır. Lütfen destek ekibiyle iletişime geçin.</p>
        <button onClick={cikisYap} disabled={cikisYukleniyor} className="mt-4 px-6 py-2.5 bg-nabiz-navy text-white text-sm font-bold rounded-xl hover:bg-nabiz-navy/90 shadow-lg">Çıkış Yap</button>
      </div>
    );
  }

  const filtreliHaberler = haberler.filter(h => {
    if (arama && !h.baslik.toLowerCase().includes(arama.toLowerCase())) return false;
    if (h.tarih) {
      const hd = new Date(h.tarih).getTime();
      if (!isNaN(hd)) {
        if (zamanFiltresi === "custom" && baslangicTarihi && bitisTarihi) {
           const bas = new Date(baslangicTarihi).getTime();
           const bit = new Date(bitisTarihi).getTime() + 86399999; // end of day
           if (hd < bas || hd > bit) return false;
        } else {
          const diffHrs = (Date.now() - hd) / (1000 * 60 * 60);
          if (zamanFiltresi === "1h" && diffHrs > 1) return false;
          if (zamanFiltresi === "6h" && diffHrs > 6) return false;
          if (zamanFiltresi === "24h" && diffHrs > 24) return false;
          if (zamanFiltresi === "7d" && diffHrs > 168) return false;
        }
      }
    }
    return true;
  });

  const sokak = (key: Sekme, label: string) => (
    <button
      onClick={() => setSekme(key)}
      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        sekme === key ? "bg-nabiz-navy text-white" : "text-gray-500 hover:text-nabiz-dark hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  const prList = Object.entries(
    filtreliHaberler.reduce((acc, h) => {
      // Dinamik Lider / Kurum / Anahtar Kelime Ayıklayıcı
      const entity = h.metadata?.entity_name || h.metadata?.belediye_baskani_bahis || h.metadata?.kurum_bahis;
      if (entity) {
        if (!acc[entity]) acc[entity] = { count: 0, ave: 0, ratingSum: 0, dist: h.metadata?.district_id };
        acc[entity].count++;
        acc[entity].ave += h.metadata?.reklam_esdegeri || 0;
        acc[entity].ratingSum += h.metadata?.rating || 0;
      }
      return acc;
    }, {} as Record<string, { count: number, ave: number, ratingSum: number, dist: string }>)
  ).map(([isim, veri]) => ({ isim, ...veri, rating: veri.ratingSum / veri.count }))
   .sort((a,b) => b.ave - a.ave);

  // Sidebar Hizmet Listesi
  const hizmetler = [
    { ad: "Gerçek Zamanlı Takip", aktif: true },
    { ad: "Duygu Analizi (AI)", aktif: musteri.duygu_analizi },
    { ad: "Kriz Erken Uyarı", aktif: musteri.kriz_erken_uyari },
    { ad: "Yapay Zeka Yorumu", aktif: musteri.ai_yorum },
    { ad: "Günlük Rapor (E-posta)", aktif: musteri.gunluk_email },
    { ad: "Haftalık Analiz (PDF)", aktif: musteri.haftalik_pdf },
    { ad: "Acil Bildirim (Telegram)", aktif: musteri.telegram_aktif },
  ];

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-nabiz-dark flex-col hidden lg:flex border-r border-gray-800">
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0 cursor-pointer" onClick={() => setSekme("dashboard")}>
          <div className="flex flex-col items-start gap-1">
             <img src="/01_nabizai_logo_horizontal_light_1600w.png" alt="nabız ai" className="h-6" onError={(e) => (e.currentTarget.style.display = 'none')} />
             <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase mt-2">Müşteri Ekranı</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <p className="px-2 text-xs font-bold text-nabiz-orange uppercase tracking-widest mb-4">Aktif Hizmetler</p>
          <div className="space-y-1">
            {hizmetler.map(h => (
              <div key={h.ad} className="flex items-center gap-3 px-2 py-2 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${h.aktif ? 'bg-nabiz-green shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} />
                <span className={`text-sm ${h.aktif ? 'text-white font-medium' : 'text-gray-500 line-through'}`}>{h.ad}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-white/10 bg-black/20">
           <button onClick={cikisYap} disabled={cikisYukleniyor} className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-colors">
              Hesaptan Çıkış
           </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 flex-shrink-0">
          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-nabiz-navy/5 flex items-center justify-center text-nabiz-navy font-bold text-sm ring-1 ring-nabiz-navy/10">
                {musteri.musteriAd[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-base font-extrabold text-nabiz-dark">{musteri.musteriAd}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{PAKET_LABEL[musteri.paket] || musteri.paket}</p>
              </div>
            </div>
            
            {/* Mobile Nav Button (Visible only on mobile) */}
            <div className="lg:hidden">
              <button className="p-2 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>

          {/* Menü Sekmeleri */}
          <div className="px-6 flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide text-sm">
            <button onClick={() => setSekme("dashboard")} className={`pb-3 font-semibold transition-colors border-b-2 ${sekme === "dashboard" ? "border-nabiz-orange text-nabiz-dark" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Gözetim Özeti</button>
            <button onClick={() => setSekme("haberler")} className={`pb-3 font-semibold transition-colors border-b-2 ${sekme === "haberler" ? "border-nabiz-orange text-nabiz-dark" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Akış Analizi</button>
            <button onClick={() => setSekme("raporlar")} className={`pb-3 font-semibold transition-colors border-b-2 ${sekme === "raporlar" ? "border-nabiz-orange text-nabiz-dark" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Raporlar</button>
            <button onClick={() => setSekme("hesabim")} className={`pb-3 font-semibold transition-colors border-b-2 ${sekme === "hesabim" ? "border-nabiz-orange text-nabiz-dark" : "border-transparent text-gray-400 hover:text-gray-600"}`}>Kurum Bilgileri</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="max-w-5xl mx-auto px-6 py-8">
            
            {/* ── Dashboard (Özet) ─────────────────────────────────────── */}
            {sekme === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-nabiz-dark">Dijital Gözetim Özeti</h2>
                    <p className="text-xs text-gray-500 mt-1">Platformun sizin için sağladığı anlık içgörüler.</p>
                  </div>
                  
                  {/* Yeni Tarih Filtresi */}
                  <div className="flex flex-col gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                      {[ "1h", "6h", "24h", "7d", "custom" ].map(fid => (
                        <button key={fid} onClick={() => setZamanFiltresi(fid as any)} 
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${zamanFiltresi === fid ? "bg-white text-nabiz-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                          {fid === "1h" ? "1s" : fid === "6h" ? "6s" : fid === "24h" ? "24s" : fid === "7d" ? "7g" : "Özel"}
                        </button>
                      ))}
                    </div>
                    {zamanFiltresi === "custom" && (
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm animate-in fade-in zoom-in-95">
                        <input type="date" value={baslangicTarihi} onChange={e => setBaslangicTarihi(e.target.value)} className="px-2 py-1 text-xs font-semibold outline-none text-gray-700" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={bitisTarihi} onChange={e => setBitisTarihi(e.target.value)} className="px-2 py-1 text-xs font-semibold outline-none text-gray-700" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: `Toplam Kayıt`, val: filtreliHaberler.length, color: "text-nabiz-dark" },
                    { label: "Kritik Risk (Kriz)", val: filtreliHaberler.filter(h => (h.risk_skoru || 0) >= 8).length, color: "text-red-500" },
                    { label: "Orta Risk", val: filtreliHaberler.filter(h => (h.risk_skoru || 0) >= 5 && (h.risk_skoru || 0) < 8).length, color: "text-amber-500" },
                    { label: "Aktif Hedef", val: (musteri.sosyal_medya || []).filter(s => s.aktif).length + (musteri.kategoriler || []).length, color: "text-nabiz-orange" },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-2">{s.label}</p>
                    </div>
                  ))}
                </div>

            {prList.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Dijital Etki Raporu</h3>
                  <p className="text-xs text-gray-500 mt-1">Sistem, hedeflerin tahmini reklam eşdeğerini (AVE) simüle eder.</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {prList.map((pr, idx) => (
                    <div key={pr.isim} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                         {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{pr.isim}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{pr.count} Bahis</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-bold text-gray-900">{pr.ave.toLocaleString("tr-TR")} ₺</p>
                         <p className="text-[10px] text-gray-500 mt-0.5">Etki: {pr.rating.toFixed(1)}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Yakın Zaman Akışı</p>
                <button onClick={() => setSekme("haberler")} className="text-xs font-semibold text-gray-500 hover:text-gray-900">Tümü</button>
              </div>
              <div className="divide-y divide-gray-50">
                {filtreliHaberler.slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">{h.baslik}</p>
                      <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">{h.kaynak} • {h.tarih || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>
        )}

        {/* ── Haberler ──────────────────────────────────────── */}
        {sekme === "haberler" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                </svg>
                <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Haberlerde ara..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
              </div>
              <div className="flex bg-gray-200 p-0.5 rounded-lg flex-shrink-0">
                {[ { id: "1h", label: "1s" }, { id: "6h", label: "6s" }, { id: "24h", label: "24s" }, { id: "7d", label: "7 Gün" } ].map(f => (
                  <button key={f.id} onClick={() => setZamanFiltresi(f.id as any)} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${zamanFiltresi === f.id ? "bg-white text-nabiz-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-400">{filtreliHaberler.length} haber</div>
              <div className="divide-y divide-gray-50">
                {filtreliHaberler.map(h => (
                  <div key={h.id} className="px-5 py-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nabiz-dark">{h.baslik}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {h.kaynak && <span className="text-xs text-gray-400">{h.kaynak}</span>}
                        {h.tarih && <span className="text-xs text-gray-400">{h.tarih}</span>}
                        {h.duygu && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${h.duygu === "negatif" ? "bg-red-100 text-red-600" : h.duygu === "pozitif" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>{h.duygu}</span>
                        )}
                      </div>
                    </div>
                    <RiskBadge skor={h.risk_skoru} />
                  </div>
                ))}
                {filtreliHaberler.length === 0 && <p className="text-center text-gray-300 text-sm py-12">Haber bulunamadı</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Raporlar ──────────────────────────────────────── */}
        {sekme === "raporlar" && (
          <RaporlarSekme musteri={musteri} />
        )}

        {/* ── Hesabım ───────────────────────────────────────── */}
        {sekme === "hesabim" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-bold text-nabiz-dark">Hesap Bilgilerim</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                ["Kurum Adı", musteri.musteriAd],
                ["Yetkili", musteri.yetkili || "—"],
                ["E-posta", musteri.email || "—"],
                ["İl", musteri.il || "—"],
                ["Paket", PAKET_LABEL[musteri.paket] || musteri.paket],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-gray-400 font-medium">{k}</span>
                  <span className="font-semibold text-nabiz-dark">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-400 text-center">
                Bilgilerinizi güncellemek için sistem yöneticinizle iletişime geçin.
              </p>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}
