"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function HaberlerWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/widgets/haberler?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);

  const riskRenk = (r: string) => r === 'high' ? 'text-red-500 bg-red-50' : r === 'medium' ? 'text-orange-500 bg-orange-50' : 'text-green-500 bg-green-50';

  return (
    <WidgetWrapper title="Son Haberler" icon="📰" loading={loading} colSpan={2}>
      {data?.items?.length ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.items.slice(0, 12).map((h: any) => (
            <a key={h.id} href={h.url} target="_blank" rel="noopener" className="block p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-nabiz-dark line-clamp-2">{h.baslik}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{h.kaynak} · {h.tarih}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskRenk(h.risk_level || (h.risk_skoru >= 7 ? 'high' : h.risk_skoru >= 4 ? 'medium' : 'low'))}`}>
                  {h.risk_skoru >= 7 ? 'Yüksek' : h.risk_skoru >= 4 ? 'Orta' : 'Düşük'}
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Henüz haber yok</p>}
    </WidgetWrapper>
  );
}
