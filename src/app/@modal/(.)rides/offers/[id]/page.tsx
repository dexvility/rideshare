export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ModalShell } from '@/components/ui/ModalShell';
import { OfferDetailClient } from '@/app/rides/offers/[id]/OfferDetailClient';

export default async function OfferModalPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { action?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');

  const offer = await prisma.rideOffer.findUnique({
    where: { id: params.id },
    include: { driver: true, joins: { include: { user: true, coPassengers: true } } },
  });
  if (!offer) notFound();

  return (
    <ModalShell>
      <OfferDetailClient
        initialOffer={JSON.parse(JSON.stringify(offer))}
        currentUserId={user.id}
        autoBook={searchParams.action === 'book'}
      />
    </ModalShell>
  );
}
