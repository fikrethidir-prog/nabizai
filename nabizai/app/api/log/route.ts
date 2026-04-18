import { NextRequest, NextResponse } from 'next/server';
import { getLogs, appendLog } from '@/lib/db';

// GET — logları filtreli getir
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eylem = searchParams.get('eylem');
  const limit = parseInt(searchParams.get('limit') || '200');

  try {
    let entries = await getLogs(limit);

    if (eylem) entries = entries.filter((e: Record<string,unknown>) => e.eylem === eylem);

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}

// POST — yeni log satırı ekle (client-side eylemler için)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await appendLog(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
