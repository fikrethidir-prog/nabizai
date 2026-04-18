/**
 * logHelper.ts — db.ts üzerinden log yazar
 * Eski API uyumluluğu için wrapper
 */
import { appendLog as dbAppendLog } from '@/lib/db';
import type { Rol } from '@/lib/auth';

export interface LogEntry {
  kullanici_id: string;
  ad: string;
  rol: Rol;
  eylem: string;
  musteri_id?: string;
  detay: Record<string, unknown>;
}

export async function appendLog(entry: LogEntry): Promise<void> {
  await dbAppendLog({
    kullanici_id: entry.kullanici_id,
    ad: entry.ad,
    rol: entry.rol,
    eylem: entry.eylem,
    detay: entry.detay,
  });
}
