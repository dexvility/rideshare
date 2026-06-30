import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_MODE } from '@/lib/auth-config';
import { hashPassword, isStrongPassword } from '@/lib/password';
import { isValidEmail } from '@/lib/validate';
import { createSession } from '@/lib/session';
import { createVerificationToken } from '@/lib/verification-token';
import { sendVerificationEmail } from '@/lib/mail';
import { randomUUID } from 'crypto';

function generateNickname(realName: string): string {
  const base = realName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'guest';
  return `${base}_${randomUUID().slice(0, 6)}`;
}

export async function POST(req: NextRequest) {
  if (AUTH_MODE !== 'password') {
    return NextResponse.json({ error: 'Password auth is disabled' }, { status: 403 });
  }

  const { realName, email, password } = await req.json();

  if (!realName?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'fillRequired' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalidEmail' }, { status: 400 });
  }
  if (!isStrongPassword(password)) {
    return NextResponse.json({ error: 'passwordTooWeak' }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) {
    return NextResponse.json({ error: 'emailExists' }, { status: 409 });
  }

  let nickname = generateNickname(realName);
  while (await prisma.user.findUnique({ where: { nickname } })) {
    nickname = generateNickname(realName);
  }

  const user = await prisma.user.create({
    data: {
      nickname,
      realName: realName.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      emailVerified: false,
    },
  });

  // Send verification email (non-blocking — don't fail registration if SMTP is misconfigured)
  const appUrl = process.env.APP_URL ?? `https://${req.headers.get('host')}`;
  try {
    const token = await createVerificationToken(user.id, 'email_verify', 24 * 60);
    await sendVerificationEmail(normalizedEmail, token, appUrl);
  } catch (e) {
    console.error('Failed to send verification email:', e);
  }

  const sessionId = await createSession(user.id);
  const res = NextResponse.json({ ok: true, user }, { status: 201 });
  res.cookies.set('rideshare_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
