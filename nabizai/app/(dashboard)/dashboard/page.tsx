export default function DashboardPage() {
  // Demo data — Supabase bağlantısı kurulduğunda gerçek veri ile değiştirilecek
  const stats = [
    { label: "Toplam Haber", value: "142", change: "+12", trend: "up", color: "text-nabiz-navy" },
    { label: "Sosyal İçerik", value: "89", change: "+8", trend: "up", color: "text-nabiz-navy" },
    { label: "Pozitif Ton", value: "%68", change: "+3%", trend: "up", color: "text-nabiz-green" },
    { label: "Kriz Uyarısı", value: "2", change: "-1", trend: "down", color: "text-nabiz-red" },
  ];

  const recentNews = [
    { title: "Bodrum Belediyesi yeni projeler açıkladı", source: "bodrumgundem.com", sentiment: "positive", time: "2 saat önce" },
    { title: "Turizm sezonunda doluluk artışı bekleniyor", source: "muglahaberleri.com", sentiment: "positive", time: "3 saat önce" },
    { title: "Halk plajlarında temizlik şikayetleri", source: "Twitter", sentiment: "negative", time: "4 saat önce" },
    { title: "Yat limanı genişletme çalışmaları başladı", source: "bodrumekspres.com", sentiment: "neutral", time: "5 saat önce" },
    { title: "Kültür festivali programı açıklandı", source: "Instagram", sentiment: "positive", time: "6 saat önce" },
  ];

  const crisisAlerts = [
    { topic: "Otopark şikayetleri yayılıyor", score: 7.2, sources: 4, status: "active" },
    { topic: "Plaj kirliliği haberleri", score: 5.8, sources: 2, status: "active" },
  ];

  const sentimentColor = (s: string) => {
    switch (s) {
      case "positive": return "bg-nabiz-green";
      case "negative": return "bg-nabiz-red";
      default: return "bg-nabiz-amber";
    }
  };

  const crisisScoreColor = (score: number) => {
    if (score >= 8) return "text-nabiz-red bg-red-50";
    if (score >= 5) return "text-nabiz-amber bg-amber-50";
    return "text-nabiz-green bg-green-50";
  };

  return (
    <div className="space-y-6">
      {/* AI Briefing */}
      <div className="gradient-orange rounded-2xl p-6 text-white shadow-lg shadow-nabiz-orange/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white/20 rounded-xl flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">AI Günlük Brifing</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              Bugün 142 haber tarandı. Genel medya tonu olumlu, ancak otopark konusunda
              sosyal medyada artan şikayetler dikkat çekiyor. Turizm sezonu doluluk beklentileri
              pozitif yansımalara yol açtı. Kriz skorları stabil.
            </p>
            <p className="text-white/50 text-xs mt-2">Son güncelleme: Bugün 07:00</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl p-5 border ${
              stat.label === "Kriz Uyarısı" ? "border-nabiz-red/20" : "border-gray-100"
            } hover:shadow-lg transition-all duration-300 group`}
          >
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
              <span
                className={`text-xs font-semibold mb-1 ${
                  stat.trend === "up" ? "text-nabiz-green" : "text-nabiz-red"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent News */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark">Son Haberler</h3>
            <span className="text-xs text-gray-400">Son 24 saat</span>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNews.map((news, i) => (
              <div key={i} className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${sentimentColor(news.sentiment)} mt-2 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-nabiz-dark group-hover:text-nabiz-navy transition-colors truncate">
                      {news.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{news.source}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{news.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crisis Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-nabiz-dark flex items-center gap-2">
              <svg className="w-4 h-4 text-nabiz-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              Kriz Uyarıları
            </h3>
            <span className="px-2 py-0.5 bg-nabiz-red/10 text-nabiz-red text-xs font-bold rounded-full">
              {crisisAlerts.length} aktif
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {crisisAlerts.map((alert, i) => (
              <div key={i} className="px-6 py-4">
                <p className="text-sm font-medium text-nabiz-dark mb-2">
                  {alert.topic}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${crisisScoreColor(alert.score)}`}
                  >
                    Skor: {alert.score}
                  </span>
                  <span className="text-xs text-gray-400">
                    {alert.sources} kaynak
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-nabiz-dark mb-6">Platform Dağılımı</h3>
          <div className="space-y-4">
            {[
              { name: "Web", count: 89, max: 142, color: "bg-nabiz-navy" },
              { name: "Twitter/X", count: 32, max: 142, color: "bg-sky-400" },
              { name: "Instagram", count: 15, max: 142, color: "bg-pink-500" },
              { name: "Facebook", count: 6, max: 142, color: "bg-blue-600" },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-20">{p.name}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${p.color} rounded-full transition-all duration-700`}
                    style={{ width: `${(p.count / p.max) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-nabiz-dark w-10 text-right">
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-nabiz-dark mb-6">Öne Çıkan Kelimeler</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "turizm", "belediye", "yat limanı", "festival", "doluluk",
              "otopark", "plaj", "temizlik", "proje", "yatırım",
              "otel", "restoran", "altyapı", "ulaşım", "çevre",
            ].map((keyword, i) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-default ${
                  i < 3
                    ? "bg-nabiz-navy/10 text-nabiz-navy"
                    : i < 6
                    ? "bg-nabiz-orange/10 text-nabiz-orange"
                    : "bg-gray-100 text-gray-600"
                } hover:scale-105`}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
