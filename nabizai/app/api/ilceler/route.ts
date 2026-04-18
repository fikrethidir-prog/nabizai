import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// `data` klasörü nabizai klasörünün bir üstünde bulunur
const ILCE_FILE = path.join(process.cwd(), "..", "data", "mugla_ilceleri.json");

function getIlceler() {
  if (!fs.existsSync(ILCE_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ILCE_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export async function GET() {
  return NextResponse.json(getIlceler());
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    fs.writeFileSync(ILCE_FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
