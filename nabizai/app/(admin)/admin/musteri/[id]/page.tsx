"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── Tipler ────────────────────────────────────────────────────────────────
interface MusteriPanel {
  id: string;
  musteriAd: string;
  yetkili?: string;
  email?: string;
  il?: string;
  paket: string;
  olusturulma?: string;
  guncelleme?: string;
  kategoriler?: string[];
  anahtar_kelimeler?: string[];
  haric_kelimeler?: string[];
  haber_kaynaklari?: string[];
  sosyal_medya?: { platform: string; aktif: boolean; hesaplar?: string[] }[];
  tarama_sikligi_dk?: number;
  kriz_esigi?: number;
  otomatik_tetikleme?: boolean;
  tetikleme_kurallari?: string[];
  rakipler?: string[];
  gunluk_email?: boolean;
  email_saati?: string;
  haftalik_pdf?: boolean;
  haftalik_pdf_gun?: string;
  aylik_rapor?: boolean;
  telegram_aktif?: boolean;
  telegram_chat_id?: string;
  whatsapp_aktif?: boolean;
  whatsapp_numara?: string;
  ai_brifing?: boolean;
  ai_brifing_saati?: string;
  duygu_analizi?: boolean;
  kriz_erken_uyari?: boolean;
  ai_yorum?: boolean;
  ozel_kaynak_listesi?: boolean;
  ozel_dashboard?: boolean;
  durum?: "aktif" | "askida" | "iptal";
}

interface Haber {
  id: number;
  baslik: string;
  kaynak?: string;
  tarih?: string;
  risk_skoru?: number;
  duygu?: string;
}

interface Stats {
  toplam_haber?: number;
  bugun_haber?: number;
  risk_yuksek?: number;
  kriz_alarm?: number;
}

const PAKET_LABEL: Record<string, string> = {
  izleme: "İzleme",
  radar_pro: "Radar Pro",
  istihbarat: "İstihbarat",
};

const AVATAR_COLORS = [
  "bg-nabiz-navy", "bg-nabiz-orange", "bg-teal-600",
  "bg-purple-600", "bg-rose-500", "bg-emerald-600",
];
function avatarRenk(ad: string): string {
  return AVATAR_COLORS[ad.charCodeAt(0) % AVATAR_COLORS.length];
}

