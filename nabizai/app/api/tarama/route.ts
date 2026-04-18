import { NextRequest, NextResponse } from 'next/server';
import { appendLog } from '@/lib/db';
import { sessionDogrula, COOKIE_NAME } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

async function getSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return sessionDogrula(token);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  // Production'da müşteri bazlı Python tarama çalıştırılamaz
  if (isSupabaseMode()) {
    return NextResponse.json({
      status: 'unavailable',
      message: 'Müşteri bazlı tarama sadece lokal ortamda kullanılabilir.',
    });
  }

  try {
    const { spawn } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    const { musteri_id, mod = 'haber' } = await req.json();
    if (!musteri_id) return NextResponse.json({ error: 'musteri_id gerekli' }, { status: 400 });

    const PROJECT_ROOT = path.join(process.cwd(), '..');
    const CONFIGS_DIR = path.join(PROJECT_ROOT, 'data', 'musteri_configs');
    const configPath = path.join(CONFIGS_DIR, `${path.basename(musteri_id)}.json`);

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'Müşteri config dosyası bulunamadı' }, { status: 404 });
    }

    await appendLog({
      kullanici_id: session.kullanici_id,
      ad: session.ad,
      rol: session.rol,
      eylem: 'tarama_baslat',
      detay: { musteri_id, mod },
    });

    // Streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const pyScript = path.join(PROJECT_ROOT, 'src', 'run_for_musteri.py');
    const child = spawn('python', [pyScript, '--config', configPath, '--mod', mod], {
      cwd: PROJECT_ROOT,
    });

    child.stdout.on('data', (chunk: Buffer) => {
      writer.write(encoder.encode(chunk.toString()));
    });
    child.stderr.on('data', (chunk: Buffer) => {
      writer.write(encoder.encode('[HATA] ' + chunk.toString()));
    });
    child.on('close', async (code: number) => {
      writer.write(encoder.encode(`\n[TAMAMLANDI — çıkış kodu: ${code}]\n`));
      writer.close();
      await appendLog({
        kullanici_id: session.kullanici_id,
        ad: session.ad,
        rol: session.rol,
        eylem: 'tarama_tamamlandi',
        detay: { musteri_id, mod, exit_code: code },
      });
    });
    child.on('error', async (err: Error) => {
      writer.write(encoder.encode(`[Python bulunamadı veya script hatası: ${err.message}]\n`));
      writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
