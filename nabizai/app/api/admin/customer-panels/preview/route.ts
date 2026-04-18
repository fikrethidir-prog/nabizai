import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const config = await req.json();
  
  // L5 Müşteri Başına Küratör Simülasyonu
  // Supabase'den `raw_mentions` tablosunda son 7 güne ait, 
  // secili `districts` içindeki ve keywords/excluded_keywords
  // eşleşen ham verilerin sayısını/önizlemesini döndürür.
  
  const mockSimulation = {
    projectedMentionsLast7Days: Math.floor(Math.random() * 500) + 50,
    crisisPercentage: 5.2,
    topSourcesPredicted: ["Bodrum Gündem", "Kent TV", "X (Twitter)"],
    message: "Konfigürasyon (Anahtar kelime ve İlçe filtresi) başarıyla simüle edildi."
  };

  return NextResponse.json({ preview: mockSimulation });
}
