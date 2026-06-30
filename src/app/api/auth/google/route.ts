import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_ENABLED } from '@/lib/auth-config';
import { getGoogleAuthUrl } from '@/lib/google-oidc';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  if (!GOOGLE_ENABLED) return NextResponse.json({ error: 'Google auth is disabled' }, { status: 403 });

  const state = randomBytes(16).toString('hex');
  const url = getGoogleAuthUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  });
  return res;
}
