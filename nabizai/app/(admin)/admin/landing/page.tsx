"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const settingGroups = [
  {
    title: "Hero Bölümü",
    icon: "🎯",
    fields: [
      { key: "badge_text",    label: "Rozet Metni",             placeholder: "Canlı izleme · 26 kaynak..." },
      { key: "hero_title_1",  label: "Başlık Satır 1",           placeholder: "Yerel medyanın" },
      { key: "hero_title_2",  label: "Başlık Satır 2 (turuncu)", placeholder: "nabzı" },
      { key: "hero_desc",     label: "Açıklama",                 placeholder: "Yerel haberler...", multiline: true },
    ],
  },
  {
    title: "İstatistikler",
    icon: "📊",
    fields: [
      { key: "stat_1_n", label: "İstatistik 1 — Sayı",   placeholder: "26+" },
      { key: "stat_1_l", label: "İstatistik 1 — Etiket", placeholder: "yerel kaynak" },
      { key: "stat_2_n", label: "İstatistik 2 — Sayı",   placeholder: "4" },
      { key: "stat_2_l", label: "İstatistik 2 — Etiket", placeholder: "sosyal platform" },
      { key: "stat_3_n", label: "İstatistik 3 — Sayı",   placeholder: "30dk" },
      { key: "stat_3_l", label: "İstatistik 3 — Etiket", placeholder: "güncelleme sıklığı" },
      { key: "stat_4_n", label: "İstatistik 4 — Sayı",   placeholder: "AI" },
      { key: "stat_4_l", label: "İstatistik 4 — Etiket", placeholder: "destekli analiz" },
    ],
  },
  {
    title: "Paket Adları",
    icon: "📦",
    fields: [
      { key: "pkg_1_name",  label: "Paket 1 — Ad",    placeholder: "İzleme" },
      { key: "pkg_2_name",  label: "Paket 2 — Ad",    placeholder: "Radar Pro" },
      { key: "pkg_3_name",  label: "Paket 3 — Ad",    placeholder: "İstihbarat" },
    ],
  },
];

export default function AdminLandingPage() {
  const [settings, setSettings]         = useState<Record<string, string>>({});
  const [originalSettings, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
      setOriginal(data);
    } catch (e) {
      setError("Ayarlar yüklenemedi: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(await res.text());
      setOriginal({ ...settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Kaydetme hatası: " + String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Ayarlar yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">Landing Page CMS</h1>
            <p className="text-xs text-gray-400">nabizai.com ana sayfa içeriklerini yönetin</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2 text-sm font-medium text-nabiz-navy bg-nabiz-navy/5 rounded-xl hover:bg-nabiz-navy/10 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Önizle
            </Link>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                saved
                  ? "bg-nabiz-green text-white"
                  : hasChanges
                  ? "bg-nabiz-orange text-white shadow-lg shadow-nabiz-orange/20 hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Kaydediliyor...
                </>
              ) : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                  Kaydedildi!
                </>
              ) : "Kaydet"}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {settingGroups.map((group, gi) => (
          <div key={gi} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
              <span className="text-xl">{group.icon}</span>
              <h2 className="font-bold text-nabiz-dark">{group.title}</h2>
              {group.fields.some((f) => settings[f.key] !== originalSettings[f.key]) && (
                <span className="px-2 py-0.5 bg-nabiz-orange/10 text-nabiz-orange text-xs font-bold rounded-full">
                  Değiştirildi
                </span>
              )}
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-5">
              {group.fields.map((field) => (
                <div key={field.key} className={field.multiline ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-nabiz-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy transition-all resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={settings[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-nabiz-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20 focus:border-nabiz-navy transition-all ${
                        settings[field.key] !== originalSettings[field.key]
                          ? "border-nabiz-orange bg-orange-50/30"
                          : "border-gray-200"
                      }`}
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-300 font-mono">{field.key}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-nabiz-navy/5 rounded-2xl p-6 border border-nabiz-navy/10">
          <div className="flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-nabiz-dark mb-1">Nasıl çalışır?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Değişiklikler <code className="px-1.5 py-0.5 bg-white rounded text-nabiz-navy text-xs font-mono">data/site_settings.json</code> dosyasına kaydedilir.
                Landing page bu dosyayı okur ve içeriği günceller.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
