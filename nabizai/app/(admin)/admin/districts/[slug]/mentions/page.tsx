"use client";

import { useState, useEffect } from "react";

export default function MentionsPage({ params }: { params: { slug: string } }) {
  const [mentions, setMentions] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function yukle() {
      try {
        const res = await fetch(`/api/haberler?limit=150&search=${params.slug}`);
        const json = await res.json();
        
        // Son 24 Saati Sabit Filtrele
        const son24Haberler = (json.items || []).filter((h: any) => {
          const hd = new Date(h.published_date || h.ingested_date).getTime();
          if (isNaN(hd)) return true;
          return (Date.now() - hd) / (1000 * 60 * 60) <= 24;
        });
        
        setMentions(son24Haberler);
      } catch (e) {
        console.error(e);
      } finally {
        setYukleniyor(false);
      }
    }
    yukle();
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-nabiz-dark">L1 Ham Yayın Akışı (raw_mentions)</h2>
          <p className="text-xs text-gray-500 mt-1">Bu bölgedeki süzülmemiş (tüm müşterilere açık) ham zeka verisi.</p>
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-[800px] overflow-y-auto">
        {yukleniyor && <div className="p-10 text-center text-gray-400">Veriler taranıyor...</div>}
        {!yukleniyor && mentions.length === 0 && <div className="p-10 text-center text-gray-400">Bu ilçe için henüz bir kayıt bulunamadı.</div>}
        {!yukleniyor && mentions.map((m: any) => (
           <div key={m.id} className="p-5 hover:bg-gray-50 flex gap-4 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
               {(m.metadata?.ai_summary || '').toLowerCase().includes("kriz") ? "🔥" : (m.metadata?.ai_summary || '').toLowerCase().includes("pozitif") ? "💚" : "📰"}
            </div>
            <div className="flex-1 min-w-0">
               <a href={m.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-nabiz-dark hover:underline leading-snug">{m.title}</a>
               <div className="flex items-center gap-3 mt-1.5 line-clamp-1">
                 <span className="text-xs font-semibold text-gray-400">{m.source}</span>
                 <span className="text-xs font-semibold text-gray-300">·</span>
                 <span className="text-xs font-semibold text-gray-400">{m.published_date || m.ingested_date}</span>
                 <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600`}>{m.risk_level || "low"}</span>
               </div>
            </div>
            <div>
               <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-nabiz-navy font-bold px-3 py-1.5 bg-nabiz-navy/5 rounded-lg hover:bg-nabiz-navy/10">Kaynağa Git</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
