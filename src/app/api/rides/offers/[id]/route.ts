import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyPersonal } from '@/lib/ntfy';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: { include: { user: true, coPassengers: true } } },
  });
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(offer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: { include: { user: true } } },
  });
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (offer.driverId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.rideOffer.update({
    where: { id: params.id },
    data: {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
      fee: body.fee !== undefined ? parseFloat(body.fee) : undefined,
    },
    include: { driver: true },
  });

  const routeInfo = {
    from: updated.fromAddress, to: updated.toAddress,
    date: updated.date.toLocaleDateString('cs-CZ'),
    time: updated.departureTime,
    otherParty: updated.driver.realName,
  };

  // Notify each passenger on their personal topic
  await Promise.all(offer.joins.map(j =>
    notifyPersonal(j.userId, { event: 'offer_updated', rideId: params.id, rideType: 'offer', ...routeInfo })
  ));

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: { include: { user: true } } },
  });
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (offer.driverId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.rideOffer.update({ where: { id: params.id }, data: { isCancelled: true } });

  const routeInfo = {
    from: offer.fromAddress, to: offer.toAddress,
    date: offer.date.toLocaleDateString('cs-CZ'),
    time: offer.departureTime,
    otherParty: offer.driver.realName,
  };

  await Promise.all(offer.joins.map(j =>
    notifyPersonal(j.userId, { event: 'offer_cancelled', rideId: params.id, rideType: 'offer', ...routeInfo })
  ));

  return NextResponse.json({ ok: true });
}
