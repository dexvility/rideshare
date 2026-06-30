import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GOOGLE_ENABLED } from '@/lib/auth-config';
import { exchangeGoogleCode } from '@/lib/google-oidc';
import { createSession } from '@/lib/session';
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

export async function GET(req: NextRequest) {
  if (!GOOGLE_ENABLED) return NextResponse.json({ error: 'Google auth is disabled' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const savedState = req.cookies.get('google_oauth_state')?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/auth?error=oauth_state', req.url));
  }

  let profile;
  try {
    profile = await exchangeGoogleCode(code);
  } catch (e) {
    console.error('Google token exchange failed:', e);
    return NextResponse.redirect(new URL('/auth?error=oauth_failed', req.url));
  }

  // Find or create user
  let user = await prisma.user.findFirst({
    where: { oidcAccounts: { some: { provider: 'google', sub: profile.sub } } },
  });

  if (!user) {
    // Check if email already exists (link the account)
    user = await prisma.user.findUnique({ where: { email: profile.email } }) ?? null;

    if (user) {
      // Link Google to existing account
      await prisma.oidcAccount.create({
        data: { userId: user.id, provider: 'google', sub: profile.sub },
      });
      if (!user.emailVerified && profile.emailVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
      }
    } else {
      // Brand-new user via Google
      let nickname = generateNickname(profile.name);
      while (await prisma.user.findUnique({ where: { nickname } })) {
        nickname = generateNickname(profile.name);
      }

      user = await prisma.user.create({
        data: {
          nickname,
          realName: profile.name,
          email: profile.email,
          emailVerified: profile.emailVerified,
          profileComplete: false,
          oidcAccounts: { create: { provider: 'google', sub: profile.sub } },
        },
      });
    }
  }

  const sessionId = await createSession(user.id);
  const destination = user.profileComplete ? '/' : '/auth/complete-profile';
  const res = NextResponse.redirect(new URL(destination, req.url));

  res.cookies.set('rideshare_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  res.cookies.delete('google_oauth_state');
  return res;
}
