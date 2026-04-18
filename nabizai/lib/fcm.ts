/**
 * FCM Push Bildirim Modülü (Scaffold)
 * Firebase credentials eklenince gerçek push gönderir,
 * yoksa console.log ile simüle eder.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TOKENS_FILE = join(process.cwd(), '..', 'data', 'fcm_tokens.json');

export function isFCMConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

function getTokens(): Array<{ musteri_id: string; fcm_token: string; platform: string }> {
  if (!existsSync(TOKENS_FILE)) return [];
  try { return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8')); } catch { return []; }
}

export async function sendPush(fcmToken: string, title: string, body: string): Promise<boolean> {
  if (!isFCMConfigured()) {
    console.log(`[FCM-SIMÜLASYON] → ${fcmToken.slice(0, 20)}... | ${title}: ${body}`);
    return true;
  }

  try {
    // firebase-admin dinamik import (sadece credentials varsa)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
    });
    return true;
  } catch (err) {
    console.error('[FCM] Gönderim hatası:', err);
    return false;
  }
}

export async function sendPushToClient(
  musteriId: string,
  title: string,
  body: string
): Promise<{ sent: number; failed: number; simulated: boolean }> {
  const tokens = getTokens().filter(t => t.musteri_id === musteriId);
  const simulated = !isFCMConfigured();
  let sent = 0, failed = 0;

  for (const t of tokens) {
    const ok = await sendPush(t.fcm_token, title, body);
    if (ok) sent++; else failed++;
  }

  return { sent, failed, simulated };
}
