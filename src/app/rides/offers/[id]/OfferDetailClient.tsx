'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { RideOfferCard } from '@/components/rides/RideOfferCard';
import { JoinOfferModal } from '@/components/rides/JoinOfferModal';
import { OfferRideForm } from '@/components/rides/OfferRideForm';
import type { RideOffer, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';

interface OfferWithDetails extends RideOffer {
  driver: User;
  joins: (OfferJoin & { user: User; coPassengers: OfferJoinPassenger[] })[];
}

interface Props {
  initialOffer: OfferWithDetails;
  currentUserId: string;
  autoBook: boolean;
}

type Modal = 'none' | 'join' | 'edit';

export function OfferDetailClient({ initialOffer, currentUserId, autoBook }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [offer, setOffer] = useState(initialOffer);
  const [modal, setModal] = useState<Modal>(autoBook ? 'join' : 'none');
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function refresh() {
    const res = await fetch(`/api/rides/offers/${offer.id}`);
    if (res.ok) setOffer(await res.json());
  }

  async function handleEditSubmit(data: any) {
    const res = await fetch(`/api/rides/offers/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(t[err.error as keyof typeof t] as string || err.error);
    }
    setModal('none');
    await refresh();
    showToast(t.saved);
  }

  async function handleDelete() {
    if (!confirm('Opravdu zrušit nabídku?')) return;
    await fetch(`/api/rides/offers/${offer.id}`, { method: 'DELETE' });
    router.push('/');
  }

  async function handleCancelReservation() {
    await fetch(`/api/rides/offers/${offer.id}/join`, { method: 'DELETE' });
    await refresh();
    showToast(t.saved);
  }

  async function handleRemovePassenger(offerId: string, userId: string) {
    await fetch(`/api/rides/offers/${offerId}/join?userId=${userId}`, { method: 'DELETE' });
    await refresh();
    showToast(t.saved);
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <button
        onClick={() => router.back()}
        className="btn-ghost"
        style={{ marginBottom: '1rem', fontSize: '0.875rem' }}
      >
        ← {t.back}
      </button>

      <RideOfferCard
        offer={offer}
        currentUserId={currentUserId}
        onJoin={() => setModal('join')}
        onEdit={() => setModal('edit')}
        onDelete={handleDelete}
        onCancelReservation={handleCancelReservation}
        onRemovePassenger={handleRemovePassenger}
      />

      {modal === 'join' && (
        <JoinOfferModal
          offer={offer}
          onClose={() => setModal('none')}
          onJoined={async () => { setModal('none'); await refresh(); showToast('✓ Přidáno!'); }}
        />
      )}

      {modal === 'edit' && (
        <OfferRideForm
          onClose={() => setModal('none')}
          onSubmit={handleEditSubmit}
          editMode
          initial={{
            fromAddress: offer.fromAddress, fromLat: offer.fromLat, fromLng: offer.fromLng,
            toAddress: offer.toAddress, toLat: offer.toLat, toLng: offer.toLng,
            date: offer.date.toString().slice(0, 10),
            departureTime: offer.departureTime,
            estimatedArrival: offer.estimatedArrival || '',
            totalSeats: offer.totalSeats,
            carMake: offer.carMake, carModel: offer.carModel,
            allowsDetours: offer.allowsDetours,
            fee: Number(offer.fee),
            notes: offer.notes || '',
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
