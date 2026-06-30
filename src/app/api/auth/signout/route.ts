import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get('rideshare_session')?.value;
  if (sessionId) {
    try { await prisma.session.delete({ where: { id: sessionId } }); } catch {}
  }
  const res = NextResponse.redirect(new URL('/auth', req.url));
  res.cookies.set('rideshare_session', '', { maxAge: 0, path: '/' });
  return res;
}
