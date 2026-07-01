import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyPersonal } from '@/lib/ntfy';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const seats = parseInt(body.seats) || 1;
  const coPassengers: { name: string; phone: string }[] = Array.isArray(body.coPassengers) ? body.coPassengers : [];

  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: true },
  });

  if (!offer || offer.isCancelled) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (offer.isFull) return NextResponse.json({ error: 'Jízda je plná' }, { status: 409 });
  if (offer.driverId === session.userId) return NextResponse.json({ error: 'Nemůžete se přihlásit k vlastní jízdě' }, { status: 400 });

  const existing = offer.joins.find(j => j.userId === session.userId);
  if (existing) return NextResponse.json({ error: 'alreadyJoined' }, { status: 409 });

  if (seats > offer.availableSeats) return NextResponse.json({ error: 'Není dostatek míst' }, { status: 409 });

  const newAvailable = offer.availableSeats - seats;

  const join = await prisma.offerJoin.create({
    data: {
      offerId: params.id,
      userId: session.userId,
      seats,
      coPassengers: {
        create: coPassengers
          .filter(p => p.name && p.phone)
          .map(p => ({ name: p.name, phone: p.phone })),
      },
    },
    include: { user: true },
  });

  await prisma.rideOffer.update({
    where: { id: params.id },
    data: { availableSeats: newAvailable, isFull: newAvailable === 0 },
  });

  // Notify the driver
  await notifyPersonal(offer.driverId, {
    event: 'passenger_joined',
    from: offer.fromAddress, to: offer.toAddress,
    date: offer.date.toLocaleDateString('cs-CZ'),
    time: offer.departureTime,
    otherParty: join.user.realName,
  });

  return NextResponse.json({ ok: true, joinId: join.id });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const targetUserId = req.nextUrl.searchParams.get('userId');

  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: { include: { user: true } } },
  });
  if (!offer) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let join;
  const driverRemoving = !!targetUserId;

  if (driverRemoving) {
    if (offer.driverId !== session.userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    join = offer.joins.find(j => j.userId === targetUserId);
  } else {
    join = offer.joins.find(j => j.userId === session.userId);
  }

  if (!join) return NextResponse.json({ error: 'not joined' }, { status: 404 });

  await prisma.$transaction([
    prisma.offerJoin.delete({ where: { id: join.id } }),
    prisma.rideOffer.update({
      where: { id: params.id },
      data: { availableSeats: offer.availableSeats + join.seats, isFull: false },
    }),
  ]);

  const routeInfo = {
    from: offer.fromAddress, to: offer.toAddress,
    date: offer.date.toLocaleDateString('cs-CZ'),
    time: offer.departureTime,
  };

  if (driverRemoving) {
    // Driver removed the passenger — notify the passenger
    await notifyPersonal(join.userId, {
      event: 'you_were_removed',
      otherParty: offer.driver.realName,
      ...routeInfo,
    });
  } else {
    // Passenger left — notify the driver
    await notifyPersonal(offer.driverId, {
      event: 'passenger_left',
      otherParty: join.user.realName,
      ...routeInfo,
    });
  }

  return NextResponse.json({ ok: true });
}
