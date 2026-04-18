/**
 * Cron Tarama Modülü — müşteri bazlı otomatik tarama zamanlayıcısı
 */
import cron from 'node-cron';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_ROOT = join(process.cwd(), '..', 'data');
const PROJECT_ROOT = join(process.cwd(), '..');
const CONFIGS_DIR = join(DATA_ROOT, 'musteri_configs');
const PANELLER_FILE = join(DATA_ROOT, 'musteri_panelleri.json');
const STATE_FILE = join(DATA_ROOT, 'cron_state.json');

interface CronState {
  aktif: boolean;
  baslamaZamani: string | null;
  musteriler: Record<string, {
    sonCalismaTarihi: string | null;
    hataSayisi: number;
    durum: 'bekliyor' | 'calisiyor' | 'tamamlandi' | 'hata';
  }>;
}

let cronTask: ReturnType<typeof cron.schedule> | null = null;
let state: CronState = { aktif: false, baslamaZamani: null, musteriler: {} };

function loadState(): CronState {
  if (existsSync(STATE_FILE)) {
    try { return JSON.parse(readFileSync(STATE_FILE, 'utf-8')); } catch {}
  }
  return { aktif: false, baslamaZamani: null, musteriler: {} };
}

function saveState() {
  try { writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8'); } catch {}
}

function getMusteriler(): Array<{ id: string; taramaSikligi?: number; aktif?: boolean }> {
  if (!existsSync(PANELLER_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PANELLER_FILE, 'utf-8'));
  } catch { return []; }
}

function runScanForMusteri(musteriId: string, mod = 'haber') {
  const configPath = join(CONFIGS_DIR, `${musteriId}.json`);
  if (!existsSync(configPath)) {
    console.log(`[CRON] Config bulunamadı: ${musteriId}`);
    return;
  }

  state.musteriler[musteriId] = state.musteriler[musteriId] || { sonCalismaTarihi: null, hataSayisi: 0, durum: 'bekliyor' };
  state.musteriler[musteriId].durum = 'calisiyor';
  saveState();

  const pyScript = join(PROJECT_ROOT, 'src', 'run_for_musteri.py');
  const child = spawn('python', [pyScript, '--config', configPath, '--mod', mod], {
    cwd: PROJECT_ROOT,
  });

  child.on('close', (code) => {
    const now = new Date().toISOString();
    if (code === 0) {
      state.musteriler[musteriId].durum = 'tamamlandi';
      state.musteriler[musteriId].sonCalismaTarihi = now;
    } else {
      state.musteriler[musteriId].durum = 'hata';
      state.musteriler[musteriId].hataSayisi++;
    }
    saveState();
    console.log(`[CRON] ${musteriId} tarama ${code === 0 ? 'tamamlandı' : 'hata'} (code: ${code})`);
  });
}

function runAllScans() {
  const musteriler = getMusteriler();
  console.log(`[CRON] ${musteriler.length} müşteri taranıyor...`);
  for (const m of musteriler) {
    if (m.aktif !== false) {
      runScanForMusteri(m.id);
    }
  }
}

export function startCron() {
  state = loadState();
  if (cronTask) return;

  // Her 30 dakikada bir tüm aktif müşterileri tara
  cronTask = cron.schedule('*/30 * * * *', () => {
    console.log(`[CRON] Zamanlanmış tarama tetiklendi: ${new Date().toISOString()}`);
    runAllScans();
  });

  state.aktif = true;
  state.baslamaZamani = new Date().toISOString();
  saveState();
  console.log('[CRON] Otomatik tarama başlatıldı (her 30 dakika)');
}

export function stopCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
  state.aktif = false;
  saveState();
  console.log('[CRON] Otomatik tarama durduruldu');
}

export function triggerNow() {
  console.log('[CRON] Manuel tetikleme...');
  runAllScans();
}

export function getCronState(): CronState {
  return state;
}
