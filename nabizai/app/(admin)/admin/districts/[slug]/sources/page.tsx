"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { muglaIlceleri } from "@/lib/mugla_ilceleri";

export default function SourcesPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "bodrum";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", type: "rss", status: "active" });
  
  // Bulunduğumuz ilçeyi tespit et
  const districtData = muglaIlceleri.find((i: any) => i.id === slug) || muglaIlceleri[1];

  // Json dosyasındaki kaynaklardan state oluştur
  const initialSources = districtData.rss_kaynaklari.map((url: string, i: number) => ({
    id: i + 1,
    name: new URL(url).hostname || "RSS Kaynağı",
    url: url,
    type: "rss",
    status: "active",
    last_scraped: "Az önce"
  }));
  
  // Google arama botunu otomatik liste başına ekle
  initialSources.unshift({
    id: 999,
    name: "Google Global Web & Haber Ağı",
    url: "https://news.google.com",
    type: "web",
    status: "active",
    last_scraped: "Otomatik"
  });

  const [sources, setSources] = useState(initialSources);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-nabiz-dark">Hedef Kaynaklar / Listening Posts</h2>
          <p className="text-xs text-gray-500 mt-1">Bu ilçe sınırları içinde düzenli olarak taranan dijital sensörler.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-nabiz-orange text-white text-xs font-bold rounded-xl shadow-md hover:bg-nabiz-orange/90 transition-all"
        >
          ➕ Kaynak Ekle
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="text-lg font-extrabold text-nabiz-dark mb-4">Yeni Kaynak Sensörü Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kaynak Adı</label>
                <input type="text" value={newSource.name} onChange={e => setNewSource({...newSource, name: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Örn: Bodrum Haber Ajansı" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Hedef URL</label>
                <input type="text" value={newSource.url} onChange={e => setNewSource({...newSource, url: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Platform Tipi</label>
                <select value={newSource.type} onChange={e => setNewSource({...newSource, type: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="rss">🗞️ RSS Akışı</option>
                  <option value="web">🌐 Web Scraping</option>
                  <option value="facebook">📘 Facebook</option>
                  <option value="x">🐦 X (Twitter)</option>
                  <option value="instagram">📸 Instagram</option>
                  <option value="google_maps">🗺️ Google Haritalar (Yorumlar)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">İptal</button>
                <button 
                  onClick={() => {
                    setSources([...sources, { id: Date.now(), name: newSource.name, url: newSource.url, type: newSource.type, status: "active", last_scraped: "Henüz taranmadı" }]);
                    setIsModalOpen(false);
                    setNewSource({ name: "", url: "", type: "rss", status: "active" });
                  }} 
                  className="px-5 py-2.5 bg-nabiz-navy text-white text-xs font-bold rounded-xl shadow hover:bg-nabiz-navy/90"
                >
                  📡 Entegre Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-0">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-3">Kaynak Adı</th>
              <th className="px-6 py-3">Tip</th>
              <th className="px-6 py-3">Hedef URL / Hedef Selector</th>
              <th className="px-6 py-3">Durum</th>
              <th className="px-6 py-3 text-right">Son Tarama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sources.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-nabiz-dark">{s.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {s.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{s.url}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.status === "active" ? "Aktif" : "Durduruldu"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-400 text-xs font-semibold">{s.last_scraped}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sources.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm font-semibold">Bu ilçeye atanmış kaynak bulunmuyor.</div>
        )}
      </div>
    </div>
  );
}
