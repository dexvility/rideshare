import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyPersonal } from '@/lib/ntfy';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const request = await prisma.rideRequest.findUnique({
    where: { id: params.id },
    include: { requester: true },
  });
  if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const request = await prisma.rideRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (request.requesterId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.rideRequest.update({
    where: { id: params.id },
    data: { ...body, date: body.date ? new Date(body.date) : undefined },
    include: { requester: true },
  });

  // If a driver already confirmed this request, notify them
  if (request.isFulfilled && request.fulfilledByOfferId) {
    const fulfillingOffer = await prisma.rideOffer.findUnique({ where: { id: request.fulfilledByOfferId } });
    if (fulfillingOffer) {
      await notifyPersonal(fulfillingOffer.driverId, {
        event: 'request_updated',
        rideId: params.id, rideType: 'request',
        from: updated.fromAddress, to: updated.toAddress,
        date: updated.date.toLocaleDateString('cs-CZ'),
        time: updated.desiredTime,
        otherParty: updated.requester.realName,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const request = await prisma.rideRequest.findUnique({
    where: { id: params.id },
    include: { requester: true },
  });
  if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (request.requesterId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.rideRequest.update({ where: { id: params.id }, data: { isCancelled: true } });

  // If a driver already confirmed this request, notify them
  if (request.isFulfilled && request.fulfilledByOfferId) {
    const fulfillingOffer = await prisma.rideOffer.findUnique({ where: { id: request.fulfilledByOfferId } });
    if (fulfillingOffer) {
      await notifyPersonal(fulfillingOffer.driverId, {
        event: 'request_cancelled',
        rideId: params.id, rideType: 'request',
        from: request.fromAddress, to: request.toAddress,
        date: request.date.toLocaleDateString('cs-CZ'),
        time: request.desiredTime,
        otherParty: request.requester.realName,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
