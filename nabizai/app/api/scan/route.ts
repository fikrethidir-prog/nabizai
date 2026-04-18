import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  // Production'da Python script çalıştırılamaz — Vercel serverless ortam
  if (isSupabaseMode()) {
    return NextResponse.json({
      status: 'unavailable',
      message: 'Manuel tarama sadece lokal geliştirme ortamında kullanılabilir. Production\'da otomatik cron ile çalışır.',
      new_items: 0,
    });
  }

  // Lokal modda Python agent çalıştır
  const { spawn } = require('child_process');
  const path = require('path');
  const PROJECT_ROOT = path.join(process.cwd(), '..');
  const PYTHON = path.join(PROJECT_ROOT, '.venv', 'Scripts', 'python.exe');
  const SCRIPT = path.join(PROJECT_ROOT, 'src', 'agents', 'agent_ingestion.py');

  return new Promise<NextResponse>((resolve) => {
    let output = '';
    let errorOut = '';

    const child = spawn(PYTHON, [SCRIPT], {
      cwd: PROJECT_ROOT,
      env: { ...process.env },
    });

    child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { errorOut += d.toString(); });

    child.on('close', (code: number) => {
      const match = output.match(/Total new items ingested:\s*(\d+)/i);
      const new_items = match ? parseInt(match[1]) : 0;

      if (code === 0) {
        resolve(NextResponse.json({ status: 'done', new_items, output }));
      } else {
        resolve(
          NextResponse.json(
            { status: 'error', new_items: 0, output, error: errorOut },
            { status: 500 }
          )
        );
      }
    });

    setTimeout(() => {
      child.kill();
      resolve(NextResponse.json({ status: 'timeout', new_items: 0 }, { status: 408 }));
    }, 60000);
  });
}
