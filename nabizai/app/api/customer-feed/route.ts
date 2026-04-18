import { NextResponse } from "next/server";
import { getNews } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const panel_id = searchParams.get("panel_id");

  if (!panel_id) {
    return NextResponse.json({ error: "panel_id gerekli" }, { status: 400 });
  }

  let items: any[] = [];
  try {
    const result = await getNews({ limit: 400 }); 
    items = result.items || [];
  } catch(e) {
    items = [];
  }

  // Demo Panel i Bodrum Belediyesi olsun
  const isBodrum = panel_id === "demo-belediye";
  const validKeywords = ["bodrum", "mandalinci", "ahmet aras"];

  const filteredForCustomer = items.filter((item: any) => {
    if (isBodrum) {
      const meta = item.metadata || {};
      if (meta.district_id === "bodrum") return true;
      if (item.source && item.source.toLowerCase().includes("bodrum")) return true;
      
      const text = `${item.title} ${item.content}`.toLowerCase();
      if (validKeywords.some(kw => text.includes(kw))) return true;
      return false;
    }
    return true; // For other panels, return all for now or do specific logic
  }).slice(0, 50).map((item: any) => ({
    ...item,
    match_reason: { score: item.metadata?.reklam_esdegeri ? 8.5 : 5.0, matched: ["Özel Kurallar"] },
    is_highlighted: (item.metadata?.reklam_esdegeri || 0) > 6000
  }));

  return NextResponse.json({ items: filteredForCustomer });
}
