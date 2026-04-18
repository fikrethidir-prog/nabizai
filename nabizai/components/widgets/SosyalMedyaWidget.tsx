"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function SosyalMedyaWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/widgets/sosyal_medya?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);
  return (
    <WidgetWrapper title="Sosyal Medya" icon="📱" loading={loading}>
      {data?.data?.length ? (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {data.data.map((p: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-nabiz-dark">{p.text}</p>
              <div className="flex gap-3 mt-2 text-[11px] text-gray-400">
                <span>❤️ {p.likes || 0}</span>
                <span>💬 {p.comments || p.retweets || 0}</span>
                <span>{p.platform}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">Sosyal medya verisi yok</p>}
    </WidgetWrapper>
  );
}
