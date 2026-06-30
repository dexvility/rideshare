'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { RideOfferCard } from '@/components/rides/RideOfferCard';
import { RideRequestCard } from '@/components/rides/RideRequestCard';
import { OfferRideForm } from '@/components/rides/OfferRideForm';
import { RequestRideForm } from '@/components/rides/RequestRideForm';
import type { RideOffer, RideRequest, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';

interface OfferWithDetails extends RideOffer {
  driver: User;
  joins: (OfferJoin & { user: User; coPassengers: OfferJoinPassenger[] })[];
}

interface RequestWithUser extends RideRequest {
  requester: User;
}

interface MyRidesClientProps {
  myOffers: OfferWithDetails[];
  myRequests: RequestWithUser[];
  passengerOffers: OfferWithDetails[];
  currentUser: User;
}

type Tab = 'offers' | 'requests' | 'passenger';
type ModalState =
  | { type: 'none' }
  | { type: 'offer-form'; edit?: OfferWithDetails }
  | { type: 'request-form'; edit?: RequestWithUser };

// NOTE: offers/requests/passengerOffers are intentionally NOT copied into local
// state. This page is server-rendered; router.refresh() re-fetches fresh props
// from the server component, and we want those new props to actually be used
// on every render rather than a stale snapshot taken at first mount.
export function MyRidesClient({ myOffers, myRequests, passengerOffers, currentUser }: MyRidesClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('offers');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function refresh() {
    router.refresh();
  }

  async function handleOfferSubmit(data: any) {
    const editing = modal.type === 'offer-form' && modal.edit;
    if (!editing) return;
    const res = await fetch(`/api/rides/offers/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(t[err.error as keyof typeof t] as string || err.error);
    }
    setModal({ type: 'none' });
    showToast(t.saved);
    refresh();
  }

  async function handleRequestSubmit(data: any) {
    const editing = modal.type === 'request-form' && modal.edit;
    if (!editing) return;
    const res = await fetch(`/api/rides/requests/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(t[err.error as keyof typeof t] as string || err.error);
    }
    setModal({ type: 'none' });
    showToast(t.saved);
    refresh();
  }

  async function handleDeleteOffer(offerId: string) {
    if (!confirm('?')) return;
    await fetch(`/api/rides/offers/${offerId}`, { method: 'DELETE' });
    showToast(t.saved);
    refresh();
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('?')) return;
    await fetch(`/api/rides/requests/${requestId}`, { method: 'DELETE' });
    showToast(t.saved);
    refresh();
  }

  async function handleCancelReservation(offerId: string) {
    if (!confirm('?')) return;
    await fetch(`/api/rides/offers/${offerId}/join`, { method: 'DELETE' });
    showToast(t.saved);
    refresh();
  }

  async function handleRemovePassenger(offerId: string, userId: string) {
    if (!confirm('?')) return;
    await fetch(`/api/rides/offers/${offerId}/join?userId=${userId}`, { method: 'DELETE' });
    showToast(t.saved);
    refresh();
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'offers', label: t.myOffers, count: myOffers.length },
    { key: 'requests', label: t.myRequests, count: myRequests.length },
    { key: 'passenger', label: t.asPassenger, count: passengerOffers.length },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{
        fontFamily: 'var(--font-display), Georgia, serif',
        fontSize: 'clamp(1.6rem, 4vw, 2rem)',
        fontWeight: 700,
        color: 'var(--color-primary)',
      }}>
        {t.myRides}
      </h1>
      <div className="accent-line" />

      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              padding: '0.625rem 1.125rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: tab === tb.key ? 600 : 400,
              color: tab === tb.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === tb.key ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}
          >
            {tb.label}
            <span style={{
              marginLeft: '0.5rem',
              background: tab === tb.key ? 'var(--color-primary)' : 'var(--color-border)',
              color: tab === tb.key ? '#fff' : 'var(--color-text-muted)',
              borderRadius: '999px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}>
              {tb.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {myOffers.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>{t.noMyOffers}</p>
            : myOffers.map(offer => (
              <RideOfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUser.id}
                onEdit={(o) => setModal({ type: 'offer-form', edit: o })}
                onDelete={handleDeleteOffer}
                onRemovePassenger={handleRemovePassenger}
              />
            ))
          }
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {myRequests.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>{t.noMyRequests}</p>
            : myRequests.map(req => (
              <RideRequestCard
                key={req.id}
                request={req}
                currentUserId={currentUser.id}
                onEdit={(r) => setModal({ type: 'request-form', edit: r })}
                onDelete={handleDeleteRequest}
              />
            ))
          }
        </div>
      )}

      {tab === 'passenger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {passengerOffers.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>{t.noMyPassengerRides}</p>
            : passengerOffers.map(offer => (
              <RideOfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUser.id}
                onCancelReservation={handleCancelReservation}
              />
            ))
          }
        </div>
      )}

      {modal.type === 'offer-form' && (
        <OfferRideForm
          onClose={() => setModal({ type: 'none' })}
          onSubmit={handleOfferSubmit}
          initial={modal.edit ? {
            fromAddress: modal.edit.fromAddress, fromLat: modal.edit.fromLat, fromLng: modal.edit.fromLng,
            toAddress: modal.edit.toAddress, toLat: modal.edit.toLat, toLng: modal.edit.toLng,
            date: modal.edit.date.toString().slice(0, 10),
            departureTime: modal.edit.departureTime,
            estimatedArrival: modal.edit.estimatedArrival || '',
            totalSeats: modal.edit.totalSeats,
            carMake: modal.edit.carMake, carModel: modal.edit.carModel,
            allowsDetours: modal.edit.allowsDetours,
            fee: Number(modal.edit.fee),
            notes: modal.edit.notes || '',
          } : undefined}
          editMode
        />
      )}

      {modal.type === 'request-form' && (
        <RequestRideForm
          onClose={() => setModal({ type: 'none' })}
          onSubmit={handleRequestSubmit}
          initial={modal.edit ? {
            fromAddress: modal.edit.fromAddress, fromLat: modal.edit.fromLat, fromLng: modal.edit.fromLng,
            toAddress: modal.edit.toAddress, toLat: modal.edit.toLat, toLng: modal.edit.toLng,
            date: modal.edit.date.toString().slice(0, 10),
            desiredTime: modal.edit.desiredTime,
            passengerCount: modal.edit.passengerCount,
            notes: modal.edit.notes || '',
          } : undefined}
          editMode
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
