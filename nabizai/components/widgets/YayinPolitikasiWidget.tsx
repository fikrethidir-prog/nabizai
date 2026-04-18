"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function YayinPolitikasiWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/widgets/yayin_politikasi?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);

  const stanceRenk = (s: string) => s === 'pozitif_yanli' ? 'text-green-600' : s === 'negatif_yanli' ? 'text-red-600' : 'text-gray-500';
  const stanceAd = (s: string) => s === 'pozitif_yanli' ? 'Pozitif Yanlı' : s === 'negatif_yanli' ? 'Negatif Yanlı' : 'Nötr';

  return (
    <WidgetWrapper title="Yayın Politikası" icon="⚖️" loading={loading}>
      {data?.sources?.length ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {data.sources.map((s: any) => (
            <div key={s.source} className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-nabiz-dark">{s.source}</span>
                <span className={`text-xs font-bold ${stanceRenk(s.stance)}`}>{stanceAd(s.stance)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.abs(s.bias_score) * 100}%`,
                    backgroundColor: s.bias_score > 0 ? '#22c55e' : s.bias_score < 0 ? '#ef4444' : '#9ca3af',
                    marginLeft: s.bias_score < 0 ? `${(1 - Math.abs(s.bias_score)) * 100}%` : '0',
                  }} />
                </div>
                <span className="text-[10px] text-gray-400 w-10 text-right">{s.bias_score?.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{s.article_count} makale</p>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Yayın analizi henüz yapılmadı</p>}
    </WidgetWrapper>
  );
}
