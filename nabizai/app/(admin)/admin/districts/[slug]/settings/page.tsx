"use client";

export default function SettingsPage() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm p-6">
        <h3 className="text-sm font-bold text-nabiz-dark mb-4">İlçe Ayarları</h3>
        <div className="space-y-4 max-w-md">
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">İlçe Slug / Identifier</label>
                <input type="text" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400" value="okunuyor..." />
            </div>
            <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mevcut Belediye Başkanı (Tags)</label>
                <input type="text" placeholder="Örn: Ahmet Aras" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-nabiz-dark" />
            </div>
            <div className="pt-2">
                <button className="bg-nabiz-navy text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-nabiz-navy/90">Ayarları Kaydet</button>
            </div>
        </div>
    </div>
  );
}
