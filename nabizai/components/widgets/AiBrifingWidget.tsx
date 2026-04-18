"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

export default function AiBrifingWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/widgets/ai_brifing?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);
  return (
    <WidgetWrapper title="AI Günlük Brifing" icon="🤖" loading={loading}>
      {data?.content ? (
        <div className="prose prose-sm max-w-none text-nabiz-dark max-h-[300px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded-xl font-sans leading-relaxed">{data.content.slice(0, 2000)}</pre>
          {data.tarih && <p className="text-[10px] text-gray-400 mt-2">Son güncelleme: {new Date(data.tarih).toLocaleDateString('tr-TR')}</p>}
        </div>
      ) : <p className="text-gray-400 text-sm text-center py-8">AI brifing henüz üretilmemiş</p>}
    </WidgetWrapper>
  );
}
