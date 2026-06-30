import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { offerId } = body;
  if (!offerId) return NextResponse.json({ error: 'offerId required' }, { status: 400 });

  const request = await prisma.rideRequest.findUnique({ where: { id: params.id } });
  if (!request || request.isCancelled) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (request.isFulfilled) return NextResponse.json({ error: 'already fulfilled' }, { status: 409 });

  const offer = await prisma.rideOffer.findUnique({
    where: { id: offerId },
    include: { joins: true },
  });
  if (!offer || offer.isCancelled) return NextResponse.json({ error: 'offer not found' }, { status: 404 });
  if (offer.driverId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (offer.isFull) return NextResponse.json({ error: 'Jízda je plná' }, { status: 409 });

  const seatsNeeded = request.passengerCount;
  if (seatsNeeded > offer.availableSeats) {
    return NextResponse.json({ error: 'Není dostatek míst pro tento počet cestujících' }, { status: 409 });
  }

  const existingJoin = offer.joins.find(j => j.userId === request.requesterId);
  if (existingJoin) return NextResponse.json({ error: 'alreadyJoined' }, { status: 409 });

  const newAvailable = offer.availableSeats - seatsNeeded;

  await prisma.$transaction([
    prisma.offerJoin.create({
      data: {
        offerId: offer.id,
        userId: request.requesterId,
        seats: seatsNeeded,
      },
    }),
    prisma.rideOffer.update({
      where: { id: offer.id },
      data: { availableSeats: newAvailable, isFull: newAvailable === 0 },
    }),
    prisma.rideRequest.update({
      where: { id: request.id },
      data: { isFulfilled: true, fulfilledByOfferId: offer.id },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
