"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PAKETLER, PAKET_SIRA, paketIzinVeriyor,
  SOSYAL_PLATFORMLAR, KATEGORILER,
  type PaketId,
} from "@/lib/paketConfig";

import { MUGLA_ILCELERI } from "@/lib/muglaConfig";
import { MUSTERI_TIPLERI, WIDGET_TANIMLARI, VARSAYILAN_WIDGETLAR, getDefaultWidgets } from "@/lib/widgetConfig";
import type { MusteriTipi, WidgetType, WidgetPermissions } from "@/lib/types";

interface WebSitesi { id: string; url: string; aktif: boolean; ad?: string; }
interface SosyalMedyaAyar { platform: string; aktif: boolean; hesaplar: string[] }

interface FormData {
  id?: string;
  musteriAd: string; yetkili: string; email: string; il: string;
  paket: PaketId;
  kategoriler: string[];
  ilceler: string[];
  anahtar_kelimeler: string[]; haric_kelimeler: string[];
  haber_kaynaklari: string[];
  sosyal_medya: SosyalMedyaAyar[];
  tarama_sikligi_dk: number; kriz_esigi: number;
  otomatik_tetikleme: boolean; tetikleme_kurallari: string[];
  rakipler: string[];
  gunluk_email: boolean; email_saati: string;
  haftalik_pdf: boolean; haftalik_pdf_gun: string;
  aylik_rapor: boolean;
  telegram_aktif: boolean; telegram_chat_id: string;
  whatsapp_aktif: boolean; whatsapp_numara: string;
  ai_brifing: boolean; ai_brifing_saati: string;
  duygu_analizi: boolean; kriz_erken_uyari: boolean; ai_yorum: boolean;
  rakip_takibi: boolean;
  ozel_kaynak_listesi: boolean; ozel_dashboard: boolean;
  musteri_tipi: MusteriTipi;
  widget_permissions: WidgetPermissions;
}

const DEFAULT_FORM: FormData = {
  musteriAd: "", yetkili: "", email: "", il: "",
  paket: "izleme",
  kategoriler: [], ilceler: [],
  anahtar_kelimeler: [], haric_kelimeler: [],
  haber_kaynaklari: [],
  sosyal_medya: SOSYAL_PLATFORMLAR.map(p => ({ platform: p.id, aktif: false, hesaplar: [] })),
  tarama_sikligi_dk: 60, kriz_esigi: 6,
  otomatik_tetikleme: true, tetikleme_kurallari: [],
  rakipler: [],
  gunluk_email: true, email_saati: "09:00",
  haftalik_pdf: true, haftalik_pdf_gun: "Pazartesi",
  aylik_rapor: false,
  telegram_aktif: false, telegram_chat_id: "",
  whatsapp_aktif: false, whatsapp_numara: "",
  ai_brifing: false, ai_brifing_saati: "08:00",
  duygu_analizi: false, kriz_erken_uyari: false, ai_yorum: false,
  rakip_takibi: false,
  ozel_kaynak_listesi: false, ozel_dashboard: false,
  musteri_tipi: "medya" as MusteriTipi,
  widget_permissions: getDefaultWidgets("medya"),
};

// ── Yardımcı bileşenler ────────────────────────────────────────────────

function Lock({ paket }: { paket: string }) {
  const paketAd = PAKETLER[paket as PaketId]?.ad || paket;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-400 rounded-md">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
      </svg>
      {paketAd}
    </span>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  }
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[48px]">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 px-2 py-1 bg-nabiz-navy/10 text-nabiz-navy text-xs font-semibold rounded-lg">
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-nabiz-red ml-1">×</button>
        </span>
      ))}
      <input
        value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder={placeholder || "Yaz ve Enter'a bas..."}
        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none text-nabiz-dark placeholder-gray-300"
      />
    </div>
  );
}

