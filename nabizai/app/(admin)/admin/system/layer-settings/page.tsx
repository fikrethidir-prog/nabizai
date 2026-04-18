"use client";

import { useState, useEffect } from "react";

export default function LayerSettingsPage() {
  const [cronState, setCronState] = useState<any>({ aktif: false, asistan: "Çevrimdışı" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cron").then(r => r.json()).then(d => setCronState(d)).catch(()=> {});
  }, []);

  async function triggerAction(action: string) {
    setLoading(true);
    await fetch("/api/cron", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const snap = await fetch("/api/cron").then(r => r.json());
    setCronState(snap);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Katman Ayarları (Worker Cron Management)</h1>
      <p className="text-sm font-semibold text-gray-500">
        Bu alandan L1 ve L5 arka plan Python işçilerinin tarama döngülerini (Node.js Cron / PM2) tetikleyebilir ve otomatiğe bağlayabilirsiniz.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
           <h2 className="text-lg font-bold text-nabiz-dark mb-4 flex items-center gap-2">⏱️ Merkez Veri Motoru (Cron)</h2>
           <div className="flex items-center gap-4 mb-6">
              <div className={`w-3 h-3 rounded-full ${cronState.aktif ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <p className="text-sm font-semibold text-gray-600">Durum: <span className="font-bold text-nabiz-dark">{cronState.aktif ? "ÇALIŞIYOR (Aktif)" : "DURDURULDU"}</span></p>
           </div>
           <p className="text-xs text-gray-400 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
             Sistemdeki otonom işçiler (worker_curator, worker_enricher, agent_ingestion) şu anda <b>her 30 dakikada bir (*/30 * * * *)</b> tüm 13 ilçe ağını tarar ve Müşteri feed'lerini hesaplar.
           </p>

           <div className="flex flex-wrap gap-3">
              <button disabled={loading} onClick={() => triggerAction(cronState.aktif ? 'stop' : 'start')} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${cronState.aktif ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                 {cronState.aktif ? "Motoru Durdur" : "Otomatik Taramayı Başlat"}
              </button>
              <button disabled={loading} onClick={() => triggerAction("trigger")} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-nabiz-navy hover:bg-nabiz-navy/90 text-white transition-all shadow-md">
                 🚀 Anlık Tarama Başlat (Manuel)
              </button>
           </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
           <h2 className="text-lg font-bold text-nabiz-dark mb-4 flex items-center gap-2">🧠 L2 Zeka Algoritması (Qwen2.5)</h2>
           <div className="space-y-4">
              <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Local LLM Host Endpoint</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-nabiz-dark" defaultValue="http://localhost:11434/api/generate" />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Qwen Model Versiyonu</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-nabiz-dark" defaultValue="qwen2.5" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
