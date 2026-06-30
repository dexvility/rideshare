// src/app/my-rides/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { MyRidesClient } from './MyRidesClient';

export default async function MyRidesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  if (!user.profileComplete) redirect('/auth/complete-profile');

  const [myOffers, myRequests, passengerJoins] = await Promise.all([
    prisma.rideOffer.findMany({
      where: { driverId: user.id },
      include: { driver: true, joins: { include: { user: true, coPassengers: true } } },
      orderBy: [{ date: 'asc' }, { departureTime: 'asc' }],
    }),
    prisma.rideRequest.findMany({
      where: { requesterId: user.id },
      include: { requester: true },
      orderBy: [{ date: 'asc' }, { desiredTime: 'asc' }],
    }),
    prisma.offerJoin.findMany({
      where: { userId: user.id },
      include: {
        offer: { include: { driver: true, joins: { include: { user: true, coPassengers: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const passengerOffers = passengerJoins.map(j => j.offer);

  return (
    <MyRidesClient
      myOffers={JSON.parse(JSON.stringify(myOffers))}
      myRequests={JSON.parse(JSON.stringify(myRequests))}
      passengerOffers={JSON.parse(JSON.stringify(passengerOffers))}
      currentUser={JSON.parse(JSON.stringify(user))}
    />
  );
}
