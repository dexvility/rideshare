import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notifyGlobal } from '@/lib/ntfy';

export async function GET(req: NextRequest) {
  const offers = await prisma.rideOffer.findMany({
    where: { isCancelled: false },
    include: { driver: true, joins: { include: { user: true, coPassengers: true } } },
    orderBy: [{ date: 'asc' }, { departureTime: 'asc' }],
  });
  return NextResponse.json(offers);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { fromAddress, fromLat, fromLng, toAddress, toLat, toLng,
          date, departureTime, estimatedArrival, totalSeats,
          carMake, carModel, allowsDetours, fee, notes, isReturnRide, isFlexibleTime } = body;

  // Conflict check: driver cannot have overlapping rides
  const conflict = await checkDriverConflict(session.userId, date, departureTime, estimatedArrival);
  if (conflict) return NextResponse.json({ error: 'conflictingRide' }, { status: 409 });

  const offer = await prisma.rideOffer.create({
    data: {
      driverId: session.userId,
      fromAddress, fromLat, fromLng,
      toAddress, toLat, toLng,
      date: new Date(date),
      departureTime,
      estimatedArrival: estimatedArrival || null,
      totalSeats: parseInt(totalSeats),
      availableSeats: parseInt(totalSeats),
      carMake, carModel,
      allowsDetours: Boolean(allowsDetours),
      fee: parseFloat(fee) || 0,
      notes: notes || null,
      isReturnRide: Boolean(isReturnRide),
      isFlexibleTime: Boolean(isFlexibleTime),
    },
    include: { driver: true },
  });

  // Notify
  await notifyGlobal({
    kind: 'offer',
    from: fromAddress,
    to: toAddress,
    date: new Date(date).toLocaleDateString('cs-CZ'),
    time: departureTime,
    driverOrRequester: offer.driver.realName,
  });

  return NextResponse.json(offer, { status: 201 });
}

async function checkDriverConflict(userId: string, date: string, depTime: string, arrTime?: string): Promise<boolean> {
  const existingOffers = await prisma.rideOffer.findMany({
    where: { driverId: userId, date: new Date(date), isCancelled: false },
  });

  for (const existing of existingOffers) {
    const existStart = timeToMins(existing.departureTime);
    const existEnd = existing.estimatedArrival ? timeToMins(existing.estimatedArrival) : existStart + 120;
    const newStart = timeToMins(depTime);
    const newEnd = arrTime ? timeToMins(arrTime) : newStart + 120;

    if (newStart < existEnd && newEnd > existStart) return true;
  }
  return false;
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
