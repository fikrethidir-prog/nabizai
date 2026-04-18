import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { spawn } from 'child_process';
import path from 'path';

const PROJECT_ROOT = path.join(process.cwd(), '..');

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== 'admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const platform = req.nextUrl.searchParams.get('platform') || 'instagram';
  const query = req.nextUrl.searchParams.get('query') || 'bodrum';

  return new Promise<NextResponse>((resolve) => {
    let output = '';
    const child = spawn('python', [
      '-c',
      `import sys; sys.path.insert(0, 'src'); from agents.agent_social import SocialAgent; import json; a = SocialAgent(); print(json.dumps(a.run('${platform}','${query}'), ensure_ascii=False))`,
    ], { cwd: PROJECT_ROOT });

    child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
    child.stderr.on('data', () => {});
    child.on('close', (code) => {
      try {
        // Son satırı JSON olarak parse et
        const lines = output.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        const data = JSON.parse(jsonLine);
        resolve(NextResponse.json({ platform, query, data, demo: !process.env.APIFY_API_KEY }));
      } catch {
        resolve(NextResponse.json({ platform, query, data: [], error: 'Parse hatası', raw: output.slice(0, 500) }));
      }
    });

    setTimeout(() => { child.kill(); resolve(NextResponse.json({ error: 'Timeout' }, { status: 408 })); }, 30000);
  });
}
