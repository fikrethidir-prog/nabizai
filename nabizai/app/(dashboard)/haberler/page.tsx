export default function HaberlerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-nabiz-dark">Haberler</h1>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20">
            <option>Tüm Platformlar</option>
            <option>Web</option>
            <option>Twitter/X</option>
            <option>Instagram</option>
            <option>Facebook</option>
          </select>
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20">
            <option>Tüm Tonlar</option>
            <option>Pozitif</option>
            <option>Nötr</option>
            <option>Negatif</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">Haber listesi burada gösterilecek</h3>
        <p className="text-sm text-gray-300">Supabase bağlantısı kurulduğunda haberler otomatik olarak listelenecektir.</p>
      </div>
    </div>
  );
}