function Toggle({ label, desc, value, onChange, locked, lockPaket }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
  locked?: boolean; lockPaket?: string;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 rounded-xl ${locked ? "opacity-50" : ""}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-nabiz-dark text-sm">{label}</p>
          {locked && lockPaket && <Lock paket={lockPaket} />}
        </div>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        disabled={locked}
        onClick={() => !locked && onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value && !locked ? "bg-nabiz-navy" : "bg-gray-200"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value && !locked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

const ADIMLAR = [
  { no: 1, baslik: "Müşteri & Paket" },
  { no: 2, baslik: "Müşteri Tipi" },
  { no: 3, baslik: "Kategori & Konular" },
  { no: 4, baslik: "Kaynaklar & Platformlar" },
  { no: 5, baslik: "Tarama & Tetikleme" },
  { no: 6, baslik: "Widget Seçimi" },
  { no: 7, baslik: "Raporlama & Bildirimler" },
  { no: 8, baslik: "Özet & Kaydet" },
];

// ── Ana bileşen ────────────────────────────────────────────────────────
function PanelOlusturInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [adim, setAdim] = useState(1);
  const [form, setForm] = useState<FormData>(() => ({
    ...DEFAULT_FORM,
    musteriAd: searchParams.get("kurum") || searchParams.get("sirket") || DEFAULT_FORM.musteriAd,
    yetkili: searchParams.get("ad") || DEFAULT_FORM.yetkili,
    email: searchParams.get("email") || DEFAULT_FORM.email,
  }));
  const [kaydetme, setKaydetme] = useState(false);
  const [basari, setBasari] = useState(false);
  const [kaydedilenId, setKaydedilenId] = useState<string>("");
  const [hata, setHata] = useState("");
  const [yeniKaynak, setYeniKaynak] = useState("");
  const [yeniRakip, setYeniRakip] = useState("");
  // Sosyal medya platform input'ları — hook kuralı gereği map dışında tutulur
  const [sosyalInputs, setSosyalInputs] = useState<Record<string, string>>({});
  const [webSiteleri, setWebSiteleri] = useState<WebSitesi[]>([]);
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Web sitelerini API'den yükle
  useEffect(() => {
    fetch("/api/web-siteleri")
      .then(r => r.json())
      .then((sites: WebSitesi[]) => {
        const aktifSiteler = sites.filter(s => s.aktif);
        setWebSiteleri(aktifSiteler);
        // Eğer form'da kaynak seçilmemişse tümünü otomatik seç
        setForm(f => f.haber_kaynaklari.length === 0
          ? { ...f, haber_kaynaklari: aktifSiteler.map(s => s.id) }
          : f
        );
      })
      .catch(() => {});
  }, []);

  // Edit modu: mevcut paneli yükle
  useEffect(() => {
    if (!editId) return;
    fetch("/api/musteri-paneli")
      .then(r => r.json())
      .then((list: FormData[]) => {
        const p = list.find(x => x.id === editId);
        if (p) setForm({ ...DEFAULT_FORM, ...p });
      });
  }, [editId]);

  const set = useCallback(<K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(f => ({ ...f, [key]: val })), []);

  // Paket değişince özellikleri otomatik konfigüre et
  function setPaket(id: PaketId) {
    const p = PAKETLER[id];
    const v = p.varsayilan;
    setForm(f => ({
      ...f,
      paket: id,
      tarama_sikligi_dk: v.tarama_sikligi_dk,
      kriz_esigi: v.kriz_esigi,
      email_saati: v.email_saati,
      ai_brifing_saati: v.ai_brifing_saati,
      duygu_analizi: p.ozellikler.duygu_analizi,
      kriz_erken_uyari: p.ozellikler.kriz_erken_uyari,
      ai_yorum: p.ozellikler.ai_yorum,
      rakip_takibi: p.ozellikler.rakip_takibi,
      aylik_rapor: p.ozellikler.aylik_rapor,
      ai_brifing: p.ozellikler.ai_brifing,
      ozel_kaynak_listesi: p.ozellikler.ozel_kaynak,
      ozel_dashboard: p.ozellikler.ozel_dashboard,
      sosyal_medya: SOSYAL_PLATFORMLAR.map(pl => ({
        platform: pl.id,
        aktif: v.sosyal_platformlar.includes(pl.id),
        hesaplar: f.sosyal_medya.find(s => s.platform === pl.id)?.hesaplar || [],
      })),
    }));
  }

  function izinVar(ozellik: string) { return paketIzinVeriyor(form.paket, ozellik); }

  function sosyalAktifSayisi() { return form.sosyal_medya.filter(s => s.aktif).length; }
  function maxSosyal() { return PAKETLER[form.paket].maxSosyalMedya; }

  function toggleSosyal(platform: string) {
    const aktif = form.sosyal_medya.find(s => s.platform === platform)?.aktif;
    if (!aktif && sosyalAktifSayisi() >= maxSosyal()) return;
    set("sosyal_medya", form.sosyal_medya.map(s =>
      s.platform === platform ? { ...s, aktif: !s.aktif } : s
    ));
  }

  function addHesap(platform: string, hesap: string) {
    if (!hesap.trim()) return;
    set("sosyal_medya", form.sosyal_medya.map(s =>
      s.platform === platform ? { ...s, hesaplar: [...s.hesaplar, hesap.trim()] } : s
    ));
  }

  function removeHesap(platform: string, hesap: string) {
    set("sosyal_medya", form.sosyal_medya.map(s =>
      s.platform === platform ? { ...s, hesaplar: s.hesaplar.filter(h => h !== hesap) } : s
    ));
  }

  async function kaydet() {
    setKaydetme(true); setHata("");
    try {
      const res = await fetch("/api/musteri-paneli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.id) setKaydedilenId(data.id);
      setBasari(true);
    } catch (e) { setHata(String(e)); }
    finally { setKaydetme(false); }
  }

  // ── Adım 1: Müşteri & Paket ─────────────────────────────────────────
  const adim1 = (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-nabiz-dark mb-4">Müşteri Bilgileri</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: "musteriAd", label: "Müşteri / Kurum Adı", placeholder: "Bodrum Belediyesi" },
            { key: "yetkili",   label: "Yetkili Kişi",         placeholder: "Ahmet Yıldız" },
            { key: "email",     label: "E-posta",               placeholder: "info@bodrum.bel.tr" },
            { key: "il",        label: "İl / Şehir",            placeholder: "Muğla" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{f.label}</label>
              <input
                value={(form as unknown as Record<string, unknown>)[f.key] as string}
                onChange={e => set(f.key as keyof FormData, e.target.value as never)}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-nabiz-dark mb-4">Paket Seçimi</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PAKET_SIRA.map(pid => {
            const p = PAKETLER[pid];
            const secili = form.paket === pid;
            const renkler: Record<string, string> = {
              "nabiz-navy":  "border-nabiz-navy ring-nabiz-navy bg-nabiz-navy/5",
              "nabiz-orange":"border-nabiz-orange ring-nabiz-orange bg-orange-50",
              "purple":      "border-purple-500 ring-purple-500 bg-purple-50",
            };
            const btnRenk: Record<string, string> = {
              "nabiz-navy":  "bg-nabiz-navy",
              "nabiz-orange":"bg-nabiz-orange",
              "purple":      "bg-purple-600",
            };
            return (
              <button
                key={pid}
                onClick={() => setPaket(pid)}
                className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                  secili ? `${renkler[p.renk]} ring-2 ring-offset-2 shadow-lg` : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                {p.vurgu && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-nabiz-orange text-white text-[10px] font-bold rounded-full shadow">
                    En çok satan
                  </span>
                )}
                <p className="text-lg font-extrabold text-nabiz-dark">{p.ad}</p>
                <p className="text-xs text-gray-500 mt-1">{p.hedefKitle}</p>
                <div className="mt-4 space-y-1.5 text-xs">
                  {Object.entries(p.ozellikler).slice(0, 7).map(([k, v]) => (
                    <div key={k} className={`flex items-center gap-1.5 ${v ? "text-gray-700" : "text-gray-300"}`}>
                      {v ? <span className="text-nabiz-green font-bold">✓</span> : <span className="text-gray-300">–</span>}
                      <span>{k.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
                {secili && (
                  <div className={`mt-3 px-3 py-1.5 ${btnRenk[p.renk]} text-white text-xs font-bold rounded-lg text-center`}>
                    Seçili
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Adım 2: Kategori & Konular ───────────────────────────────────────
  const adim2 = (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-nabiz-dark">Takip Edilecek Kategoriler</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {KATEGORILER.map(k => {
          const secili = form.kategoriler.includes(k.id);
          return (
            <button
              key={k.id}
              onClick={() => set("kategoriler", secili
                ? form.kategoriler.filter(c => c !== k.id)
                : [...form.kategoriler, k.id]
              )}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                secili
                  ? "bg-nabiz-navy/8 border-nabiz-navy text-nabiz-navy"
                  : "bg-white border-gray-200 text-gray-600 hover:border-nabiz-navy/30"
              }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${
                secili ? "bg-nabiz-navy border-nabiz-navy" : "border-gray-300"
              }`}>
                {secili && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>}
              </div>
              {k.ad}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-nabiz-dark border-t border-gray-100 pt-5">L1 - Hedeflenen Muğla İlçeleri (Kılcal Damar)</h2>
        <div className="flex gap-2">
            <button onClick={() => set("ilceler", MUGLA_ILCELERI.map(k => k.id))} className="text-xs font-semibold text-nabiz-navy hover:underline">Tüm Muğla</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => set("ilceler", [])} className="text-xs font-semibold text-gray-400 hover:underline">Temizle</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MUGLA_ILCELERI.map(ilce => {
            const secili = form.ilceler.includes(ilce.id);
            return (
              <button
                key={ilce.id}
                onClick={() => set("ilceler", secili ? form.ilceler.filter(c => c !== ilce.id) : [...form.ilceler, ilce.id])}
                className={`flex justify-between items-center px-3 py-2 border rounded-xl text-xs font-semibold transition-all ${
                  secili ? "bg-nabiz-orange/10 border-nabiz-orange text-nabiz-orange" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span>{ilce.ad}</span>
                {secili && <span className="w-1.5 h-1.5 rounded-full bg-nabiz-orange"></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Özel Anahtar Kelimeler</label>
          <TagInput
            tags={form.anahtar_kelimeler}
            onChange={v => set("anahtar_kelimeler", v)}
            placeholder="Kelime ekle, Enter'a bas..."
          />
          <p className="text-xs text-gray-400 mt-1">Bu kelimeler geçen haberler önceliklendirilir</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Hariç Tutulacak Kelimeler</label>
          <TagInput
            tags={form.haric_kelimeler}
            onChange={v => set("haric_kelimeler", v)}
            placeholder="Kelime ekle, Enter'a bas..."
          />
          <p className="text-xs text-gray-400 mt-1">Bu kelimeler geçen haberler filtrelenir</p>
        </div>
      </div>
    </div>
  );

  // ── Adım 3: Kaynaklar & Platformlar ─────────────────────────────────
  const adim3 = (
    <div className="space-y-6">
      {/* Haber kaynakları */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold text-nabiz-dark">Haber Kaynakları</h2>
          <div className="flex gap-2">
            <button onClick={() => set("haber_kaynaklari", webSiteleri.map(k => k.id))}
              className="text-xs font-semibold text-nabiz-navy hover:underline">Tümünü seç</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => set("haber_kaynaklari", [])}
              className="text-xs font-semibold text-gray-400 hover:underline">Temizle</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {webSiteleri.map(k => {
            const secili = form.haber_kaynaklari.includes(k.id);
            return (
              <button
                key={k.id}
                onClick={() => set("haber_kaynaklari", secili
                  ? form.haber_kaynaklari.filter(x => x !== k.id)
                  : [...form.haber_kaynaklari, k.id]
                )}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
                  secili ? "bg-nabiz-navy/8 border-nabiz-navy text-nabiz-navy" : "bg-white border-gray-200 text-gray-600"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                  secili ? "bg-nabiz-navy border-nabiz-navy" : "border-gray-300"
                }`}>
                  {secili && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>}
                </div>
                {k.ad}
              </button>
            );
          })}
        </div>

        {/* Özel URL ekle (Radar Pro+) */}
        {izinVar("ozel_kaynak") && (
          <div className="mt-4 flex gap-2">
            <input
              value={yeniKaynak}
              onChange={e => setYeniKaynak(e.target.value)}
              placeholder="Özel RSS URL ekle (https://...)"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
            />
            <button onClick={() => {
              if (yeniKaynak.trim()) {
                set("haber_kaynaklari", [...form.haber_kaynaklari, yeniKaynak.trim()]);
                setYeniKaynak("");
              }
            }} className="px-4 py-2.5 bg-nabiz-navy text-white text-sm font-semibold rounded-xl hover:opacity-90">
              Ekle
            </button>
          </div>
        )}
        <p className="text-sm font-medium text-nabiz-dark mt-2">
          {form.haber_kaynaklari.length} kaynak seçili
        </p>
      </div>

      {/* Sosyal medya platformları */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-extrabold text-nabiz-dark">Sosyal Medya Platformları</h2>
          <span className="text-xs text-gray-400 font-medium">
            {sosyalAktifSayisi()} / {maxSosyal()} platform aktif
          </span>
        </div>
        <div className="space-y-3">
          {SOSYAL_PLATFORMLAR.map(pl => {
            const ayar = form.sosyal_medya.find(s => s.platform === pl.id)!;
            const dolu = !ayar.aktif && sosyalAktifSayisi() >= maxSosyal();
            const hInput = sosyalInputs[pl.id] || "";
            const setHInput = (v: string) => setSosyalInputs(prev => ({ ...prev, [pl.id]: v }));
            return (
              <div key={pl.id} className={`rounded-2xl border p-4 transition-all ${
                ayar.aktif ? "border-nabiz-navy bg-nabiz-navy/4" : dolu ? "border-gray-100 opacity-50" : "border-gray-200 bg-white"
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSosyal(pl.id)}
                    disabled={dolu}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${ayar.aktif ? "bg-nabiz-navy" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${ayar.aktif ? "left-5" : "left-1"}`} />
                  </button>
                  <span className="text-lg">{pl.ikon}</span>
                  <span className="font-semibold text-nabiz-dark text-sm">{pl.ad}</span>
                  {dolu && <Lock paket="radar_pro" />}
                </div>
                {ayar.aktif && (
                  <div className="mt-3 pl-13">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ayar.hesaplar.map(h => (
                        <span key={h} className="flex items-center gap-1 px-2 py-1 bg-nabiz-navy/10 text-nabiz-navy text-xs font-semibold rounded-lg">
                          @{h}
                          <button onClick={() => removeHesap(pl.id, h)} className="hover:text-nabiz-red ml-1">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={hInput}
                        onChange={e => setHInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { addHesap(pl.id, hInput); setHInput(""); } }}
                        placeholder={`@hesap ekle...`}
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-nabiz-navy/30"
                      />
                      <button onClick={() => { addHesap(pl.id, hInput); setHInput(""); }}
                        className="px-3 py-2 bg-nabiz-navy/10 text-nabiz-navy text-xs font-semibold rounded-lg hover:bg-nabiz-navy/20">
                        Ekle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Adım 4: Tarama & Tetikleme ───────────────────────────────────────
  const adim4 = (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-nabiz-dark">Tarama Ayarları</h2>

      {/* Tarama sıklığı */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-3">Tarama Sıklığı</label>
        <div className="flex gap-3">
          {[30, 60, 120].map(dk => {
            const minDk = PAKETLER[form.paket].minTaramaSikligi;
            const disabled = dk < minDk;
            return (
              <button
                key={dk}
                disabled={disabled}
                onClick={() => set("tarama_sikligi_dk", dk)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                  form.tarama_sikligi_dk === dk
                    ? "bg-nabiz-navy text-white border-nabiz-navy"
                    : disabled
                    ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-600 hover:border-nabiz-navy/40"
                }`}
              >
                {dk === 30 ? "Her 30 dk" : dk === 60 ? "Her 1 saat" : "Her 2 saat"}
                {disabled && <div className="text-[10px] font-normal mt-0.5 text-gray-300">Radar Pro+</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kriz eşiği */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Kriz Alarm Eşiği — <span className="text-nabiz-orange">{form.kriz_esigi}</span> / 10
        </label>
        <input
          type="range" min={1} max={10} value={form.kriz_esigi}
          onChange={e => set("kriz_esigi", Number(e.target.value))}
          className="w-full accent-nabiz-orange"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 — Hassas (çok uyarı)</span>
          <span>10 — Yalnızca kritik</span>
        </div>
      </div>

      {/* Otomatik tetikleme */}
      <div className="flex items-center justify-between px-4 py-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <p className="font-semibold text-nabiz-dark text-sm">Otomatik Tetikleme</p>
          <p className="text-xs text-gray-400">Kurallar tetiklendiğinde tarama başlar</p>
        </div>
        <button
          onClick={() => set("otomatik_tetikleme", !form.otomatik_tetikleme)}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.otomatik_tetikleme ? "bg-nabiz-navy" : "bg-gray-300"}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.otomatik_tetikleme ? "left-7" : "left-1"}`} />
        </button>
      </div>

      {/* Tetikleme kuralları */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">Tetikleme Kuralları</label>
        <div className="flex gap-3 flex-wrap mb-3">
          {["mention>10", "mention>25", "negative>5", "negative>10", "kriz_skoru>7"].map(kural => (
            <button
              key={kural}
              onClick={() => set("tetikleme_kurallari", form.tetikleme_kurallari.includes(kural)
                ? form.tetikleme_kurallari.filter(k => k !== kural)
                : [...form.tetikleme_kurallari, kural]
              )}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                form.tetikleme_kurallari.includes(kural)
                  ? "bg-nabiz-orange/10 border-nabiz-orange text-nabiz-orange"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              {kural}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">Örn: mention&gt;10 = 10 mention geçilince tetikle</p>
      </div>

      {/* Rakipler (Radar Pro+) */}
      <div className={!izinVar("rakip_takibi") ? "opacity-50 pointer-events-none" : ""}>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-semibold text-gray-600">Rakip Takibi</label>
          {!izinVar("rakip_takibi") && <Lock paket="radar_pro" />}
        </div>
        <div className="flex gap-2 mb-2">
          <input
            value={yeniRakip}
            onChange={e => setYeniRakip(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && yeniRakip.trim()) { set("rakipler", [...form.rakipler, yeniRakip.trim()]); setYeniRakip(""); } }}
            placeholder="Rakip kurum/marka adı..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20"
          />
          <button onClick={() => { if (yeniRakip.trim()) { set("rakipler", [...form.rakipler, yeniRakip.trim()]); setYeniRakip(""); } }}
            className="px-4 py-2.5 bg-nabiz-navy text-white text-sm font-semibold rounded-xl hover:opacity-90">
            Ekle
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.rakipler.map(r => (
            <span key={r} className="flex items-center gap-1 px-2 py-1 bg-nabiz-navy/10 text-nabiz-navy text-xs font-semibold rounded-lg">
              {r}
              <button onClick={() => set("rakipler", form.rakipler.filter(x => x !== r))} className="hover:text-nabiz-red ml-1">×</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Adım 5: Raporlama & Bildirimler ─────────────────────────────────
  const adim5 = (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-nabiz-dark">Raporlama</h2>

      <div className="space-y-2">
        <Toggle label="Günlük E-posta Özeti" desc="Her gün belirlenen saatte özet gönderilir"
          value={form.gunluk_email} onChange={v => set("gunluk_email", v)} />
        {form.gunluk_email && (
          <div className="ml-4 flex items-center gap-3">
            <label className="text-sm text-gray-500 font-medium">Gönderim saati:</label>
            <input type="time" value={form.email_saati} onChange={e => set("email_saati", e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
          </div>
        )}

        <Toggle label="Haftalık PDF Rapor" value={form.haftalik_pdf} onChange={v => set("haftalik_pdf", v)} />
        {form.haftalik_pdf && (
          <div className="ml-4 flex items-center gap-3">
            <label className="text-sm text-gray-500 font-medium">Gönderim günü:</label>
            <select value={form.haftalik_pdf_gun} onChange={e => set("haftalik_pdf_gun", e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20">
              {["Pazartesi","Salı","Çarşamba","Perşembe","Cuma"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        )}

        <Toggle label="Aylık Rapor" desc="Aylık kapsamlı analiz raporu"
          value={form.aylik_rapor} onChange={v => set("aylik_rapor", v)}
          locked={!izinVar("aylik_rapor")} lockPaket="radar_pro" />

        <Toggle label="Günlük AI Brifing Notu" desc="Sabah yapay zeka tarafından hazırlanan günlük özet"
          value={form.ai_brifing} onChange={v => set("ai_brifing", v)}
          locked={!izinVar("ai_brifing")} lockPaket="istihbarat" />
        {form.ai_brifing && izinVar("ai_brifing") && (
          <div className="ml-4 flex items-center gap-3">
            <label className="text-sm text-gray-500 font-medium">Brifing saati:</label>
            <input type="time" value={form.ai_brifing_saati} onChange={e => set("ai_brifing_saati", e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
          </div>
        )}
      </div>

      <h2 className="text-lg font-extrabold text-nabiz-dark pt-2">Bildirim Kanalları</h2>
      <div className="space-y-2">
        <Toggle label="Telegram Anlık Bildirim" desc="Kriz ve önemli haberler Telegram'a iletilir"
          value={form.telegram_aktif} onChange={v => set("telegram_aktif", v)}
          locked={!izinVar("telegram_alarm")} lockPaket="radar_pro" />
        {form.telegram_aktif && izinVar("telegram_alarm") && (
          <div className="ml-4">
            <input value={form.telegram_chat_id} onChange={e => set("telegram_chat_id", e.target.value)}
              placeholder="Telegram Chat ID (ör: -1001234567890)"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
          </div>
        )}

        <Toggle label="WhatsApp Özel Kanal" desc="Kritik bildirimler WhatsApp'a iletilir"
          value={form.whatsapp_aktif} onChange={v => set("whatsapp_aktif", v)}
          locked={!izinVar("whatsapp_kanal")} lockPaket="istihbarat" />
        {form.whatsapp_aktif && izinVar("whatsapp_kanal") && (
          <div className="ml-4">
            <input value={form.whatsapp_numara} onChange={e => set("whatsapp_numara", e.target.value)}
              placeholder="+90 5xx xxx xx xx"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nabiz-navy/20" />
          </div>
        )}
      </div>

      <h2 className="text-lg font-extrabold text-nabiz-dark pt-2">AI & Analiz Özellikleri</h2>
      <div className="space-y-2">
        <Toggle label="Duygu Analizi" desc="Haberlerde pozitif/negatif duygu tespiti"
          value={form.duygu_analizi} onChange={v => set("duygu_analizi", v)}
          locked={!izinVar("duygu_analizi")} lockPaket="radar_pro" />
        <Toggle label="Kriz Erken Uyarı" desc="Negatif içerik artışını önceden tespit et"
          value={form.kriz_erken_uyari} onChange={v => set("kriz_erken_uyari", v)}
          locked={!izinVar("kriz_erken_uyari")} lockPaket="radar_pro" />
        <Toggle label="AI Yorum & Analiz" desc="Haberlere yapay zeka yorumu eklenir"
          value={form.ai_yorum} onChange={v => set("ai_yorum", v)}
          locked={!izinVar("ai_yorum")} lockPaket="radar_pro" />
      </div>
    </div>
  );

  // ── Adım 2 (YENİ): Müşteri Tipi ───────────────────────────────────
  const adimTip = (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-nabiz-dark">Müşteri Tipi Seçin</h2>
      <p className="text-sm text-gray-500">Müşteri tipine göre widget yapılandırması otomatik ayarlanır.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {MUSTERI_TIPLERI.map(tip => (
          <button
            key={tip.id}
            onClick={() => {
              set("musteri_tipi", tip.id);
              set("widget_permissions", getDefaultWidgets(tip.id));
            }}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              form.musteri_tipi === tip.id
                ? "border-nabiz-orange bg-nabiz-orange/5 shadow-lg"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <span className="text-3xl">{tip.ikon}</span>
            <h3 className="text-lg font-bold text-nabiz-dark mt-3">{tip.ad}</h3>
            <p className="text-xs text-gray-500 mt-1">{tip.aciklama}</p>
            {form.musteri_tipi === tip.id && (
              <span className="inline-block mt-3 text-xs font-bold text-nabiz-orange">✓ Seçili</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Adım 6 (YENİ): Widget Seçimi ──────────────────────────────────
  const adimWidget = (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-nabiz-dark">Widget Yapılandırması</h2>
      <p className="text-sm text-gray-500">Müşteri panelinde hangi widget&apos;ların görüneceğini seçin. Paket seviyenize göre bazı widget&apos;lar kilitli olabilir.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {WIDGET_TANIMLARI.map(w => {
          const izinli = paketIzinVeriyor(form.paket, w.minPaket === "izleme" ? "haber_takibi" : w.minPaket === "radar_pro" ? "rakip_takibi" : "ai_brifing");
          const aktif = form.widget_permissions[w.id] && izinli;
          return (
            <button
              key={w.id}
              disabled={!izinli}
              onClick={() => {
                if (!izinli) return;
                set("widget_permissions", {
                  ...form.widget_permissions,
                  [w.id]: !form.widget_permissions[w.id],
                });
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                !izinli
                  ? "opacity-40 border-gray-200 bg-gray-50 cursor-not-allowed"
                  : aktif
                    ? "border-nabiz-navy bg-nabiz-navy/5 shadow"
                    : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{w.ikon}</span>
                {!izinli && <Lock paket={w.minPaket} />}
                {izinli && (
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs ${
                    aktif ? "bg-nabiz-navy border-nabiz-navy text-white" : "border-gray-300"
                  }`}>
                    {aktif && "✓"}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-nabiz-dark mt-2">{w.ad}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{w.aciklama}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                {w.kategori}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Adım 6: Özet & Kaydet ────────────────────────────────────────────
  const paket = PAKETLER[form.paket];
  const sosyalAktif = form.sosyal_medya.filter(s => s.aktif);

  const adim6 = basari ? (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
        <svg className="w-10 h-10 text-nabiz-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
      </div>
      <h2 className="text-2xl font-extrabold text-nabiz-dark mb-2">Panel Oluşturuldu!</h2>
      <p className="text-gray-500 mb-6">{form.musteriAd} için {paket.ad} paketi aktif edildi.</p>
      <div className="flex gap-3 justify-center">
        <Link href="/admin/musteriler" className="px-6 py-3 bg-nabiz-navy text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
          Müşteri Listesine Git
        </Link>
        {kaydedilenId && (
          <Link href={`/admin/musteri/${kaydedilenId}`} className="px-6 py-3 bg-nabiz-orange text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            Paneli Görüntüle
          </Link>
        )}
        <button onClick={() => { setForm(DEFAULT_FORM); setAdim(1); setBasari(false); setKaydedilenId(""); }}
          className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
          Yeni Panel Oluştur
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <h2 className="text-lg font-extrabold text-nabiz-dark">Özet & Önizleme (Simülasyon)</h2>
        <button 
          onClick={async () => {
             setPreviewLoading(true);
             try {
                const res = await fetch("/api/admin/customer-panels/preview", { method: "POST", body: JSON.stringify(form) });
                const d = await res.json();
                setPreviewData(d.preview);
             } catch(e) {}
             setPreviewLoading(false);
          }}
          className="bg-nabiz-navy/10 text-nabiz-navy px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-nabiz-navy/20 flex items-center gap-2"
        >
          {previewLoading ? "Simüle ediliyor..." : "🔍 L5 Havuzu Önizlemesi Al"}
        </button>
      </div>

      {previewData && (
        <div className="bg-gradient-to-br from-nabiz-orange/10 to-transparent p-5 rounded-xl border border-nabiz-orange/20 mb-6">
           <h3 className="text-sm font-bold text-nabiz-orange mb-3 flex items-center gap-2">
             ✨ Yapay Zeka & L5 Küratör Projeksiyonu
           </h3>
           <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-white/60 p-3 rounded-lg border border-nabiz-orange/10">
                <p className="text-[10px] uppercase font-bold text-gray-400">Son 7 Günde Gelecek Tahmini Veri</p>
                <p className="text-2xl font-black text-nabiz-dark mt-1">{previewData.projectedMentionsLast7Days} <span className="text-sm font-semibold text-gray-500">adet</span></p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg border border-nabiz-orange/10">
                <p className="text-[10px] uppercase font-bold text-gray-400">Kriz / Yüksek Risk Oranı</p>
                <p className="text-2xl font-black text-red-500 mt-1">%{previewData.crisisPercentage}</p>
              </div>
           </div>
           <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">En Çok Kaynak Eşleşmesi Beklenenler:</p>
              <div className="flex gap-2">
                 {previewData.topSourcesPredicted?.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-white border outline-none text-[10px] font-bold rounded text-gray-600">{s}</span>
                 ))}
              </div>
           </div>
        </div>
      )}
      {[
        {
          baslik: "Müşteri Bilgileri",
          satirlar: [
            ["Müşteri", form.musteriAd || "—"],
            ["Yetkili", form.yetkili || "—"],
            ["E-posta", form.email || "—"],
            ["İl", form.il || "—"],
            ["Paket", paket.ad],
          ],
        },
        {
          baslik: "Kategori & Konular",
          satirlar: [
            ["Kategoriler", form.kategoriler.length > 0 ? form.kategoriler.join(", ") : "Seçilmedi"],
            ["Anahtar kelimeler", form.anahtar_kelimeler.join(", ") || "—"],
            ["Hariç kelimeler", form.haric_kelimeler.join(", ") || "—"],
          ],
        },
        {
          baslik: "Kaynaklar & Platformlar",
          satirlar: [
            ["Haber kaynağı", `${form.haber_kaynaklari.length} kaynak`],
            ["Sosyal medya", sosyalAktif.length > 0 ? sosyalAktif.map(s => s.platform).join(", ") : "Seçilmedi"],
          ],
        },
        {
          baslik: "Tarama & Tetikleme",
          satirlar: [
            ["Tarama sıklığı", `Her ${form.tarama_sikligi_dk} dakikada bir`],
            ["Kriz eşiği", `${form.kriz_esigi} / 10`],
            ["Otomatik tetikleme", form.otomatik_tetikleme ? "Açık" : "Kapalı"],
            ["Rakipler", form.rakipler.join(", ") || "—"],
          ],
        },
        {
          baslik: "Raporlama & Bildirimler",
          satirlar: [
            ["Günlük email", form.gunluk_email ? `Açık — ${form.email_saati}` : "Kapalı"],
            ["Haftalık PDF", form.haftalik_pdf ? `Açık — ${form.haftalik_pdf_gun}` : "Kapalı"],
            ["Aylık rapor", form.aylik_rapor ? "Açık" : "Kapalı"],
            ["Telegram", form.telegram_aktif ? `Açık${form.telegram_chat_id ? ` (${form.telegram_chat_id})` : ""}` : "Kapalı"],
            ["WhatsApp", form.whatsapp_aktif ? `Açık${form.whatsapp_numara ? ` (${form.whatsapp_numara})` : ""}` : "Kapalı"],
            ["AI Brifing", form.ai_brifing ? `Açık — ${form.ai_brifing_saati}` : "Kapalı"],
          ],
        },
      ].map(section => (
        <div key={section.baslik} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-bold text-nabiz-dark">{section.baslik}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {section.satirlar.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-gray-500 font-medium">{k}</span>
                <span className="font-semibold text-nabiz-dark text-right max-w-xs truncate">{v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {hata && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{hata}</div>}
    </div>
  );

  // ── Navigation ──────────────────────────────────────────────────────
  const adimIcerikleri = [adim1, adimTip, adim2, adim3, adim4, adimWidget, adim5, adim6];
  const canNext = adim === 1 ? !!form.musteriAd && !!form.email : true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-8 py-4 flex items-center gap-4">
          <Link href="/admin/musteriler" className="text-gray-400 hover:text-nabiz-dark transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-nabiz-dark">
              {editId ? "Paneli Düzenle" : "Yeni Müşteri Paneli Oluştur"}
            </h1>
            <p className="text-xs text-gray-400">
              Adım {adim} / {ADIMLAR.length} — {ADIMLAR[adim - 1].baslik}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-nabiz-orange transition-all duration-500 rounded-r-full"
            style={{ width: `${(adim / ADIMLAR.length) * 100}%` }} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex gap-8">
        {/* Left stepper */}
        <div className="hidden lg:flex flex-col gap-1 w-48 flex-shrink-0">
          {ADIMLAR.map(a => (
            <button
              key={a.no}
              onClick={() => a.no < adim && setAdim(a.no)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                a.no === adim
                  ? "bg-nabiz-navy text-white"
                  : a.no < adim
                  ? "text-nabiz-navy hover:bg-nabiz-navy/5 cursor-pointer"
                  : "text-gray-400 cursor-default"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                a.no < adim ? "bg-nabiz-green text-white" : a.no === adim ? "bg-white text-nabiz-navy" : "bg-gray-200 text-gray-400"
              }`}>
                {a.no < adim ? "✓" : a.no}
              </div>
              <span className="text-xs font-semibold truncate">{a.baslik}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[400px]">
            {adimIcerikleri[adim - 1]}
          </div>

          {/* Navigation butonları */}
          {!basari && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setAdim(a => Math.max(1, a - 1))}
                disabled={adim === 1}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:text-nabiz-dark disabled:opacity-40 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
                </svg>
                Geri
              </button>

              {adim < ADIMLAR.length ? (
                <button
                  onClick={() => setAdim(a => Math.min(ADIMLAR.length, a + 1))}
                  disabled={!canNext}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-nabiz-orange text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-md shadow-nabiz-orange/20"
                >
                  İleri
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={kaydet}
                  disabled={kaydetme}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-nabiz-green text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-md shadow-green-500/20"
                >
                  {kaydetme ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                      </svg>
                      Paneli Oluştur
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PanelOlusturPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-3 border-nabiz-orange border-t-transparent rounded-full animate-spin" /></div>}>
      <PanelOlusturInner />
    </Suspense>
  );
}
