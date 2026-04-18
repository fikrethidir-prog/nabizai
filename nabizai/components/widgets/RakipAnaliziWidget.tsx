"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function RakipAnaliziWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/widgets/rakip_analizi?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);
  return (
    <WidgetWrapper title="Rakip Analizi" icon="🏁" loading={loading}>
      {data?.sources?.length ? (
        <div className="space-y-2">
          {data.sources.map((s: any) => (
            <div key={s.source} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-nabiz-dark truncate">{s.source}</span>
              <span className="text-xs font-bold text-nabiz-orange">{s.count} haber</span>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Rakip verisi yok</p>}
    </WidgetWrapper>
  );
}
