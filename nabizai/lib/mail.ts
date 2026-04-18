/**
 * Mail gönderme — Resend entegrasyonu
 * RESEND_API_KEY env değişkeni gerekli
 * Ücretsiz plan: 100 mail/gün, 3000/ay
 */

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('your_')) return null;
  const { Resend } = require('resend');
  return new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM || 'nabizai <noreply@nabizai.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fikrethidir@gmail.com';

// ── Demo talebi gelince admin'e bildir ──────────────────────────────
export async function mailDemoTalebiGeldi(talep: {
  ad: string; kurum: string; email: string; telefon?: string; sektor: string; mesaj?: string;
}) {
  const resend = getResend();
  if (!resend) { console.log('[Mail] RESEND_API_KEY yok, mail atlanıyor'); return; }

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🆕 Yeni Demo Talebi: ${talep.ad} — ${talep.kurum}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a;margin-bottom:4px">Yeni Demo Talebi</h2>
        <p style="color:#64748b;margin-top:0;font-size:14px">nabizai.com üzerinden yeni bir demo talebi geldi.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:14px">
          ${[
            ['Ad Soyad', talep.ad],
            ['Kurum', talep.kurum],
            ['E-posta', talep.email],
            ['Telefon', talep.telefon || '—'],
            ['Sektör', talep.sektor],
          ].map(([k, v]) => `
            <tr>
              <td style="padding:10px 12px;background:#f8fafc;font-weight:600;color:#475569;width:120px;border-bottom:1px solid #e2e8f0">${k}</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">${v}</td>
            </tr>
          `).join('')}
          ${talep.mesaj ? `
            <tr>
              <td style="padding:10px 12px;background:#f8fafc;font-weight:600;color:#475569;vertical-align:top;border-bottom:1px solid #e2e8f0">Mesaj</td>
              <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a">${talep.mesaj}</td>
            </tr>
          ` : ''}
        </table>
        <a href="https://nabizai.com/admin/demo-talepleri"
           style="display:inline-block;margin-top:20px;padding:10px 20px;background:#f97316;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Admin Panelinde Gör →
        </a>
      </div>
    `,
  });
}

// ── Kullanıcı oluşturulunca kullanıcıya bilgi maili ─────────────────
export async function mailKullaniciBilgi(kullanici: {
  ad: string; email: string; sifre: string; panel_url?: string;
}) {
  const resend = getResend();
  if (!resend) { console.log('[Mail] RESEND_API_KEY yok, mail atlanıyor'); return; }

  await resend.emails.send({
    from: FROM,
    to: kullanici.email,
    subject: 'nabızai — Hesabınız Hazır',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a">Merhaba ${kullanici.ad},</h2>
        <p style="color:#475569;font-size:15px">
          nabızai medya takip sisteminize erişiminiz hazırlandı. Aşağıdaki bilgilerle giriş yapabilirsiniz.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:14px"><strong>E-posta:</strong> ${kullanici.email}</p>
          <p style="margin:0;font-size:14px"><strong>Şifre:</strong>
            <code style="background:#fff;border:1px solid #e2e8f0;padding:2px 8px;border-radius:6px;font-size:14px">${kullanici.sifre}</code>
          </p>
        </div>
        <a href="${kullanici.panel_url || 'https://nabizai.com/login'}"
           style="display:inline-block;padding:12px 24px;background:#0f172a;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Sisteme Giriş Yap →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          Giriş yaptıktan sonra şifrenizi değiştirebilirsiniz.
        </p>
      </div>
    `,
  });
}

// ── Şifre sıfırlama maili (admin manuel sıfırladığında) ─────────────
export async function mailSifreSifirla(kullanici: {
  ad: string; email: string; yeni_sifre: string;
}) {
  const resend = getResend();
  if (!resend) { console.log('[Mail] RESEND_API_KEY yok, mail atlanıyor'); return; }

  await resend.emails.send({
    from: FROM,
    to: kullanici.email,
    subject: 'nabızai — Şifreniz Güncellendi',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0f172a">Merhaba ${kullanici.ad},</h2>
        <p style="color:#475569;font-size:15px">Hesabınızın şifresi güncellendi.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0;font-size:14px"><strong>Yeni Şifre:</strong>
            <code style="background:#fff;border:1px solid #e2e8f0;padding:2px 8px;border-radius:6px;font-size:14px">${kullanici.yeni_sifre}</code>
          </p>
        </div>
        <a href="https://nabizai.com/login"
           style="display:inline-block;padding:12px 24px;background:#0f172a;color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Giriş Yap →
        </a>
      </div>
    `,
  });
}
