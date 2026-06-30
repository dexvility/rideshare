import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyRide } from '@/lib/ntfy';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const offer = await prisma.rideOffer.findUnique({ where: { id: params.id } });
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

  await notifyRide({
    kind: 'offer', action: 'updated',
    from: updated.fromAddress, to: updated.toAddress,
    date: updated.date.toLocaleDateString('cs-CZ'),
    time: updated.departureTime,
    driverOrRequester: updated.driver.realName,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const offer = await prisma.rideOffer.findUnique({ where: { id: params.id }, include: { driver: true } });
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (offer.driverId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.rideOffer.update({ where: { id: params.id }, data: { isCancelled: true } });

  await notifyRide({
    kind: 'offer', action: 'cancelled',
    from: offer.fromAddress, to: offer.toAddress,
    date: offer.date.toLocaleDateString('cs-CZ'),
    time: offer.departureTime,
    driverOrRequester: offer.driver.realName,
  });

  return NextResponse.json({ ok: true });
}
