"use client";

export default function AnalyticsPage() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm p-8 flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-4">
            📊
        </div>
        <h3 className="text-lg font-bold text-nabiz-dark">Bölgesel Analitik & İçgörüler</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-md">
            Bu ilçeye ait tüm kaynakların hacim metrikleri, haftalık PR simülasyonları ve Qwen2.5 yapay zeka tarafından oluşturulan bölgesel eğilimler (trend konuları) burada görüntülenecek.
        </p>
    </div>
  );
}
