"use client";

import { useEffect, useState } from "react";

const defaultSettings = {
  badge_text: "Canlı izleme · 26 kaynak + sosyal medya",
  hero_title_1: "Yerel medyanın",
  hero_title_2: "nabzı",
  hero_desc: "Yerel haberler, sosyal medya ve rakip analizi tek ekranda. Kriz öncesi sizi uyarır, fırsatları kaçırmazsınız.",
  stat_1_n: "26+",
  stat_1_l: "yerel kaynak",
  stat_2_n: "4",
  stat_2_l: "sosyal platform",
  stat_3_n: "30dk",
  stat_3_l: "güncelleme sıklığı",
  stat_4_n: "AI",
  stat_4_l: "destekli analiz",
  pkg_1_name: "İzleme",
  pkg_1_price: "15.000 ₺",
  pkg_2_name: "Radar Pro",
  pkg_2_price: "35.000 ₺",
  pkg_3_name: "İstihbarat",
  pkg_3_price: "75.000+ ₺",
};

export default function SiteAyarlariPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Object.keys(data).length > 0) {
          setSettings({ ...defaultSettings, ...data });
        }
      });
  }, []);

  const handleSave = async () => {
    setYukleniyor(true);
    setMesaj("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMesaj("Başarıyla kaydedildi!");
      } else {
        setMesaj("Hata oluştu.");
      }
    } catch {
      setMesaj("Bir hata meydana geldi.");
    } finally {
      setYukleniyor(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-nabiz-navy">Web Ana Sayfa Yönetimi</h1>
      <p className="text-sm text-gray-500 mb-6">Buradan landing page (ana sayfa) üzerindeki metinleri direkt olarak değiştirebilirsiniz. Sadece Master Admin tarafından yönetilebilir.</p>

      {mesaj && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 font-medium rounded-lg">
          {mesaj}
        </div>
      )}

      <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Hero Alanı (Üst Kısım)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge (Üst Etiket)</label>
              <input type="text" value={settings.badge_text} onChange={(e) => handleChange("badge_text", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div className="hidden md:block"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık Bölüm 1 (Siyah)</label>
              <input type="text" value={settings.hero_title_1} onChange={(e) => handleChange("hero_title_1", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık Bölüm 2 (Turuncu)</label>
              <input type="text" value={settings.hero_title_2} onChange={(e) => handleChange("hero_title_2", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Açıklama Metni (Description)</label>
              <textarea value={settings.hero_desc} onChange={(e) => handleChange("hero_desc", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" rows={3}></textarea>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">İstatistik Çubuğu</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kutu 1 Değer / Etiket</label>
              <input type="text" title="Değer (örn: 26+)" value={settings.stat_1_n} onChange={(e) => handleChange("stat_1_n", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-lg font-bold text-center focus:outline-none focus:border-nabiz-navy" />
              <input type="text" title="Etiket (örn: yerel kaynak)" value={settings.stat_1_l} onChange={(e) => handleChange("stat_1_l", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-xs text-center mt-1 focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kutu 2 Değer / Etiket</label>
              <input type="text" value={settings.stat_2_n} onChange={(e) => handleChange("stat_2_n", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-lg font-bold text-center focus:outline-none focus:border-nabiz-navy" />
              <input type="text" value={settings.stat_2_l} onChange={(e) => handleChange("stat_2_l", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-xs text-center mt-1 focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kutu 3 Değer / Etiket</label>
              <input type="text" value={settings.stat_3_n} onChange={(e) => handleChange("stat_3_n", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-lg font-bold text-center focus:outline-none focus:border-nabiz-navy" />
              <input type="text" value={settings.stat_3_l} onChange={(e) => handleChange("stat_3_l", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-xs text-center mt-1 focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kutu 4 Değer / Etiket</label>
              <input type="text" value={settings.stat_4_n} onChange={(e) => handleChange("stat_4_n", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-lg font-bold text-center focus:outline-none focus:border-nabiz-navy" />
              <input type="text" value={settings.stat_4_l} onChange={(e) => handleChange("stat_4_l", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-xs text-center mt-1 focus:outline-none focus:border-nabiz-navy" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Paket İsimlendirmeleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paket 1</label>
              <input type="text" value={settings.pkg_1_name} onChange={(e) => handleChange("pkg_1_name", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paket 2 (Popüler)</label>
              <input type="text" value={settings.pkg_2_name} onChange={(e) => handleChange("pkg_2_name", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paket 3</label>
              <input type="text" value={settings.pkg_3_name} onChange={(e) => handleChange("pkg_3_name", e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm focus:outline-none focus:border-nabiz-navy" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={yukleniyor}
            className="px-8 py-3 bg-nabiz-navy text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {yukleniyor ? "Kaydediliyor..." : "Ayarları Kaydet ve Güncelle"}
          </button>
        </div>
      </div>
    </div>
  );
}
