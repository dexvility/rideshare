'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { RideRequestCard } from '@/components/rides/RideRequestCard';
import { RequestRideForm } from '@/components/rides/RequestRideForm';
import { PickupPickerModal } from '@/components/rides/PickupPickerModal';
import type { RideRequest, User } from '@prisma/client';

interface RequestWithUser extends RideRequest {
  requester: User;
}

interface Props {
  initialRequest: RequestWithUser;
  currentUserId: string;
  autoPickup: boolean;
}

type Modal = 'none' | 'pickup' | 'edit';

export function RequestDetailClient({ initialRequest, currentUserId, autoPickup }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [modal, setModal] = useState<Modal>(autoPickup ? 'pickup' : 'none');
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function refresh() {
    const res = await fetch(`/api/rides/requests/${request.id}`);
    if (res.ok) setRequest(await res.json());
  }

  async function handleEditSubmit(data: any) {
    const res = await fetch(`/api/rides/requests/${request.id}`, {
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
    if (!confirm('Opravdu zrušit poptávku?')) return;
    await fetch(`/api/rides/requests/${request.id}`, { method: 'DELETE' });
    router.push('/');
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

      <RideRequestCard
        request={request}
        currentUserId={currentUserId}
        onIWillTakeYou={() => setModal('pickup')}
        onEdit={() => setModal('edit')}
        onDelete={handleDelete}
      />

      {modal === 'pickup' && (
        <PickupPickerModal
          request={request}
          onClose={() => setModal('none')}
          onConfirmed={async () => { setModal('none'); await refresh(); showToast('✓ Cestující zajištěn.'); }}
          onNeedsOffer={() => router.push('/')}
        />
      )}

      {modal === 'edit' && (
        <RequestRideForm
          onClose={() => setModal('none')}
          onSubmit={handleEditSubmit}
          editMode
          initial={{
            fromAddress: request.fromAddress, fromLat: request.fromLat, fromLng: request.fromLng,
            toAddress: request.toAddress, toLat: request.toLat, toLng: request.toLng,
            date: request.date.toString().slice(0, 10),
            desiredTime: request.desiredTime,
            passengerCount: request.passengerCount,
            notes: request.notes || '',
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
