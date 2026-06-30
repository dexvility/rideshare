import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { AUTH_MODE } from '@/lib/auth-config';
import { isValidPhone } from '@/lib/validate';
import { randomUUID } from 'crypto';

function generateNickname(realName: string): string {
  const base = realName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'guest';
  const suffix = randomUUID().slice(0, 6);
  return `${base}_${suffix}`;
}

export async function POST(req: NextRequest) {
  if (AUTH_MODE !== 'phone') {
    return NextResponse.json({ error: 'Phone auth is disabled' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { action, realName, phone } = body;

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: 'invalidPhone' }, { status: 400 });
    }

    if (action === 'login') {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
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

    if (action === 'register') {
      const { hasSms, hasTelegram, hasWhatsapp, hasSignal, preferredIM } = body;

      if (await prisma.user.findUnique({ where: { phone } })) {
        return NextResponse.json({ error: 'phoneExists' }, { status: 409 });
      }

      let nickname = generateNickname(realName || 'guest');
      // Extremely unlikely collision, but loop just in case
      while (await prisma.user.findUnique({ where: { nickname } })) {
        nickname = generateNickname(realName || 'guest');
      }

      const user = await prisma.user.create({
        data: {
          nickname,
          realName,
          phone,
          email: null,
          hasSms: !!hasSms,
          hasTelegram: !!hasTelegram,
          hasWhatsapp: !!hasWhatsapp,
          hasSignal: !!hasSignal,
          preferredIM: preferredIM || null,
        },
      });

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

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
