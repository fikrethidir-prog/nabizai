"use client";

import { useState, useEffect } from "react";

interface DemoTalep {
  id: string;
  ad: string;
  kurum: string;
  email: string;
  telefon?: string;
  sektor: string;
  mesaj?: string;
  tarih: string;
  durum: "yeni" | "iletisime_gecildi" | "demo_yapildi" | "musteri_oldu";
}

const DURUM_LABEL: Record<string, { label: string; cls: string }> = {
  yeni:              { label: "Yeni",              cls: "bg-blue-100 text-blue-700" },
  iletisime_gecildi: { label: "İletişime Geçildi", cls: "bg-amber-100 text-amber-700" },
  demo_yapildi:      { label: "Demo Yapıldı",      cls: "bg-green-100 text-green-700" },
  musteri_oldu:      { label: "Müşteri Oldu",      cls: "bg-nabiz-navy/10 text-nabiz-navy" },
};

const DURUM_SIRALAMA = ["yeni", "iletisime_gecildi", "demo_yapildi", "musteri_oldu"];

export default function DemoTalepleriPage() {
  const [talepler, setTalepler]     = useState<DemoTalep[]>([]);
  const [loading, setLoading]       = useState(true);
  const [secili, setSecili]         = useState<DemoTalep | null>(null);
  const [kullaniciBilgi, setKullaniciBilgi] = useState<{ sifre: string; olusturuldu: boolean } | null>(null);
  const [kullaniciOlusturuluyor, setKullaniciOlusturuluyor] = useState(false);
  const [durumDegistiriliyor, setDurumDegistiriliyor] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/demo")
      .then(r => r.json())
      .then(d => { setTalepler(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function durumDegistir(id: string, durum: string) {
    setDurumDegistiriliyor(id);
    try {
      const res = await fetch("/api/demo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, durum }),
      });
      if (res.ok) {
        setTalepler(prev => prev.map(t => t.id === id ? { ...t, durum: durum as DemoTalep["durum"] } : t));
        if (secili?.id === id) setSecili(prev => prev ? { ...prev, durum: durum as DemoTalep["durum"] } : null);
      }
    } finally {
      setDurumDegistiriliyor(null);
    }
  }

  async function kullaniciOlustur(talep: DemoTalep) {
    setKullaniciOlusturuluyor(true);
    // Rastgele güvenli şifre oluştur
    const sifre = Math.random().toString(36).slice(2, 8).toUpperCase() +
                  Math.random().toString(36).slice(2, 5) + "!";
    try {
      const res = await fetch("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad: talep.ad,
          email: talep.email,
          sifre,
          rol: "musteri",
          musteri_ids: [],
        }),
      });
      if (res.ok) {
        setKullaniciBilgi({ sifre, olusturuldu: true });
        // Durumu musteri_oldu yap
        await durumDegistir(talep.id, "musteri_oldu");
      } else {
        const d = await res.json();
        alert(d.error || "Kullanıcı oluşturulamadı");
      }
    } finally {
      setKullaniciOlusturuluyor(false);
    }
  }

  const yeniSayisi = talepler.filter(t => t.durum === "yeni").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Detay Modal */}
      {secili && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => { setSecili(null); setKullaniciBilgi(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="font-extrabold text-nabiz-dark text-lg">{secili.ad}</h2>
                <p className="text-sm text-gray-400">{secili.kurum}</p>
              </div>
              <button onClick={() => { setSecili(null); setKullaniciBilgi(null); }} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* İletişim bilgileri */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">E-posta</p>
                  <p className="text-sm text-nabiz-dark">{secili.email}</p>
                </div>
                {secili.telefon && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">Telefon</p>
                    <p className="text-sm text-nabiz-dark">{secili.telefon}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">Sektör</p>
                  <p className="text-sm text-nabiz-dark">{secili.sektor}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">Tarih</p>
                  <p className="text-sm text-nabiz-dark">{new Date(secili.tarih).toLocaleString("tr-TR")}</p>
                </div>
              </div>

              {secili.mesaj && (
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-1">Mesaj</p>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{secili.mesaj}</p>
                </div>
              )}

              {/* Durum değiştirme */}
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">Durum</p>
                <div className="flex flex-wrap gap-2">
                  {DURUM_SIRALAMA.map(d => (
                    <button
                      key={d}
                      onClick={() => durumDegistir(secili.id, d)}
                      disabled={durumDegistiriliyor === secili.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        secili.durum === d
                          ? DURUM_LABEL[d].cls + " ring-2 ring-offset-1 ring-current"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {DURUM_LABEL[d].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kullanıcı oluşturma */}
              {kullaniciBilgi ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-green-700 mb-2">✓ Kullanıcı oluşturuldu!</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">E-posta:</span> <strong>{secili.email}</strong></p>
                    <p><span className="text-gray-500">Şifre:</span> <strong className="font-mono bg-white px-2 py-0.5 rounded border">{kullaniciBilgi.sifre}</strong></p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Bu bilgileri müşteriye iletin. Şifreyi kaydettikten sonra kapatın.</p>
                </div>
              ) : (
                <button
                  onClick={() => kullaniciOlustur(secili)}
                  disabled={kullaniciOlusturuluyor}
                  className="w-full py-2.5 bg-nabiz-orange text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {kullaniciOlusturuluyor ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                      </svg>
                      Demo Kullanıcısı Oluştur
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">Demo Talepleri</h1>
            <p className="text-xs text-gray-400">Web sitesinden gelen demo istekleri — tıklayarak detay görün</p>
          </div>
          {yeniSayisi > 0 && (
            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl">
              {yeniSayisi} yeni talep
            </span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Yükleniyor...
          </div>
        ) : talepler.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <p className="text-lg font-semibold mb-1">Henüz demo talebi yok</p>
            <p className="text-sm">Web sitesinden gelen talepler burada görünecek.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Ad / Kurum</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">İletişim</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Sektör</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Tarih</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {talepler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).map(t => {
                    const durum = DURUM_LABEL[t.durum] || DURUM_LABEL.yeni;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => { setSecili(t); setKullaniciBilgi(null); }}
                        className="hover:bg-nabiz-orange/5 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-nabiz-dark">{t.ad}</p>
                          <p className="text-xs text-gray-400">{t.kurum}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-nabiz-dark">{t.email}</p>
                          {t.telefon && <p className="text-xs text-gray-400">{t.telefon}</p>}
                        </td>
                        <td className="px-5 py-4 text-gray-500">{t.sektor}</td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {new Date(t.tarih).toLocaleString("tr-TR")}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${durum.cls}`}>
                            {durum.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
