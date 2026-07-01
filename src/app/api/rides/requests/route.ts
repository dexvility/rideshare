import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyGlobal } from '@/lib/ntfy';

export async function GET() {
  const requests = await prisma.rideRequest.findMany({
    where: { isCancelled: false },
    include: { requester: true },
    orderBy: [{ date: 'asc' }, { desiredTime: 'asc' }],
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { fromAddress, fromLat, fromLng, toAddress, toLat, toLng, date, desiredTime, passengerCount, notes, isFlexibleTime } = body;

  const request = await prisma.rideRequest.create({
    data: {
      requesterId: session.userId,
      fromAddress, fromLat, fromLng,
      toAddress, toLat, toLng,
      date: new Date(date),
      desiredTime,
      passengerCount: parseInt(passengerCount) || 1,
      notes: notes || null,
      isFlexibleTime: Boolean(isFlexibleTime),
    },
    include: { requester: true },
  });

  await notifyGlobal({
    kind: 'request',
    rideId: request.id,
    from: fromAddress, to: toAddress,
    date: new Date(date).toLocaleDateString('cs-CZ'),
    time: desiredTime,
    driverOrRequester: request.requester.realName,
  });

  return NextResponse.json(request, { status: 201 });
}
