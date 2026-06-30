import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(session.user);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { nickname, realName, phone, email, hasSms, hasTelegram, hasWhatsapp, hasSignal, preferredIM, notifyOffers, notifyRequests } = body;

  if (nickname && nickname !== session.user.nickname) {
    const existing = await prisma.user.findUnique({ where: { nickname } });
    if (existing) return NextResponse.json({ error: 'nicknameExists' }, { status: 409 });
  }
  // Phone uniqueness check (can't steal another user's phone)
  if (phone && phone !== session.user.phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return NextResponse.json({ error: 'phoneExists' }, { status: 409 });
  }
  const normalizedEmail = email === '' ? null : email;
  if (normalizedEmail && normalizedEmail !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return NextResponse.json({ error: 'emailExists' }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(realName !== undefined && { realName }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email: normalizedEmail }),
      ...(hasSms !== undefined && { hasSms }),
      ...(hasTelegram !== undefined && { hasTelegram }),
      ...(hasWhatsapp !== undefined && { hasWhatsapp }),
      ...(hasSignal !== undefined && { hasSignal }),
      ...(preferredIM !== undefined && { preferredIM }),
      ...(notifyOffers !== undefined && { notifyOffers }),
      ...(notifyRequests !== undefined && { notifyRequests }),
    },
  });

  return NextResponse.json(updated);
}
