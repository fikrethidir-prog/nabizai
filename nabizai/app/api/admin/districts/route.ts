import { NextResponse } from "next/server";

export async function GET() {
  // Demo API Mock for Districts
  // The actual implementation will fetch from Supabase `districts` table overlaid with `sources` counting logic
  const mockDistricts = [
    { slug: "bodrum", name: "Bodrum", sources_count: 15, active: true },
    { slug: "fethiye", name: "Fethiye", sources_count: 12, active: true },
    { slug: "milas", name: "Milas", sources_count: 8, active: true },
    { slug: "mentese", name: "Menteşe", sources_count: 5, active: true },
    { slug: "buyuksehir", name: "Büyükşehir Belediyesi", sources_count: 32, active: true },
  ];

  return NextResponse.json({ districts: mockDistricts });
}

export async function POST(req: Request) {
  const data = await req.json();
  // Supabase INSERT logic for regions/districts would go here
  return NextResponse.json({ success: true, inserted: data });
}
