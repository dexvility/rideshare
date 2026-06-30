import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const request = await prisma.rideRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // Driver's own non-cancelled, non-full offers on the same date
  const offers = await prisma.rideOffer.findMany({
    where: {
      driverId: session.userId,
      date: request.date,
      isCancelled: false,
      isFull: false,
    },
    orderBy: { departureTime: 'asc' },
  });

  if (offers.length === 0) {
    return NextResponse.json({ hasOwnOffer: false, offers: [] });
  }

  const reqMins = timeToMins(request.desiredTime);
  const withDiff = offers.map(o => ({
    ...o,
    timeDiffMinutes: Math.abs(timeToMins(o.departureTime) - reqMins),
  }));
  withDiff.sort((a, b) => a.timeDiffMinutes - b.timeDiffMinutes);

  return NextResponse.json({ hasOwnOffer: true, offers: withDiff, bestMatchId: withDiff[0].id });
}
