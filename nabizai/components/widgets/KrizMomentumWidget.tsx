"use client";
import { useEffect, useState } from "react";
import WidgetWrapper from "./WidgetWrapper";

const LEVEL_RENK: Record<string, string> = {
  Normal: "text-green-600 bg-green-100",
  Dikkat: "text-yellow-600 bg-yellow-100",
  Uyari: "text-orange-600 bg-orange-100",
  Kriz: "text-red-600 bg-red-100",
};

export default function KrizMomentumWidget({ musteriId }: { musteriId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/widgets/kriz_momentum?musteri_id=${musteriId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [musteriId]);

  const score = data?.score || 0;
  const level = data?.level || "Normal";
  const maxScore = 1000;
  const pct = Math.min((score / maxScore) * 100, 100);

  return (
    <WidgetWrapper title="Kriz Momentum" icon="📈" loading={loading}>
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-3">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={score >= 600 ? '#ef4444' : score >= 300 ? '#f97316' : score >= 100 ? '#eab308' : '#22c55e'} strokeWidth="8" strokeDasharray={`${pct * 2.64} 264`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-nabiz-dark">{score}</span>
            <span className="text-[10px] text-gray-400">/ {maxScore}</span>
          </div>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${LEVEL_RENK[level] || "text-gray-600 bg-gray-100"}`}>{level}</span>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div><p className="text-lg font-bold text-nabiz-dark">{data?.speed || 0}</p><p className="text-[10px] text-gray-400">Hız</p></div>
          <div><p className="text-lg font-bold text-nabiz-dark">{data?.source_count || 0}</p><p className="text-[10px] text-gray-400">Kaynak</p></div>
          <div><p className="text-lg font-bold text-nabiz-dark">{data?.intensity || 0}</p><p className="text-[10px] text-gray-400">Yoğunluk</p></div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
