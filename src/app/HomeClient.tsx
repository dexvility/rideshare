'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { RideOfferCard } from '@/components/rides/RideOfferCard';
import { RideRequestCard } from '@/components/rides/RideRequestCard';
import { OfferRideForm } from '@/components/rides/OfferRideForm';
import { RequestRideForm } from '@/components/rides/RequestRideForm';
import { PickupPickerModal } from '@/components/rides/PickupPickerModal';
import type { RideOffer, RideRequest, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';
import { isValidPhone } from '@/lib/validate';

interface OfferWithDetails extends RideOffer {
  driver: User;
  joins: (OfferJoin & { user: User; coPassengers: OfferJoinPassenger[] })[];
}

interface RequestWithUser extends RideRequest {
  requester: User;
}

type Tab = 'offers' | 'requests';
type ModalState =
  | { type: 'none' }
  | { type: 'offer-form'; edit?: OfferWithDetails; prefill?: any }
  | { type: 'request-form'; edit?: RequestWithUser }
  | { type: 'return-ride'; offer: OfferWithDetails }
  | { type: 'join'; offer: OfferWithDetails }
  | { type: 'pickup-picker'; request: RequestWithUser };

interface HomeClientProps {
  initialOffers: OfferWithDetails[];
  initialRequests: RequestWithUser[];
  currentUser: User;
  h1Title: string;
  h2Subtitle: string;
}

interface CoPassengerInput { name: string; phone: string; }

export function HomeClient({ initialOffers, initialRequests, currentUser, h1Title, h2Subtitle }: HomeClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('offers');
  const [offers, setOffers] = useState<OfferWithDetails[]>(initialOffers);
  const [requests, setRequests] = useState<RequestWithUser[]>(initialRequests);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [joinSeats, setJoinSeats] = useState(1);
  const [coPassengers, setCoPassengers] = useState<CoPassengerInput[]>([]);
  const [joinError, setJoinError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function refreshData() {
    const [offRes, reqRes] = await Promise.all([
      fetch('/api/rides/offers').then(r => r.json()),
      fetch('/api/rides/requests').then(r => r.json()),
    ]);
    setOffers(offRes);
    setRequests(reqRes);
  }

  async function handleOfferSubmit(data: any) {
    const editing = modal.type === 'offer-form' && modal.edit;
    const url = editing ? `/api/rides/offers/${editing.id}` : '/api/rides/offers';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(t[err.error as keyof typeof t] as string || err.error);
    }
    const created: OfferWithDetails = await res.json();
    setModal({ type: 'none' });
    await refreshData();
    showToast(t.offerCreated);

    // Only prompt for a return ride if this is a brand new, non-return offer.
    if (!editing && !data.isReturnRide) {
      setTimeout(() => {
        setModal({ type: 'return-ride', offer: created });
      }, 400);
    }
  }

  async function handleRequestSubmit(data: any) {
    const editing = modal.type === 'request-form' && modal.edit;
    const url = editing ? `/api/rides/requests/${editing.id}` : '/api/rides/requests';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(t[err.error as keyof typeof t] as string || err.error);
    }
    setModal({ type: 'none' });
    await refreshData();
    showToast(t.requestCreated);
  }

  async function handleJoinOffer(offerId: string, seats: number, coPass: CoPassengerInput[]) {
    setJoinError('');
    const res = await fetch(`/api/rides/offers/${offerId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats, coPassengers: coPass }),
    });
    if (!res.ok) {
      const err = await res.json();
      const msg = t[err.error as keyof typeof t] as string || err.error;
      setJoinError(msg);
      showToast(msg);
      return;
    }
    setModal({ type: 'none' });
    setJoinSeats(1);
    setCoPassengers([]);
    setJoinError('');
    await refreshData();
    showToast('✓ Přidáno!');
  }

  async function handleCancelReservation(offerId: string) {
    await fetch(`/api/rides/offers/${offerId}/join`, { method: 'DELETE' });
    await refreshData();
    showToast(t.saved);
  }

  async function handleRemovePassenger(offerId: string, userId: string) {
    await fetch(`/api/rides/offers/${offerId}/join?userId=${userId}`, { method: 'DELETE' });
    await refreshData();
    showToast(t.saved);
  }

  async function handleDeleteOffer(offerId: string) {
    if (!confirm('Opravdu zrušit nabídku?')) return;
    await fetch(`/api/rides/offers/${offerId}`, { method: 'DELETE' });
    await refreshData();
    showToast('Nabídka zrušena.');
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('Opravdu zrušit poptávku?')) return;
    await fetch(`/api/rides/requests/${requestId}`, { method: 'DELETE' });
    await refreshData();
    showToast('Poptávka zrušena.');
  }

  function updateJoinSeats(seats: number, max: number) {
    const clamped = Math.max(1, Math.min(seats, max));
    setJoinSeats(clamped);
    const extraCount = Math.max(0, clamped - 1);
    setCoPassengers(prev => {
      const next = [...prev];
      while (next.length < extraCount) next.push({ name: '', phone: '+420' });
      while (next.length > extraCount) next.pop();
      return next;
    });
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>

      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 700,
          color: 'var(--color-primary)',
          lineHeight: 1.2,
        }}>
          {h1Title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          {h2Subtitle}
        </p>
        <div className="accent-line" />

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => setModal({ type: 'offer-form' })} style={{ fontSize: '0.95rem' }}>
            🚗 {t.offerRide}
          </button>
          <button className="btn-secondary" onClick={() => setModal({ type: 'request-form' })} style={{ fontSize: '0.95rem' }}>
            🙋 {t.requestRide}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: '1.25rem' }}>
        {(['offers', 'requests'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: tab === tabKey ? 600 : 400,
              color: tab === tabKey ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: tab === tabKey ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-2px',
            }}
          >
            {tabKey === 'offers' ? `🚗 ${t.availableOffers}` : `🙋 ${t.openRequests}`}
            <span style={{
              marginLeft: '0.5rem',
              background: tab === tabKey ? 'var(--color-primary)' : 'var(--color-border)',
              color: tab === tabKey ? '#fff' : 'var(--color-text-muted)',
              borderRadius: '999px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {tabKey === 'offers' ? offers.length : requests.length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'offers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {offers.length === 0
            ? <EmptyState message={t.noOffers} action={() => setModal({ type: 'offer-form' })} actionLabel={t.offerRide} />
            : offers.map(offer => (
              <RideOfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUser.id}
                onJoin={(id) => {
                  const o = offers.find(o => o.id === id);
                  if (o) { setJoinSeats(1); setCoPassengers([]); setModal({ type: 'join', offer: o }); }
                }}
                onEdit={(offer) => setModal({ type: 'offer-form', edit: offer })}
                onDelete={handleDeleteOffer}
                onCancelReservation={handleCancelReservation}
                onRemovePassenger={handleRemovePassenger}
              />
            ))
          }
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {requests.length === 0
            ? <EmptyState message={t.noRequests} action={() => setModal({ type: 'request-form' })} actionLabel={t.requestRide} />
            : requests.map(req => (
              <RideRequestCard
                key={req.id}
                request={req}
                currentUserId={currentUser.id}
                onIWillTakeYou={(id) => {
                  const r = requests.find(r => r.id === id);
                  if (r) setModal({ type: 'pickup-picker', request: r });
                }}
                onEdit={(req) => setModal({ type: 'request-form', edit: req })}
                onDelete={handleDeleteRequest}
              />
            ))
          }
        </div>
      )}

      {/* ── Modals ── */}

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
          } : modal.prefill}
          editMode={!!modal.edit}
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
          editMode={!!modal.edit}
        />
      )}

      {modal.type === 'return-ride' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔄</div>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {t.offerReturnRide}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {modal.offer.toAddress} → {modal.offer.fromAddress}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  const o = modal.offer;
                  setModal({
                    type: 'offer-form',
                    prefill: {
                      fromAddress: o.toAddress, fromLat: o.toLat, fromLng: o.toLng,
                      toAddress: o.fromAddress, toLat: o.fromLat, toLng: o.fromLng,
                      date: o.date.toString().slice(0, 10),
                      departureTime: o.estimatedArrival || o.departureTime,
                      estimatedArrival: '',
                      totalSeats: o.totalSeats,
                      carMake: o.carMake,
                      carModel: o.carModel,
                      allowsDetours: o.allowsDetours,
                      fee: Number(o.fee),
                      notes: '',
                      isReturnRide: true,
                    },
                  });
                }}
              >
                {t.offerReturnYes}
              </button>
              <button className="btn-secondary" onClick={() => setModal({ type: 'none' })}>
                {t.offerReturnNo}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'join' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal({ type: 'none' })}>
          <div className="modal-box">
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem', marginBottom: '1rem' }}>
              🚗 {t.joinOffer}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {modal.offer.fromAddress} → {modal.offer.toAddress}
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                {t.passengers}
              </label>
              <input
                className="input-base"
                type="number"
                min={1}
                max={modal.offer.availableSeats}
                value={joinSeats}
                onChange={e => updateJoinSeats(parseInt(e.target.value) || 1, modal.offer.availableSeats)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {t.seatsLeft(modal.offer.availableSeats)}
              </p>
            </div>

            {coPassengers.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.625rem' }}>{t.coPassengerDetails}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {coPassengers.map((cp, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', background: 'var(--color-background)', borderRadius: 'calc(var(--border-radius) * 0.75)', border: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 500, marginBottom: '0.5rem' }}>{t.addCoPassenger} {idx + 1}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <input
                          className="input-base"
                          placeholder={t.coPassengerName}
                          value={cp.name}
                          onChange={e => {
                            const next = [...coPassengers];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setCoPassengers(next);
                          }}
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.625rem' }}
                        />
                        <input
                          className="input-base"
                          placeholder={t.coPassengerPhone}
                          value={cp.phone}
                          onChange={e => {
                            const next = [...coPassengers];
                            next[idx] = { ...next[idx], phone: e.target.value };
                            setCoPassengers(next);
                          }}
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.625rem' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {joinError && (
              <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{joinError}</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setModal({ type: 'none' }); setJoinError(''); }}>{t.cancel}</button>
              <button
                className="btn-primary"
                disabled={joinSeats < 1 || joinSeats > modal.offer.availableSeats}
                onClick={() => {
                  for (const cp of coPassengers) {
                    if (!cp.name.trim() || !cp.phone.trim()) {
                      setJoinError(t.coPassengerFillAll);
                      return;
                    }
                    if (!isValidPhone(cp.phone)) {
                      setJoinError(t.coPassengerPhoneInvalid);
                      return;
                    }
                  }
                  handleJoinOffer(modal.offer.id, joinSeats, coPassengers);
                }}
              >
                {t.joinOffer}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'pickup-picker' && (
        <PickupPickerModal
          request={modal.request}
          onClose={() => setModal({ type: 'none' })}
          onConfirmed={async () => {
            setModal({ type: 'none' });
            await refreshData();
            showToast('✓ Cestující zajištěn.');
          }}
          onNeedsOffer={() => setModal({ type: 'offer-form' })}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function EmptyState({ message, action, actionLabel }: { message: string; action: () => void; actionLabel: string }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      color: 'var(--color-text-muted)',
      border: '2px dashed var(--color-border)',
      borderRadius: 'var(--border-radius)',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛣️</div>
      <p style={{ marginBottom: '1.25rem' }}>{message}</p>
      <button className="btn-primary" onClick={action}>{actionLabel}</button>
    </div>
  );
}
