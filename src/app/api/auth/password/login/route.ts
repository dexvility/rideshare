import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AUTH_MODE } from '@/lib/auth-config';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  if (AUTH_MODE !== 'password') {
    return NextResponse.json({ error: 'Password auth is disabled' }, { status: 403 });
  }

  const { email, password } = await req.json();
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'fillRequired' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  // Distinguish "no account" from "account exists but no password (Google user)"
  if (!user) {
    return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
  }
  if (!user.passwordHash) {
    return NextResponse.json({ error: 'useGoogleLogin' }, { status: 400 });
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'invalidCredentials' }, { status: 401 });
  }

  const sessionId = await createSession(user.id);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set('rideshare_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