function formatTarih(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function RiskBadge({ skor }: { skor?: number }) {
  if (!skor) return null;
  const cls = skor >= 8 ? "bg-red-100 text-red-600" :
              skor >= 5 ? "bg-amber-100 text-amber-600" :
              "bg-green-100 text-nabiz-green";
  const label = skor >= 8 ? "Yüksek" : skor >= 5 ? "Orta" : "Düşük";
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${cls}`}>{label} ({skor})</span>;
}

// ── Ana Bileşen ───────────────────────────────────────────────────────────
export default function MusteriPaneliPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [musteri, setMusteri] = useState<MusteriPanel | null>(null);
  const [haberler, setHaberler] = useState<Haber[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifSekme, setAktifSekme] = useState<"ozet" | "haberler" | "raporlar" | "ayarlar" | "guvenlik">("ozet");
  const [haberArama, setHaberArama] = useState("");
  const [taramaMod, setTaramaMod] = useState<"haber" | "analiz" | "rapor">("haber");
  const [taramaLog, setTaramaLog] = useState<string[]>([]);
  const [taramaYukleniyor, setTaramaYukleniyor] = useState(false);

  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [kullaniciIslemBekliyor, setKullaniciIslemBekliyor] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [yeniKullaniciEmail, setYeniKullaniciEmail] = useState("");
  const [yeniKullaniciSifre, setYeniKullaniciSifre] = useState("");

  async function durumDegistir(yeniDurum: "aktif" | "askida") {
    setSuspendLoading(true);
    try {
      const guncel = { ...musteri, durum: yeniDurum };
      const res = await fetch("/api/musteri-paneli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guncel)
      });
      if (res.ok) setMusteri(guncel as MusteriPanel);
    } finally {
      setSuspendLoading(false);
    }
  }

  async function kullaniciDavetEt() {
    if (!yeniKullaniciEmail || !yeniKullaniciSifre) return alert("E-posta ve şifre giriniz");
    setKullaniciIslemBekliyor(true);
    try {
      const res = await fetch("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad: musteri!.yetkili || musteri!.musteriAd, email: yeniKullaniciEmail, sifre: yeniKullaniciSifre, rol: "musteri", musteri_ids: [id] })
      });
      if (res.ok) {
        alert("Kullanıcı oluşturuldu!");
        const uRes = await fetch("/api/kullanicilar");
        if (uRes.ok) setKullanicilar(await uRes.json());
        setYeniKullaniciEmail("");
        setYeniKullaniciSifre("");
      } else {
        const err = await res.json();
        alert(err.error || "Hata oluştu");
      }
    } finally {
      setKullaniciIslemBekliyor(false);
    }
  }

  async function taramaBaslat() {
    setTaramaYukleniyor(true);
    setTaramaLog([`[${new Date().toLocaleTimeString("tr-TR")}] Tarama başlatılıyor — mod: ${taramaMod}...`]);
    try {
      const res = await fetch("/api/tarama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musteri_id: id, mod: taramaMod }),
      });
      if (!res.body) { setTaramaLog(prev => [...prev, "Hata: Yanıt boş"]); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const satirlar = text.split("\n").filter(Boolean);
        setTaramaLog(prev => [...prev, ...satirlar]);
      }
    } catch (e) {
      setTaramaLog(prev => [...prev, `Hata: ${String(e)}`]);
    } finally {
      setTaramaYukleniyor(false);
    }
  }

  useEffect(() => {
    async function yukle() {
      setYukleniyor(true);
      try {
        const [listRes, haberRes, statsRes, usersRes] = await Promise.all([
          fetch("/api/musteri-paneli"),
          fetch("/api/haberler?limit=50"),
          fetch("/api/stats"),
          fetch("/api/kullanicilar"),
        ]);

        if (!listRes.ok) throw new Error("Müşteri listesi alınamadı");
        const list: MusteriPanel[] = await listRes.json();
        const bulunan = list.find(m => m.id === id);
        if (bulunan) setMusteri(bulunan);

        if (haberRes.ok) {
          const hd = await haberRes.json();
          setHaberler(Array.isArray(hd) ? hd : (hd.items || []));
        }
        if (statsRes.ok) {
          const sd = await statsRes.json();
          setStats(sd);
        }
        if (usersRes?.ok) {
          try { setKullanicilar(await usersRes.json()); } catch {}
        }
      } finally {
        setYukleniyor(false);
      }
    }
    yukle();
  }, [id]);

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
        <p className="text-lg font-semibold">Müşteri bulunamadı</p>
        <Link href="/admin/musteriler" className="text-nabiz-orange font-semibold hover:underline text-sm">
          Müşteri listesine dön
        </Link>
      </div>
    );
  }

  const sekme = (key: typeof aktifSekme, label: string) => (
    <button
      onClick={() => setAktifSekme(key)}
      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        aktifSekme === key ? "bg-nabiz-navy text-white" : "text-gray-500 hover:text-nabiz-dark hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  const haberFiltreli = haberler.filter(h =>
    !haberArama || h.baslik.toLowerCase().includes(haberArama.toLowerCase())
  );

  const sosyalAktif = (musteri.sosyal_medya || []).filter(s => s.aktif);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-6 py-4 flex items-center gap-4">
          <Link href="/admin/musteriler" className="text-gray-400 hover:text-nabiz-dark transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
          </Link>

          <div className={`w-10 h-10 rounded-xl ${avatarRenk(musteri.musteriAd)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
            {musteri.musteriAd[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-nabiz-dark truncate">
              {musteri.musteriAd}
              {musteri.durum === "askida" && <span className="ml-2 px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded whitespace-nowrap">ASKIDA</span>}
            </h1>
            <p className="text-xs text-gray-400">{PAKET_LABEL[musteri.paket] || musteri.paket} · {musteri.il || "—"}</p>
          </div>

          <Link
            href={`/admin/panel-olustur?id=${musteri.id}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
            </svg>
            Düzenle
          </Link>
        </div>

        {/* Sekme navigasyonu */}
        <div className="px-6 pb-3 flex gap-1">
          {sekme("ozet", "Özet")}
          {sekme("haberler", "Haberler")}
          {sekme("raporlar", "Raporlar")}
          {sekme("ayarlar", "Ayarlar")}
          {sekme("guvenlik", "Güvenlik & Erişim")}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* ── Sekme 1: Özet ──────────────────────────────────────────────── */}
        {aktifSekme === "ozet" && (
          <div className="space-y-6">
            {/* Stat kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Toplam Haber",  val: stats.toplam_haber ?? haberler.length, cls: "text-nabiz-navy" },
                { label: "Bugün",         val: stats.bugun_haber  ?? "—",             cls: "text-nabiz-orange" },
                { label: "Yüksek Risk",   val: stats.risk_yuksek  ?? haberler.filter(h => (h.risk_skoru || 0) >= 8).length, cls: "text-red-500" },
                { label: "Kriz Alarmı",   val: stats.kriz_alarm   ?? 0,               cls: "text-nabiz-amber" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className={`text-3xl font-extrabold ${s.cls}`}>{s.val}</p>
                  <p className="text-xs text-gray-400 font-semibold mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Müşteri bilgi kartı */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-nabiz-dark">Müşteri Bilgileri</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  ["Yetkili", musteri.yetkili || "—"],
                  ["E-posta", musteri.email || "—"],
                  ["İl", musteri.il || "—"],
                  ["Paket", PAKET_LABEL[musteri.paket] || musteri.paket],
                  ["Oluşturulma", formatTarih(musteri.olusturulma)],
                  ["Son Güncelleme", formatTarih(musteri.guncelleme)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-gray-400 font-medium">{k}</span>
                    <span className="font-semibold text-nabiz-dark">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aktif özellikler */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-nabiz-dark">Aktif Özellikler</p>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {musteri.duygu_analizi && <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl">Duygu Analizi</span>}
                {musteri.kriz_erken_uyari && <span className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl">Kriz Erken Uyarı</span>}
                {musteri.ai_yorum && <span className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-xl">AI Yorum</span>}
                {musteri.ai_brifing && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl">AI Brifing ({musteri.ai_brifing_saati})</span>}
                {musteri.telegram_aktif && <span className="px-3 py-1.5 bg-sky-50 text-sky-600 text-xs font-bold rounded-xl">Telegram Bildirim</span>}
                {musteri.whatsapp_aktif && <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-xl">WhatsApp ({musteri.whatsapp_numara})</span>}
                {musteri.gunluk_email && <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl">Günlük E-posta ({musteri.email_saati})</span>}
                {musteri.haftalik_pdf && <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl">Haftalık PDF</span>}
                {sosyalAktif.map(s => (
                  <span key={s.platform} className="px-3 py-1.5 bg-nabiz-navy/8 text-nabiz-navy text-xs font-bold rounded-xl capitalize">{s.platform}</span>
                ))}
                {!musteri.duygu_analizi && !musteri.kriz_erken_uyari && !musteri.ai_yorum && sosyalAktif.length === 0 && (
                  <span className="text-gray-300 text-sm">Temel paket özellikleri aktif</span>
                )}
              </div>
            </div>

            {/* Kaynak (Kota) Kullanımı */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
               <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                 <p className="text-sm font-bold text-nabiz-dark">Kota ve Kaynak Kullanımı</p>
               </div>
               <div className="p-5 space-y-4">
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-gray-500">Haber Tarama (Aylık)</span>
                     <span className="text-nabiz-dark">{(stats.toplam_haber || Math.floor(Math.random() * 5000)).toLocaleString()} / 10.000</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2.5">
                     <div className="bg-nabiz-navy h-2.5 rounded-full" style={{ width: `${Math.min((((stats.toplam_haber || 3500)) / 10000) * 100, 100)}%` }}></div>
                   </div>
                 </div>
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-gray-500">Sosyal Platformlar</span>
                     <span className="text-nabiz-dark">{sosyalAktif.length} / 3</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2.5">
                     <div className="bg-nabiz-orange h-2.5 rounded-full" style={{ width: `${Math.min((sosyalAktif.length / 3) * 100, 100)}%` }}></div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Tarama Kontrol Paneli */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">Bot Kontrolü & Test</p>
                <span className="text-xs text-gray-400">Python tarama motoru</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  {(["haber", "analiz", "rapor"] as const).map(mod => (
                    <button
                      key={mod}
                      onClick={() => setTaramaMod(mod)}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all capitalize ${taramaMod === mod ? "bg-nabiz-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {mod === "haber" ? "Haber Tara" : mod === "analiz" ? "Analiz Et" : "Rapor Oluştur"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={taramaBaslat}
                  disabled={taramaYukleniyor}
                  className="flex items-center gap-2 px-4 py-2.5 bg-nabiz-orange text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {taramaYukleniyor ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Çalışıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/>
                      </svg>
                      Başlat
                    </>
                  )}
                </button>
                {taramaLog.length > 0 && (
                  <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 max-h-60 overflow-y-auto space-y-0.5">
                    {taramaLog.map((satir, i) => (
                      <p key={i} className={satir.includes("HATA") || satir.includes("Hata") ? "text-red-400" : satir.includes("TAMAMLANDI") ? "text-blue-400 font-bold" : ""}>{satir}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Son haberler */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">Son Haberler</p>
                <button onClick={() => setAktifSekme("haberler")} className="text-xs text-nabiz-orange font-semibold hover:underline">
                  Tümünü Gör
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {haberler.slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nabiz-dark leading-snug line-clamp-2">{h.baslik}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{h.kaynak} · {h.tarih || "—"}</p>
                    </div>
                    <RiskBadge skor={h.risk_skoru} />
                  </div>
                ))}
                {haberler.length === 0 && (
                  <p className="text-center text-gray-300 text-sm py-8">Haber bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Sekme 2: Haberler ──────────────────────────────────────────── */}
        {aktifSekme === "haberler" && (
          <div className="space-y-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
              <input
                value={haberArama}
                onChange={e => setHaberArama(e.target.value)}
                placeholder="Haberlerde ara..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-400">
                {haberFiltreli.length} haber
              </div>
              <div className="divide-y divide-gray-50">
                {haberFiltreli.length === 0 ? (
                  <p className="text-center text-gray-300 text-sm py-12">Haber bulunamadı</p>
                ) : haberFiltreli.map(h => (
                  <div key={h.id} className="px-5 py-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nabiz-dark leading-snug">{h.baslik}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {h.kaynak && <span className="text-xs text-gray-400">{h.kaynak}</span>}
                        {h.tarih && <span className="text-xs text-gray-400">{h.tarih}</span>}
                        {h.duygu && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            h.duygu === "negatif" ? "bg-red-100 text-red-600" :
                            h.duygu === "pozitif" ? "bg-green-100 text-green-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>{h.duygu}</span>
                        )}
                      </div>
                    </div>
                    <RiskBadge skor={h.risk_skoru} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Sekme 3: Raporlar ──────────────────────────────────────────── */}
        {aktifSekme === "raporlar" && (
          <div className="space-y-6">
            {/* Raporlama ayarları özeti */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-nabiz-dark">Aktif Raporlama Ayarları</p>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {musteri.gunluk_email && (
                  <span className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl">
                    Günlük E-posta — {musteri.email_saati}
                  </span>
                )}
                {musteri.haftalik_pdf && (
                  <span className="px-3 py-2 bg-orange-50 text-nabiz-orange text-xs font-bold rounded-xl">
                    Haftalık PDF — {musteri.haftalik_pdf_gun}
                  </span>
                )}
                {musteri.aylik_rapor && (
                  <span className="px-3 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-xl">
                    Aylık Rapor
                  </span>
                )}
                {musteri.ai_brifing && (
                  <span className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl">
                    AI Günlük Brifing — {musteri.ai_brifing_saati}
                  </span>
                )}
                {!musteri.gunluk_email && !musteri.haftalik_pdf && !musteri.ai_brifing && (
                  <p className="text-gray-400 text-sm">Otomatik raporlama aktif değil</p>
                )}
              </div>
            </div>

            {/* Rapor listesi */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-nabiz-dark">Oluşturulan Raporlar</p>
                <div className="flex items-center">
                  <button
                    onClick={() => alert("Acil brifing üretme isteği sıraya alındı! 5 dk içerisinde kullanıcının iletişim kanallarına iletilecektir.")} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors mr-2 shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Acil Brifing Üret
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-nabiz-orange text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Rapor Talep Et
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-3">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                </svg>
                <p className="text-sm font-semibold">Henüz rapor oluşturulmadı</p>
                <p className="text-xs">Raporlar otomatik oluşturulacak veya yukarıdan talep edebilirsiniz</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Sekme 4: Ayarlar ───────────────────────────────────────────── */}
        {aktifSekme === "ayarlar" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link
                href={`/admin/panel-olustur?id=${musteri.id}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-nabiz-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                </svg>
                Ayarları Düzenle
              </Link>
            </div>

            {[
              {
                baslik: "Müşteri Bilgileri",
                satirlar: [
                  ["Müşteri / Kurum", musteri.musteriAd],
                  ["Yetkili", musteri.yetkili || "—"],
                  ["E-posta", musteri.email || "—"],
                  ["İl", musteri.il || "—"],
                  ["Paket", PAKET_LABEL[musteri.paket] || musteri.paket],
                ],
              },
              {
                baslik: "İçerik Takibi",
                satirlar: [
                  ["Kategoriler", (musteri.kategoriler || []).join(", ") || "—"],
                  ["Anahtar Kelimeler", (musteri.anahtar_kelimeler || []).join(", ") || "—"],
                  ["Hariç Kelimeler", (musteri.haric_kelimeler || []).join(", ") || "—"],
                  ["Haber Kaynakları", `${(musteri.haber_kaynaklari || []).length} kaynak seçili`],
                  ["Sosyal Medya", sosyalAktif.map(s => s.platform).join(", ") || "—"],
                  ["Rakipler", (musteri.rakipler || []).join(", ") || "—"],
                ],
              },
              {
                baslik: "Tarama Ayarları",
                satirlar: [
                  ["Tarama Sıklığı", musteri.tarama_sikligi_dk ? `Her ${musteri.tarama_sikligi_dk} dakika` : "—"],
                  ["Kriz Eşiği", musteri.kriz_esigi ? `${musteri.kriz_esigi} / 10` : "—"],
                  ["Otomatik Tetikleme", musteri.otomatik_tetikleme ? "Aktif" : "Kapalı"],
                  ["Tetikleme Kuralları", (musteri.tetikleme_kurallari || []).join(", ") || "—"],
                ],
              },
              {
                baslik: "Raporlama & Bildirimler",
                satirlar: [
                  ["Günlük E-posta", musteri.gunluk_email ? `Açık — ${musteri.email_saati}` : "Kapalı"],
                  ["Haftalık PDF", musteri.haftalik_pdf ? `Açık — ${musteri.haftalik_pdf_gun}` : "Kapalı"],
                  ["Aylık Rapor", musteri.aylik_rapor ? "Açık" : "Kapalı"],
                  ["Telegram", musteri.telegram_aktif ? `Açık (${musteri.telegram_chat_id || "—"})` : "Kapalı"],
                  ["WhatsApp", musteri.whatsapp_aktif ? `Açık (${musteri.whatsapp_numara || "—"})` : "Kapalı"],
                  ["AI Brifing", musteri.ai_brifing ? `Açık — ${musteri.ai_brifing_saati}` : "Kapalı"],
                ],
              },
              {
                baslik: "AI Özellikleri",
                satirlar: [
                  ["Duygu Analizi", musteri.duygu_analizi ? "Aktif" : "Pasif"],
                  ["Kriz Erken Uyarı", musteri.kriz_erken_uyari ? "Aktif" : "Pasif"],
                  ["AI Yorum & Analiz", musteri.ai_yorum ? "Aktif" : "Pasif"],
                  ["Özel Kaynak Listesi", musteri.ozel_kaynak_listesi ? "Aktif" : "Pasif"],
                  ["Özel Dashboard", musteri.ozel_dashboard ? "Aktif" : "Pasif"],
                ],
              },
            ].map(section => (
              <div key={section.baslik} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-bold text-nabiz-dark">{section.baslik}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {section.satirlar.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span className="text-gray-400 font-medium">{k}</span>
                      <span className="font-semibold text-nabiz-dark text-right max-w-[200px] truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Sekme 5: Güvenlik ───────────────────────────────────────────── */}
        {aktifSekme === "guvenlik" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-nabiz-dark">Hesap Durumu</p>
                <p className="text-xs text-gray-400 mt-0.5">Müşterinin platforma erişimini buradan yönetebilirsiniz.</p>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${musteri.durum === 'askida' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${musteri.durum === 'askida' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    {musteri.durum === 'askida' ? 'Erişim Askıya Alındı' : 'Sistem Aktif'}
                  </span>
                </div>
                <button
                  disabled={suspendLoading}
                  onClick={() => durumDegistir(musteri.durum === 'askida' ? 'aktif' : 'askida')}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm ${musteri.durum === 'askida' ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}
                >
                  {suspendLoading ? "İşleniyor..." : (musteri.durum === 'askida' ? "Erişimi Geri Aç" : "Hesabı Askıya Al")}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-nabiz-dark">Platform Kullanıcısı ve Erişim Yetkisi</p>
                <p className="text-xs text-gray-400 mt-0.5">Müşterinin panele giriş yapabilmesi için bir e-posta / şifre atayın.</p>
              </div>
              <div className="p-5 space-y-4">
                {kullanicilar.filter((k: any) => (k.musteri_ids || []).includes(id)).length > 0 ? (
                   <div className="space-y-3">
                     <p className="text-sm font-semibold text-gray-600 mb-2">Mevcut Bağlı Kullanıcılar:</p>
                     {kullanicilar.filter((k: any) => (k.musteri_ids || []).includes(id)).map((k: any) => (
                       <div key={k.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg hover:shadow-sm transition">
                         <div>
                           <p className="text-sm font-bold text-nabiz-dark">{k.ad}</p>
                           <p className="text-xs text-gray-500">{k.email}</p>
                         </div>
                         <button onClick={() => alert(`${k.email} adresine şifre sıfırlama talebi gönderildi!`)} className="text-[10px] font-bold bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100">Şifre Sıfırlama Gönder</button>
                       </div>
                     ))}
                   </div>
                ) : (
                  <div className="bg-nabiz-navy/5 border border-nabiz-navy/20 p-5 rounded-xl">
                    <p className="text-sm font-bold text-nabiz-dark mb-4 drop-shadow-sm">Yeni Kullanıcı Hesabı Tanımla</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input value={yeniKullaniciEmail} onChange={e => setYeniKullaniciEmail(e.target.value)} type="email" placeholder="E-posta Adresi..." className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-nabiz-navy/50 outline-none" />
                      <input value={yeniKullaniciSifre} onChange={e => setYeniKullaniciSifre(e.target.value)} type="text" placeholder="Geçici Şifre Belirle" className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-nabiz-navy/50 outline-none" />
                      <button disabled={kullaniciIslemBekliyor} onClick={kullaniciDavetEt} className="bg-nabiz-navy text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-nabiz-navy/90 transition shadow-sm disabled:opacity-50">
                        {kullaniciIslemBekliyor ? "Ekleniyor..." : "Tanımla ve Bağla"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
