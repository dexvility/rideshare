// src/app/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getTheme } from '@/lib/theme';
import { HomeClient } from './HomeClient';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');
  if (!user.profileComplete) redirect('/auth/complete-profile');

  const [offers, requests, { config }] = await Promise.all([
    prisma.rideOffer.findMany({
      where: { isCancelled: false },
      include: { driver: true, joins: { include: { user: true, coPassengers: true } } },
      orderBy: [{ date: 'asc' }, { departureTime: 'asc' }],
    }),
    prisma.rideRequest.findMany({
      where: { isCancelled: false },
      include: { requester: true },
      orderBy: [{ date: 'asc' }, { desiredTime: 'asc' }],
    }),
    getTheme(),
  ]);

  return (
    <HomeClient
      initialOffers={JSON.parse(JSON.stringify(offers))}
      initialRequests={JSON.parse(JSON.stringify(requests))}
      currentUser={JSON.parse(JSON.stringify(user))}
      h1Title={config.h1Title}
      h2Subtitle={config.h2Subtitle}
    />
  );
}
