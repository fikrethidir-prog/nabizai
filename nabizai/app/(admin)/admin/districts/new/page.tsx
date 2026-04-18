export default function NewDistrictPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Yeni L1 İstasyon (İlçe) Ekle</h1>
      <p className="text-sm font-semibold text-gray-500">
        Yeni bir bölgeyi veri havuzuna ekleyerek otomatik haber/sosyal medya tarayıcılarını o bölge için görevlendirebilirsiniz.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center mt-6 shadow-sm">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-700">Modül Geliştirme Aşamasında</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
          Otomatik istasyon açılış ve tarayıcı yetkilendirme asistanı, veritabanı yansıması (Supabase Import) tamamlandıktan sonra devreye alınacaktır.
        </p>
      </div>
    </div>
  );
}
