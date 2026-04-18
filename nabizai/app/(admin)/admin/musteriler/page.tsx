"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  sosyal_medya?: { platform: string; aktif: boolean }[];
  telegram_aktif?: boolean;
  whatsapp_aktif?: boolean;
  duygu_analizi?: boolean;
  kriz_erken_uyari?: boolean;
}

const PAKET_LABEL: Record<string, { label: string; cls: string }> = {
  izleme:      { label: "İzleme",     cls: "bg-nabiz-navy/10 text-nabiz-navy" },
  radar_pro:   { label: "Radar Pro",  cls: "bg-nabiz-orange/10 text-nabiz-orange" },
  istihbarat:  { label: "İstihbarat", cls: "bg-purple-100 text-purple-700" },
};

const AVATAR_COLORS = [
  "bg-nabiz-navy", "bg-nabiz-orange", "bg-teal-600",
  "bg-purple-600", "bg-rose-500", "bg-emerald-600",
];
function avatarRenk(ad: string): string {
  const i = ad.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function formatTarih(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export default function MusterilerPage() {
  const [musteriler, setMusteriler] = useState<MusteriPanel[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [silmeHata, setSilmeHata] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paketFilter, setPaketFilter] = useState("tumu");
  const [selected, setSelected] = useState<string | null>(null);
  const [silmeOnay, setSilmeOnay] = useState<string | null>(null);
  const [siliyor, setSiliyor] = useState(false);

  useEffect(() => {
    async function veriCek() {
      setYukleniyor(true);
      try {
        const res = await fetch("/api/musteri-paneli");
        const data = await res.json();
        setMusteriler(Array.isArray(data) ? data : []);
      } catch {
        setMusteriler([]);
      } finally {
        setYukleniyor(false);
      }
    }
    veriCek();
  }, []);

  async function musteriSil(id: string) {
    setSiliyor(true);
    setSilmeHata(null);
    try {
      const res = await fetch(`/api/musteri-paneli?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme işlemi sunucuda başarısız oldu.");
      setMusteriler(prev => prev.filter(m => m.id !== id));
      if (selected === id) setSelected(null);
    } catch (e) {
      setSilmeHata(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setSiliyor(false);
      setSilmeOnay(null);
    }
  }

  const filtered = musteriler.filter(m => {
    if (search && !m.musteriAd.toLowerCase().includes(search.toLowerCase()) &&
        !(m.yetkili || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (paketFilter !== "tumu" && m.paket !== paketFilter) return false;
    return true;
  });

  const selectedM = musteriler.find(m => m.id === selected);

  const paketSayilari = {
    izleme:     musteriler.filter(m => m.paket === "izleme").length,
    radar_pro:  musteriler.filter(m => m.paket === "radar_pro").length,
    istihbarat: musteriler.filter(m => m.paket === "istihbarat").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Silme onay dialog */}
      {silmeOnay && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-extrabold text-nabiz-dark text-lg mb-2">Müşteri Silinsin mi?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{musteriler.find(m => m.id === silmeOnay)?.musteriAd}</strong> müşterisi ve tüm konfigürasyonu kalıcı olarak silinecek.
            </p>
            {silmeHata && (
              <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{silmeHata}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSilmeOnay(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                İptal
              </button>
              <button
                onClick={() => musteriSil(silmeOnay)}
                disabled={siliyor}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-60"
              >
                {siliyor ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">Müşteri Yönetimi</h1>
            <p className="text-xs text-gray-400">{musteriler.length} müşteri kayıtlı</p>
          </div>
          <Link
            href="/admin/panel-olustur"
            className="flex items-center gap-2 px-4 py-2 bg-nabiz-orange text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-nabiz-orange/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Yeni Müşteri
          </Link>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Paket stat kartları */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "izleme",     label: "İzleme Paketi",    count: paketSayilari.izleme,    cls: "bg-blue-50 border-blue-100 text-nabiz-navy" },
            { key: "radar_pro",  label: "Radar Pro",        count: paketSayilari.radar_pro,  cls: "bg-orange-50 border-orange-100 text-nabiz-orange" },
            { key: "istihbarat", label: "İstihbarat",       count: paketSayilari.istihbarat, cls: "bg-purple-50 border-purple-100 text-purple-600" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setPaketFilter(paketFilter === s.key ? "tumu" : s.key)}
              className={`${s.cls} border rounded-2xl p-5 text-left transition-all hover:scale-[1.02] ${paketFilter === s.key ? "ring-2 ring-current ring-offset-1" : ""}`}
            >
              <p className="text-3xl font-extrabold">{s.count}</p>
              <p className="text-sm font-semibold mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Arama */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Müşteri veya yetkili ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
          />
        </div>

        {/* Liste + Detay */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Liste */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-50 text-sm font-semibold text-gray-400">
              {yukleniyor ? "Yükleniyor..." : `${filtered.length} müşteri`}
            </div>

            {yukleniyor ? (
              <div className="flex items-center justify-center py-16 text-gray-300 text-sm">
                <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Yükleniyor...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300 text-sm gap-3">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
                </svg>
                {musteriler.length === 0 ? "Henüz müşteri eklenmemiş" : "Eşleşen müşteri bulunamadı"}
                {musteriler.length === 0 && (
                  <Link href="/admin/panel-olustur" className="text-nabiz-orange font-semibold hover:underline">
                    İlk müşteriyi oluştur
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const pk = PAKET_LABEL[m.paket] || { label: m.paket, cls: "bg-gray-100 text-gray-500" };
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelected(selected === m.id ? null : m.id)}
                      className={`w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${selected === m.id ? "bg-orange-50/40" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${avatarRenk(m.musteriAd)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {m.musteriAd[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-nabiz-dark">{m.musteriAd}</p>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${pk.cls}`}>{pk.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.yetkili || "—"} · {m.il || "—"} · {formatTarih(m.olusturulma)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detay paneli */}
          <div className="lg:col-span-2">
            {selectedM ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-24">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${avatarRenk(selectedM.musteriAd)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {selectedM.musteriAd[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-nabiz-dark truncate">{selectedM.musteriAd}</h3>
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${(PAKET_LABEL[selectedM.paket] || { cls: "bg-gray-100 text-gray-500" }).cls}`}>
                      {(PAKET_LABEL[selectedM.paket] || { label: selectedM.paket }).label}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {[
                    ["Yetkili",    selectedM.yetkili || "—"],
                    ["E-posta",    selectedM.email || "—"],
                    ["İl",         selectedM.il || "—"],
                    ["Oluşturulma",formatTarih(selectedM.olusturulma)],
                    ["Güncelleme", formatTarih(selectedM.guncelleme)],
                    ["Kategoriler",(selectedM.kategoriler || []).join(", ") || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">{k}</span>
                      <span className="font-semibold text-nabiz-dark text-right max-w-[180px] truncate">{v}</span>
                    </div>
                  ))}

                  {/* Özellik ikonları */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedM.duygu_analizi && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg">Duygu Analizi</span>
                    )}
                    {selectedM.kriz_erken_uyari && (
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg">Kriz Erken Uyarı</span>
                    )}
                    {selectedM.telegram_aktif && (
                      <span className="px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-lg">Telegram</span>
                    )}
                    {selectedM.whatsapp_aktif && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg">WhatsApp</span>
                    )}
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <Link
                      href={`/admin/musteri/${selectedM.id}`}
                      className="w-full px-4 py-2.5 bg-nabiz-navy text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity text-center"
                    >
                      Paneli Görüntüle
                    </Link>
                    <Link
                      href={`/admin/panel-olustur?id=${selectedM.id}`}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors text-center"
                    >
                      Ayarları Düzenle
                    </Link>
                    <button
                      onClick={() => setSilmeOnay(selectedM.id)}
                      className="w-full px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"
                    >
                      Müşteriyi Sil
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 h-48 flex items-center justify-center text-gray-300 text-sm">
                Bir müşteri seçin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
