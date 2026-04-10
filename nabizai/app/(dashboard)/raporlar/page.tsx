export default function RaporlarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Raporlar</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">PDF raporlar burada listelenecek</h3>
        <p className="text-sm text-gray-300">Supabase bağlantısı kurulduğunda raporlar otomatik oluşturulacaktır.</p>
      </div>
    </div>
  );
}
