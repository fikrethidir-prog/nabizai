export default function KrizPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-nabiz-dark">Kriz Takibi</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-nabiz-red/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">Kriz uyarıları burada gösterilecek</h3>
        <p className="text-sm text-gray-300">Supabase bağlantısı kurulduğunda kriz verileri otomatik olarak listelenecektir.</p>
      </div>
    </div>
  );
}
