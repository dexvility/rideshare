import nodemailer from 'nodemailer';
import { prisma } from './prisma';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

async function getThemeColors(): Promise<{ primary: string; appName: string; heroEmoji: string }> {
  try {
    const theme = await prisma.themeConfig.findUnique({ where: { id: 1 } });
    if (theme?.config) {
      const cfg = theme.config as Record<string, string>;
      return {
        primary: cfg.colorPrimary ?? '#2d5016',
        appName: cfg.appName ?? 'Rideshare',
        heroEmoji: cfg.heroEmoji ?? '🚗',
      };
    }
  } catch {}
  return { primary: '#2d5016', appName: 'Rideshare', heroEmoji: '🚗' };
}

export async function sendVerificationEmail(to: string, token: string, appUrl: string) {
  const { primary, appName, heroEmoji } = await getThemeColors();
  const url = `${appUrl}/auth/verify-email?token=${token}`;
  const html = brandedEmail({ primary, appName, heroEmoji }, {
    title: 'Verify your email',
    body: 'Click the button below to verify your email address and activate your account.',
    ctaText: 'Verify email',
    ctaUrl: url,
  });
  await sendMail(to, `[${appName}] Verify your email`, html);
}

export async function sendPasswordResetEmail(to: string, token: string, appUrl: string) {
  const { primary, appName, heroEmoji } = await getThemeColors();
  const url = `${appUrl}/auth/reset-password?token=${token}`;
  const html = brandedEmail({ primary, appName, heroEmoji }, {
    title: 'Reset your password',
    body: 'Click the button below to set a new password. This link expires in 1 hour.',
    ctaText: 'Reset password',
    ctaUrl: url,
  });
  await sendMail(to, `[${appName}] Reset your password`, html);
}

function brandedEmail(
  theme: { primary: string; appName: string; heroEmoji: string },
  content: { title: string; body: string; ctaText: string; ctaUrl: string },
): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:${theme.primary};padding:24px 32px;text-align:center;">
            <div style="font-size:2rem;">${theme.heroEmoji}</div>
            <div style="color:#ffffff;font-size:1.25rem;font-weight:700;margin-top:4px;">${theme.appName}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:1.4rem;color:#1a1a1a;">${content.title}</h1>
            <p style="margin:0 0 28px;font-size:0.95rem;color:#555;line-height:1.6;">${content.body}</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:${theme.primary};">
                  <a href="${content.ctaUrl}"
                     style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:0.95rem;font-weight:600;text-decoration:none;border-radius:6px;">
                    ${content.ctaText}
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:0.8rem;color:#999;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:0.75rem;color:#aaa;">${theme.appName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
