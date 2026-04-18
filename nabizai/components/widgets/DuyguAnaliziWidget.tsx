"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function DuyguAnaliziWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/widgets/duygu_analizi?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);

  const d = data?.distribution || { pozitif: 0, notr: 0, negatif: 0 };
  const total = d.pozitif + d.notr + d.negatif || 1;

  return (
    <WidgetWrapper title="Duygu Analizi" icon="💬" loading={loading}>
      <div className="space-y-3">
        {[
          { label: 'Pozitif', value: d.pozitif, color: 'bg-green-500', pct: Math.round(d.pozitif / total * 100) },
          { label: 'Nötr',    value: d.notr,    color: 'bg-yellow-500', pct: Math.round(d.notr / total * 100) },
          { label: 'Negatif', value: d.negatif, color: 'bg-red-500', pct: Math.round(d.negatif / total * 100) },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-600">{item.label}</span>
              <span className="text-gray-400">{item.value} ({item.pct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-gray-400 mt-2">Toplam: {data?.total || 0} haber</p>
      </div>
    </WidgetWrapper>
  );
}
