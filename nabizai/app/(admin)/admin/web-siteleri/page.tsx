"use client";

import { useState, useEffect, useRef } from "react";

interface WebSitesi {
  id: string;
  ad: string;
  url: string;
  feed_url: string;
  yayin_merkezi: string;
  il: string;
  ilce: string;
  tur: string;
  aktif: boolean;
}

const TUR_ETIKET: Record<string, { ad: string; renk: string }> = {
  yerel_haber:     { ad: "Yerel Haber",     renk: "bg-blue-100 text-blue-700" },
  bolgesel_haber:  { ad: "Bölgesel Haber",  renk: "bg-teal-100 text-teal-700" },
  bolgesel_tv:     { ad: "Bölgesel TV",     renk: "bg-purple-100 text-purple-700" },
  gazete:          { ad: "Gazete",           renk: "bg-amber-100 text-amber-700" },
  portal:          { ad: "Portal",           renk: "bg-gray-100 text-gray-600" },
};

export default function WebSiteleriPage() {
  const [siteler, setSiteler] = useState<WebSitesi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [importSonuc, setImportSonuc] = useState<string>("");
  const [importYukleniyor, setImportYukleniyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState("");
  const [yeniSiteAcik, setYeniSiteAcik] = useState(false);
  const [yeniSite, setYeniSite] = useState({ ad: "", url: "", feed_url: "", yayin_merkezi: "", il: "Muğla", ilce: "", tur: "yerel_haber" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { yukle(); }, []);

  async function yukle() {
    setYukleniyor(true);
    try {
      const res = await fetch("/api/web-siteleri");
      if (res.ok) setSiteler(await res.json());
    } finally {
      setYukleniyor(false);
    }
  }

  async function excelImport(file: File) {
    setImportYukleniyor(true);
    setImportSonuc("");
    try {
      // Excel (.xlsx) veya CSV dosyasını text olarak oku
      let csvText = "";

      if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        csvText = await file.text();
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Excel için: basit tab/virgül formatına çevir
        // Gerçek xlsx parse için server-side işlem
        setImportSonuc("⚠️ Excel dosyası için lütfen önce CSV olarak kaydedin (Excel → Dosya → Farklı Kaydet → CSV)");
        setImportYukleniyor(false);
        return;
      } else {
        setImportSonuc("❌ Desteklenen formatlar: .csv, .txt");
        setImportYukleniyor(false);
        return;
      }

      const res = await fetch("/api/web-siteleri", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      });

      const data = await res.json();
      if (data.ok) {
        setImportSonuc(`✅ ${data.eklenen} site eklendi, ${data.atlanan} atlandı. Toplam: ${data.toplam}`);
        yukle();
      } else {
        setImportSonuc(`❌ ${data.error}`);
      }
    } catch (err) {
      setImportSonuc(`❌ Hata: ${err}`);
    } finally {
      setImportYukleniyor(false);
    }
  }

  async function siteEkle() {
    if (!yeniSite.ad || !yeniSite.url) return;
    const res = await fetch("/api/web-siteleri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(yeniSite),
    });
    if (res.ok) {
      setYeniSite({ ad: "", url: "", feed_url: "", yayin_merkezi: "", il: "Muğla", ilce: "", tur: "yerel_haber" });
      setYeniSiteAcik(false);
      yukle();
    }
  }

  async function siteSil(id: string) {
    if (!confirm("Bu siteyi silmek istediğinize emin misiniz?")) return;
    await fetch("/api/web-siteleri", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    yukle();
  }

  async function siteToggle(id: string, aktif: boolean) {
    await fetch("/api/web-siteleri", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, aktif: !aktif }),
    });
    yukle();
  }

  const filtrelenmis = siteler.filter(s =>
    s.ad.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    s.yayin_merkezi.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    s.ilce.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  const rssOlan = siteler.filter(s => s.feed_url).length;
  const aktifSayisi = siteler.filter(s => s.aktif).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">Web Siteleri</h1>
            <p className="text-xs text-gray-400">Muğla bölgesi medya kaynakları yönetimi</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 bg-nabiz-navy/5 text-nabiz-navy font-semibold rounded-full">
              {aktifSayisi} aktif
            </span>
            <span className="text-xs px-3 py-1 bg-nabiz-green/10 text-nabiz-green font-semibold rounded-full">
              {rssOlan} RSS'li
            </span>
            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-500 font-semibold rounded-full">
              {siteler.length} toplam
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">

        {/* İşlem kartları */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Excel import */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-nabiz-orange/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-nabiz-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-nabiz-dark text-sm">Excel / CSV ile Toplu Yükleme</h3>
                <p className="text-xs text-gray-400">Sütunlar: ad, url, feed_url, yayin_merkezi, il, ilce, tur</p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) excelImport(file);
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importYukleniyor}
                className="flex-1 py-2.5 bg-nabiz-orange/10 text-nabiz-orange font-semibold text-sm rounded-xl hover:bg-nabiz-orange/20 transition-colors disabled:opacity-50"
              >
                {importYukleniyor ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Yükleniyor...
                  </span>
                ) : "CSV Dosyası Seç"}
              </button>

              <button
                onClick={() => {
                  const csv = "ad,url,feed_url,yayin_merkezi,il,ilce,tur\nÖrnek Haber,https://orneksite.com,https://orneksite.com/feed/,Bodrum Muğla,Muğla,Bodrum,yerel_haber";
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "web_siteleri_sablon.csv";
                  a.click();
                }}
                className="px-4 py-2.5 bg-gray-50 text-gray-500 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors"
              >
                📋 Şablon İndir
              </button>
            </div>

            {importSonuc && (
              <p className="mt-3 text-xs font-semibold px-3 py-2 bg-gray-50 rounded-lg">{importSonuc}</p>
            )}
          </div>

          {/* Tekil ekleme */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-nabiz-navy/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-nabiz-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-nabiz-dark text-sm">Tek Site Ekle</h3>
                <p className="text-xs text-gray-400">Manuel olarak yeni web sitesi ekleyin</p>
              </div>
            </div>

            {yeniSiteAcik ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input value={yeniSite.ad} onChange={e => setYeniSite(p => ({ ...p, ad: e.target.value }))}
                    placeholder="Site Adı *" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                  <input value={yeniSite.url} onChange={e => setYeniSite(p => ({ ...p, url: e.target.value }))}
                    placeholder="URL *" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={yeniSite.feed_url} onChange={e => setYeniSite(p => ({ ...p, feed_url: e.target.value }))}
                    placeholder="RSS/Feed URL" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                  <input value={yeniSite.yayin_merkezi} onChange={e => setYeniSite(p => ({ ...p, yayin_merkezi: e.target.value }))}
                    placeholder="Yayın Merkezi *" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={yeniSite.il} onChange={e => setYeniSite(p => ({ ...p, il: e.target.value }))}
                    placeholder="İl" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                  <input value={yeniSite.ilce} onChange={e => setYeniSite(p => ({ ...p, ilce: e.target.value }))}
                    placeholder="İlçe" className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
                  <select value={yeniSite.tur} onChange={e => setYeniSite(p => ({ ...p, tur: e.target.value }))}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20">
                    <option value="yerel_haber">Yerel Haber</option>
                    <option value="bolgesel_haber">Bölgesel Haber</option>
                    <option value="bolgesel_tv">Bölgesel TV</option>
                    <option value="gazete">Gazete</option>
                    <option value="portal">Portal</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={siteEkle} className="flex-1 py-2 bg-nabiz-navy text-white font-semibold text-sm rounded-xl hover:opacity-90">Ekle</button>
                  <button onClick={() => setYeniSiteAcik(false)} className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-xl hover:bg-gray-200">İptal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setYeniSiteAcik(true)}
                className="w-full py-2.5 bg-nabiz-navy/10 text-nabiz-navy font-semibold text-sm rounded-xl hover:bg-nabiz-navy/20 transition-colors">
                + Yeni Site Ekle
              </button>
            )}
          </div>
        </div>

        {/* Arama */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
            placeholder="Site adı, yayın merkezi veya ilçe ara..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
          />
        </div>

        {/* Site listesi */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-bold text-nabiz-dark">
              Kayıtlı Web Siteleri ({filtrelenmis.length})
            </p>
          </div>

          {yukleniyor ? (
            <div className="flex items-center justify-center py-12 text-gray-300 text-sm gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Yükleniyor...
            </div>
          ) : filtrelenmis.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {aramaMetni ? "Aramayla eşleşen site bulunamadı" : "Henüz web sitesi eklenmemiş"}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtrelenmis.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  {/* Aktif/Pasif toggle */}
                  <button
                    onClick={() => siteToggle(s.id, s.aktif)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${s.aktif ? "bg-nabiz-green" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${s.aktif ? "left-5" : "left-0.5"}`} />
                  </button>

                  {/* Site bilgisi */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-nabiz-dark text-sm">{s.ad}</p>
                      {s.feed_url && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-nabiz-green/10 text-nabiz-green rounded">RSS</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline truncate max-w-[200px]">{s.url}</a>
                    </div>
                  </div>

                  {/* Yayın merkezi */}
                  <div className="hidden md:block text-right min-w-[140px]">
                    <p className="text-xs font-semibold text-nabiz-dark">{s.yayin_merkezi || "—"}</p>
                    <p className="text-[10px] text-gray-400">{[s.il, s.ilce].filter(Boolean).join(", ")}</p>
                  </div>

                  {/* Tür badge */}
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex-shrink-0 ${TUR_ETIKET[s.tur]?.renk || "bg-gray-100 text-gray-500"}`}>
                    {TUR_ETIKET[s.tur]?.ad || s.tur}
                  </span>

                  {/* Sil butonu */}
                  <button onClick={() => siteSil(s.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
