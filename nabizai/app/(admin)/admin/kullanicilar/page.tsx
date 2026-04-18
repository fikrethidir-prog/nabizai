"use client";

import { useState, useEffect } from "react";

interface Musteri { id: string; musteriAd: string; paket: string; }
interface Kullanici {
  id: string; ad: string; email: string;
  rol: "admin" | "musteri"; musteri_ids: string[]; olusturulma: string;
}

export default function KullanicilarPage() {
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [musteriler, setMusteriler]     = useState<Musteri[]>([]);
  const [form, setForm]                 = useState({ ad: "", email: "", sifre: "", musteri_ids: [] as string[] });
  const [yukleniyor, setYukleniyor]     = useState(true);
  const [kaydediyor, setKaydediyor]     = useState(false);
  const [hata, setHata]                 = useState("");
  const [basari, setBasari]             = useState("");
  const [silmeOnay, setSilmeOnay]       = useState<string | null>(null);
  const [kopyalanan, setKopyalanan]     = useState<string | null>(null);

  // Düzenleme modal state
  const [duzenle, setDuzenle]           = useState<Kullanici | null>(null);
  const [duzenleForm, setDuzenleForm]   = useState({ ad: "", email: "", yeni_sifre: "", musteri_ids: [] as string[] });
  const [duzenleHata, setDuzenleHata]   = useState("");
  const [duzenleKaydediyor, setDuzenleKaydediyor] = useState(false);

  async function veriCek() {
    setYukleniyor(true);
    try {
      const [kr, mr] = await Promise.all([fetch("/api/kullanicilar"), fetch("/api/musteri-paneli")]);
      setKullanicilar(await kr.json());
      setMusteriler(await mr.json());
    } finally { setYukleniyor(false); }
  }

  useEffect(() => { veriCek(); }, []);

  async function kullaniciOlustur(e: React.FormEvent) {
    e.preventDefault();
    setKaydediyor(true); setHata(""); setBasari("");
    try {
      const res = await fetch("/api/kullanicilar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rol: "musteri" }),
      });
      const data = await res.json();
      if (!res.ok) { setHata(data.error); return; }
      setBasari("Kullanıcı oluşturuldu");
      setForm({ ad: "", email: "", sifre: "", musteri_ids: [] });
      veriCek();
    } finally { setKaydediyor(false); }
  }

  async function kullaniciSil(id: string) {
    const res = await fetch(`/api/kullanicilar?id=${id}`, { method: "DELETE" });
    if (res.ok) { setKullanicilar(prev => prev.filter(k => k.id !== id)); setSilmeOnay(null); }
  }

  function duzenleAc(k: Kullanici) {
    setDuzenle(k);
    setDuzenleForm({ ad: k.ad, email: k.email, yeni_sifre: "", musteri_ids: k.musteri_ids || [] });
    setDuzenleHata("");
  }

  async function kullaniciGuncelle(e: React.FormEvent) {
    e.preventDefault();
    if (!duzenle) return;
    setDuzenleKaydediyor(true); setDuzenleHata("");
    try {
      const body: Record<string, unknown> = {
        id: duzenle.id,
        ad: duzenleForm.ad,
        email: duzenleForm.email,
        musteri_ids: duzenleForm.musteri_ids,
      };
      if (duzenleForm.yeni_sifre) body.yeni_sifre = duzenleForm.yeni_sifre;

      const res = await fetch("/api/kullanicilar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setDuzenleHata(d.error); return; }
      setDuzenle(null);
      veriCek();
    } finally { setDuzenleKaydediyor(false); }
  }

  function linkKopyala(musteriId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/musteri/${musteriId}`);
    setKopyalanan(musteriId);
    setTimeout(() => setKopyalanan(null), 2000);
  }

  function musteriToggle(musteriId: string, ids: string[], setIds: (ids: string[]) => void) {
    setIds(ids.includes(musteriId) ? ids.filter(id => id !== musteriId) : [...ids, musteriId]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Silme onayı */}
      {silmeOnay && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-extrabold text-nabiz-dark text-lg mb-2">Kullanıcı Silinsin mi?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{kullanicilar.find(k => k.id === silmeOnay)?.email}</strong> kalıcı olarak silinecek.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSilmeOnay(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">İptal</button>
              <button onClick={() => kullaniciSil(silmeOnay)} className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-xl text-sm">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme modal */}
      {duzenle && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDuzenle(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-extrabold text-nabiz-dark">Kullanıcıyı Düzenle</h2>
              <button onClick={() => setDuzenle(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={kullaniciGuncelle} className="p-6 space-y-4">
              {duzenleHata && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{duzenleHata}</p>}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label>
                <input type="text" required value={duzenleForm.ad}
                  onChange={e => setDuzenleForm(p => ({ ...p, ad: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">E-posta</label>
                <input type="email" required value={duzenleForm.email}
                  onChange={e => setDuzenleForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Yeni Şifre <span className="text-gray-300 font-normal">(boş bırakılırsa değişmez)</span>
                </label>
                <input type="password" placeholder="••••••••" value={duzenleForm.yeni_sifre}
                  onChange={e => setDuzenleForm(p => ({ ...p, yeni_sifre: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Müşteri Erişimleri</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-2">
                  {musteriler.length === 0 ? (
                    <p className="text-xs text-gray-400 px-2">Henüz müşteri yok</p>
                  ) : musteriler.map(m => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                      <input type="checkbox"
                        checked={duzenleForm.musteri_ids.includes(m.id)}
                        onChange={() => musteriToggle(m.id, duzenleForm.musteri_ids, ids => setDuzenleForm(p => ({ ...p, musteri_ids: ids })))}
                        className="w-4 h-4 accent-nabiz-orange" />
                      <span className="text-sm font-medium text-nabiz-dark">{m.musteriAd}</span>
                      <span className="text-xs text-gray-400">{m.paket}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDuzenle(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-sm">İptal</button>
                <button type="submit" disabled={duzenleKaydediyor} className="flex-1 py-2.5 bg-nabiz-navy text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
                  {duzenleKaydediyor ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4">
          <h1 className="text-lg font-extrabold text-nabiz-dark">Kullanıcı Yönetimi</h1>
          <p className="text-xs text-gray-400">Müşteri kullanıcılarını oluşturun, düzenleyin ve panel erişim linklerini paylaşın</p>
        </div>
      </header>

      <div className="p-8 grid lg:grid-cols-5 gap-8">
        {/* Yeni kullanıcı formu */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <p className="font-bold text-nabiz-dark text-sm">Yeni Müşteri Kullanıcısı Oluştur</p>
            </div>
            <form onSubmit={kullaniciOlustur} className="p-6 space-y-4">
              {hata && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{hata}</p>}
              {basari && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{basari}</p>}

              {[
                { key: "ad",    label: "Ad Soyad", type: "text",     placeholder: "Müşteri Yöneticisi" },
                { key: "email", label: "E-posta",  type: "email",    placeholder: "kullanici@musteri.com" },
                { key: "sifre", label: "Şifre",    type: "password", placeholder: "••••••••" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">Müşteri Erişimleri</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {musteriler.length === 0 ? (
                    <p className="text-xs text-gray-400">Henüz müşteri yok</p>
                  ) : musteriler.map(m => (
                    <label key={m.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                      <input type="checkbox"
                        checked={form.musteri_ids.includes(m.id)}
                        onChange={() => musteriToggle(m.id, form.musteri_ids, ids => setForm(p => ({ ...p, musteri_ids: ids })))}
                        className="w-4 h-4 accent-nabiz-orange" />
                      <span className="text-sm font-medium text-nabiz-dark">{m.musteriAd}</span>
                      <span className="text-xs text-gray-400">{m.paket}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={kaydediyor || form.musteri_ids.length === 0}
                className="w-full py-2.5 bg-nabiz-navy text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
                {kaydediyor ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
              </button>
              {form.musteri_ids.length === 0 && (
                <p className="text-xs text-gray-400 text-center">En az bir müşteri seçin</p>
              )}
            </form>
          </div>
        </div>

        {/* Kullanıcı listesi */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-50 text-sm font-semibold text-gray-400">
              {yukleniyor ? "Yükleniyor..." : `${kullanicilar.length} kullanıcı`}
            </div>
            <div className="divide-y divide-gray-50">
              {kullanicilar.map(k => {
                const musteriAdlari = (k.musteri_ids || [])
                  .map(mid => musteriler.find(m => m.id === mid)?.musteriAd || mid).join(", ");
                return (
                  <div key={k.id} className="px-6 py-4 flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${k.rol === "admin" ? "bg-nabiz-orange" : "bg-nabiz-navy"}`}>
                      {k.ad[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-nabiz-dark text-sm">{k.ad}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${k.rol === "admin" ? "bg-nabiz-orange/10 text-nabiz-orange" : "bg-blue-50 text-blue-600"}`}>
                          {k.rol === "admin" ? "Yönetici" : "Müşteri"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{k.email}</p>
                      {musteriAdlari && <p className="text-xs text-gray-500 mt-1">Erişim: {musteriAdlari}</p>}

                      {k.rol === "musteri" && k.musteri_ids?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {k.musteri_ids.map(mid => {
                            const m = musteriler.find(x => x.id === mid);
                            return (
                              <button key={mid} onClick={() => linkKopyala(mid)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${kopyalanan === mid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-nabiz-orange/10 hover:text-nabiz-orange"}`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"/>
                                </svg>
                                {kopyalanan === mid ? "Kopyalandı!" : (m?.musteriAd || mid.slice(0, 8))}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {k.id !== "admin-001" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => duzenleAc(k)}
                          className="p-2 text-gray-300 hover:text-nabiz-navy transition-colors" title="Düzenle">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"/>
                          </svg>
                        </button>
                        <button onClick={() => setSilmeOnay(k.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Sil">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {!yukleniyor && kullanicilar.length === 0 && (
                <p className="text-center text-gray-300 text-sm py-12">Henüz kullanıcı yok</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
