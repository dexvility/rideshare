import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyRide } from '@/lib/ntfy';

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

  await notifyRide({
    kind: 'request', action: 'updated',
    from: updated.fromAddress, to: updated.toAddress,
    date: updated.date.toLocaleDateString('cs-CZ'),
    time: updated.desiredTime,
    driverOrRequester: updated.requester.realName,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const request = await prisma.rideRequest.findUnique({ where: { id: params.id }, include: { requester: true } });
  if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (request.requesterId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  await prisma.rideRequest.update({ where: { id: params.id }, data: { isCancelled: true } });

  await notifyRide({
    kind: 'request', action: 'cancelled',
    from: request.fromAddress, to: request.toAddress,
    date: request.date.toLocaleDateString('cs-CZ'),
    time: request.desiredTime,
    driverOrRequester: request.requester.realName,
  });

  return NextResponse.json({ ok: true });
}
