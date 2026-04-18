"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ilce {
  id: string;
  ad: string;
  nufus_yogunlugu: string;
  belediye_baskani: string;
  anahtar_kelimeler: string[];
  rss_kaynaklari: string[];
  sosyal_hesaplar: string[];
  google_maps_yerler: string[];
}

export default function IlcelerPage() {
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [seciliIlce, setSeciliIlce] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/ilceler")
      .then((r) => r.json())
      .then((d) => {
        setIlceler(d);
        if (d.length > 0) setSeciliIlce(d[0].id);
        setLoading(false);
      });
  }, []);

  async function handleKaydet() {
    setSaving(true);
    try {
      const res = await fetch("/api/ilceler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ilceler),
      });
      if (res.ok) alert("Bölgesel kaynaklar başarıyla güncellendi.");
    } finally {
      setSaving(false);
    }
  }

  function updateSecili(field: keyof Ilce, val: any) {
    setIlceler((prev) =>
      prev.map((i) => (i.id === seciliIlce ? { ...i, [field]: val } : i))
    );
  }

  function StringListEditor({ label, value, onChange, placeholder }: { label: string, value: string[], onChange: (v: string[]) => void, placeholder: string }) {
    const [txt, setTxt] = useState("");
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className="flex gap-2 mb-2">
          <input
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === "Enter" && txt.trim()) {
                 e.preventDefault();
                 onChange([...value, txt.trim()]);
                 setTxt("");
               }
            }}
            type="text"
            placeholder={placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/40"
          />
          <button 
            onClick={() => { if(txt.trim()) { onChange([...value, txt.trim()]); setTxt(""); } }}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition"
          >
            Ekle
          </button>
        </div>
        <div className="space-y-1.5">
          {value.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm">
              <span className="truncate flex-1" title={item}>{item}</span>
              <button
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 rounded text-xs bg-white border border-red-100 shadow-sm ml-2"
              >
                Sil
              </button>
            </div>
          ))}
          {value.length === 0 && <p className="text-xs text-gray-400 italic">Henüz tanımlı bir kaynak bulunamadı.</p>}
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-gray-500 font-semibold flex justify-center mt-20">Yükleniyor...</div>;

  const ilce = ilceler.find((i) => i.id === seciliIlce);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-nabiz-dark">L1 - Bölgesel Veri Ağı (İlçe Yönetimi)</h1>
          <p className="text-sm text-gray-500 mt-1">Haber tarayıcısı ajanların hangi ilçede nereye bakacağını buradan yönetin.</p>
        </div>
        <button
          onClick={handleKaydet}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-nabiz-navy text-white text-sm font-bold rounded-xl hover:bg-nabiz-navy/90 shadow-md transition disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Sisteme Aktar (Konfigürasyonu Kaydet)"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sol Panel: İlçe Seçimi */}
        <div className="w-full md:w-64 bg-white border border-gray-200 rounded-2xl overflow-hidden self-start flex-shrink-0 shadow-sm">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-600">İlçeler ({ilceler.length})</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {ilceler.map((i) => (
              <button
                key={i.id}
                onClick={() => setSeciliIlce(i.id)}
                className={`w-full text-left px-5 py-3 text-sm font-bold transition-all ${
                  seciliIlce === i.id ? "bg-nabiz-orange/10 text-nabiz-orange border-l-4 border-l-nabiz-orange" : "text-gray-600 hover:bg-gray-50 border-l-4 border-l-transparent"
                }`}
              >
                {i.ad}
                <div className="text-[10px] text-gray-400 font-medium font-mono mt-0.5 tracking-wider">
                  {(i.rss_kaynaklari || []).length + (i.sosyal_hesaplar || []).length + (i.google_maps_yerler || []).length} KAYNAK
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sağ Panel: Form */}
        {ilce && (
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-nabiz-dark mb-1">{ilce.ad} Merkez İstasyonu</h2>
              <p className="text-sm text-gray-500">Muğla İstihbarat Ajanının bu ilçe ile ilgili tarayacağı dijital kanallar.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Belediye Başkanı */}
              <div className="md:col-span-2 bg-gradient-to-r from-nabiz-navy/5 to-transparent p-4 rounded-2xl border border-nabiz-navy/10">
                <label className="block text-sm font-semibold text-nabiz-navy mb-1.5">Mevcut Belediye Başkanı</label>
                <input
                  type="text"
                  value={ilce.belediye_baskani || ""}
                  onChange={(e) => updateSecili("belediye_baskani", e.target.value)}
                  placeholder="Örn: Ahmet Aras (Sistem bu ismin PR reklam eşdeğerini otomatik hesaplar)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-orange/50 bg-white"
                />
              </div>

              {/* Anahtar Kelimeler */}
              <div className="md:col-span-2">
                <StringListEditor 
                  label="🎯 Özel Anahtar Kelimeler (Contextual Filter)" 
                  value={ilce.anahtar_kelimeler || []} 
                  onChange={(v) => updateSecili("anahtar_kelimeler", v)}
                  placeholder="Örn: yangın, antik tiyatro..."
                />
                <p className="text-xs text-gray-400 mt-2 italic">Ajan genel aramalar dışında bu kelimeleri bu ilçede ekstra yoğun tarayacaktır.</p>
              </div>

              {/* RSS ve Web Sitesi */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex justify-center items-center font-bold">1</span>
                  <h3 className="font-bold text-gray-700">Web & RSS Kaynakları</h3>
                </div>
                <StringListEditor 
                  label="RSS Feed Çıktısı (Site Linki)" 
                  value={ilce.rss_kaynaklari || []} 
                  onChange={(v) => updateSecili("rss_kaynaklari", v)}
                  placeholder="https://.../feed"
                />
              </div>

              {/* Sosyal Medya Grubu */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center font-bold">2</span>
                  <h3 className="font-bold text-gray-700">Sosyal Medya Radarı</h3>
                </div>
                <StringListEditor 
                  label="Facebook & X Grup / Hesap URL'si" 
                  value={ilce.sosyal_hesaplar || []} 
                  onChange={(v) => updateSecili("sosyal_hesaplar", v)}
                  placeholder="https://facebook.com/groups/..."
                />
              </div>

              {/* Google Maps / Yorum Alanı */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex justify-center items-center font-bold">3</span>
                  <h3 className="font-bold text-gray-700">Lokasyon Yorumları</h3>
                </div>
                <StringListEditor 
                  label="Google Maps Place URL (Belediye vb.)" 
                  value={ilce.google_maps_yerler || []} 
                  onChange={(v) => updateSecili("google_maps_yerler", v)}
                  placeholder="https://places..."
                />
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
