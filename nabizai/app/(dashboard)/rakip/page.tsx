export default function RakipPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Rakip Analiz</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-nabiz-navy/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">Rakip medya analizi burada gösterilecek</h3>
        <p className="text-sm text-gray-300">Supabase bağlantısı kurulduğunda rakip analiz verileri otomatik olarak listelenecektir.</p>
      </div>
    </div>
  );
}
