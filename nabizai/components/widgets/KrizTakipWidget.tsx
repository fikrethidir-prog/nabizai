"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function KrizTakipWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/widgets/kriz_takip?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);

  return (
    <WidgetWrapper title="Kriz Takip" icon="🚨" loading={loading} colSpan={2}>
      {data?.alerts?.length ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {data.alerts.slice(0, 8).map((a: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border ${a.risk_level === 'high' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
              <p className="text-sm font-medium text-nabiz-dark">{a.title}</p>
              <p className="text-[11px] text-gray-500 mt-1">{a.source} · {a.risk_reason}</p>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Aktif kriz uyarısı yok</p>}
    </WidgetWrapper>
  );
}
