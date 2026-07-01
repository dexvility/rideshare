'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/providers';
import { RideOfferCard } from '@/components/rides/RideOfferCard';
import { RideRequestCard } from '@/components/rides/RideRequestCard';
import { OfferRideForm } from '@/components/rides/OfferRideForm';
import { RequestRideForm } from '@/components/rides/RequestRideForm';
import { PickupPickerModal } from '@/components/rides/PickupPickerModal';
import { JoinOfferModal } from '@/components/rides/JoinOfferModal';
import type { RideOffer, RideRequest, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';

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
  | { type: 'pickup-picker'; request: RequestWithUser }
  | { type: 'add-phone'; next: ModalState };

interface HomeClientProps {
  initialOffers: OfferWithDetails[];
  initialRequests: RequestWithUser[];
  currentUser: User;
  h1Title: string;
  h2Subtitle: string;
}

export function HomeClient({ initialOffers, initialRequests, currentUser, h1Title, h2Subtitle }: HomeClientProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('offers');
  const [offers, setOffers] = useState<OfferWithDetails[]>(initialOffers);
  const [requests, setRequests] = useState<RequestWithUser[]>(initialRequests);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [toast, setToast] = useState('');
  const [userPhone, setUserPhone] = useState(currentUser.phone ?? '');

  function openNewOffer(prefill?: any) {
    const next: ModalState = { type: 'offer-form', prefill };
    if (!userPhone) { setModal({ type: 'add-phone', next }); } else { setModal(next); }
  }

  function openNewRequest() {
    const next: ModalState = { type: 'request-form' };
    if (!userPhone) { setModal({ type: 'add-phone', next }); } else { setModal(next); }
  }

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
          <button className="btn-primary" onClick={() => openNewOffer()} style={{ fontSize: '0.95rem' }}>
            🚗 {t.offerRide}
          </button>
          <button className="btn-secondary" onClick={() => openNewRequest()} style={{ fontSize: '0.95rem' }}>
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
            ? <EmptyState message={t.noOffers} action={() => openNewOffer()} actionLabel={t.offerRide} />
            : offers.map(offer => (
              <RideOfferCard
                key={offer.id}
                offer={offer}
                currentUserId={currentUser.id}
                onJoin={(id) => {
                  const o = offers.find(o => o.id === id);
                  if (o) setModal({ type: 'join', offer: o });
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
            ? <EmptyState message={t.noRequests} action={() => openNewRequest()} actionLabel={t.requestRide} />
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
                  openNewOffer({
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

      {modal.type === 'add-phone' && (
        <AddPhoneModal
          onClose={() => setModal({ type: 'none' })}
          onSaved={(phone) => {
            setUserPhone(phone);
            setModal(modal.next);
          }}
        />
      )}

      {modal.type === 'join' && (
        <JoinOfferModal
          offer={modal.offer}
          onClose={() => setModal({ type: 'none' })}
          onJoined={async () => { setModal({ type: 'none' }); await refreshData(); showToast('✓ Přidáno!'); }}
        />
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
          onNeedsOffer={() => openNewOffer()}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AddPhoneModal({ onClose, onSaved }: { onClose: () => void; onSaved: (phone: string) => void }) {
  const { t } = useLocale();
  const [phone, setPhone] = useState('+420');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(phone)) { setError(t.invalidPhone); return; }
    setLoading(true);
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setLoading(false);
    if (!res.ok) { setError(t.invalidPhone); return; }
    onSaved(phone);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '380px' }}>
        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>📱</div>
        <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          {t.phoneRequiredTitle}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.25rem' }}>
          {t.phoneRequiredDesc}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <input
            className="input-base"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoFocus
            placeholder="+420 777 123 456"
            required
          />
          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
              {loading ? '…' : t.saveAndContinue}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
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
