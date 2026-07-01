export const dynamic = 'force-dynamic';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ModalShell } from '@/components/ui/ModalShell';
import { RequestDetailClient } from '@/app/rides/requests/[id]/RequestDetailClient';

export default async function RequestModalPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { action?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth');

  const request = await prisma.rideRequest.findUnique({
    where: { id: params.id },
    include: { requester: true },
  });
  if (!request) notFound();

  return (
    <ModalShell>
      <RequestDetailClient
        initialRequest={JSON.parse(JSON.stringify(request))}
        currentUserId={user.id}
        autoPickup={searchParams.action === 'pickup'}
      />
    </ModalShell>
  );
}
