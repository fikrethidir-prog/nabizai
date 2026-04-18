export default function AIPromptsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Yapay Zeka (AI) İstem Profilleri</h1>
      <p className="text-sm font-semibold text-gray-500">
        Bu alandan Qwen2.5 arka plan işçilerinin (worker_enricher ve worker_curator) haberleri, krizleri ve duyguları puanlarken kullanacağı temel analiz promptlarını (sistematik yönergeleri) yönetebilirsiniz.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mt-6 shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L4.2 15.3m15.6 0v1.47a2.25 2.25 0 0 1-1.372 2.068l-5.364 2.146a2.25 2.25 0 0 1-1.65-.001L6.05 18.838A2.25 2.25 0 0 1 4.7 16.77V15.3" />
        </svg>
        <h2 className="text-lg font-bold text-gray-700">Modül Geliştirme Aşamasında</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
          Gelişmiş AI prompt profil yönetimi ve özel model entegrasyon ayarları (A/B testing vb.) yakında devreye alınacaktır.
        </p>
      </div>
    </div>
  );
}
