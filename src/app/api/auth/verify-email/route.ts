import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consumeVerificationToken } from '@/lib/verification-token';
import { redirectTo } from '@/lib/request-url';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const userId = await consumeVerificationToken(token, 'email_verify');
  if (!userId) {
    return NextResponse.json({ error: 'invalidToken' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  return NextResponse.redirect(redirectTo('/?verified=1', req));
}
