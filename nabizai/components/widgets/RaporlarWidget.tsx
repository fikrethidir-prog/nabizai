"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function RaporlarWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/widgets/raporlar?musteri_id=${musteriId}`)
      .then(r => r.json()).then(d => setData(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [musteriId]);
  return (
    <WidgetWrapper title="Raporlar" icon="📄" loading={loading}>
      {data.length ? (
        <div className="space-y-2">
          {data.slice(0, 5).map((r: any) => (
            <a key={r.id} href={r.url} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <span className="text-2xl">📑</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-nabiz-dark truncate">{r.baslik}</p>
              </div>
              <span className="text-nabiz-orange text-xs font-bold">İndir</span>
            </a>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Henüz rapor yok</p>}
    </WidgetWrapper>
  );
}
