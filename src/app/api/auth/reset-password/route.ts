import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_MODE } from '@/lib/auth-config';
import { createVerificationToken, consumeVerificationToken } from '@/lib/verification-token';
import { sendPasswordResetEmail } from '@/lib/mail';
import { hashPassword, isStrongPassword } from '@/lib/password';
import { isValidEmail } from '@/lib/validate';

// POST /api/auth/reset-password — request a reset link
export async function POST(req: NextRequest) {
  if (AUTH_MODE !== 'password') {
    return NextResponse.json({ error: 'Password auth is disabled' }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: 'fillRequired' }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ ok: true }); // silent: don't reveal format errors

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Always return 200 to avoid leaking whether the email is registered
  if (user) {
    const appUrl = process.env.APP_URL ?? `https://${req.headers.get('host')}`;
    try {
      const token = await createVerificationToken(user.id, 'password_reset', 60);
      await sendPasswordResetEmail(user.email!, token, appUrl);
    } catch (e) {
      console.error('Failed to send reset email:', e);
    }
  }

  return NextResponse.json({ ok: true });
}

// PUT /api/auth/reset-password — confirm with token + new password
export async function PUT(req: NextRequest) {
  if (AUTH_MODE !== 'password') {
    return NextResponse.json({ error: 'Password auth is disabled' }, { status: 403 });
  }

  const { token, newPassword } = await req.json();
  if (!token || !newPassword) return NextResponse.json({ error: 'fillRequired' }, { status: 400 });
  if (!isStrongPassword(newPassword)) {
    return NextResponse.json({ error: 'passwordTooWeak' }, { status: 400 });
  }

  const userId = await consumeVerificationToken(token, 'password_reset');
  if (!userId) return NextResponse.json({ error: 'invalidToken' }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
