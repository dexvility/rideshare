'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/app/providers';
import type { RideRequest, RideOffer, User } from '@prisma/client';

interface PickupPickerProps {
  request: RideRequest & { requester: User };
  onClose: () => void;
  onConfirmed: () => void;
  onNeedsOffer: () => void;
}

interface OfferWithDiff extends RideOffer {
  timeDiffMinutes: number;
}

export function PickupPickerModal({ request, onClose, onConfirmed, onNeedsOffer }: PickupPickerProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferWithDiff[]>([]);
  const [hasOwnOffer, setHasOwnOffer] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/rides/requests/${request.id}/matching-offers`)
      .then(r => r.json())
      .then(data => {
        setHasOwnOffer(data.hasOwnOffer);
        setOffers(data.offers || []);
        setSelectedId(data.bestMatchId || null);
        setLoading(false);
      });
  }, [request.id]);

  async function handleConfirm() {
    if (!selectedId) return;
    setConfirming(true);
    setError('');
    const res = await fetch(`/api/rides/requests/${request.id}/confirm-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: selectedId }),
    });
    setConfirming(false);
    if (!res.ok) {
      const data = await res.json();
      setError(t[data.error as keyof typeof t] as string || data.error);
      return;
    }
    onConfirmed();
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" style={{ textAlign: 'center', padding: '3rem' }}>…</div>
      </div>
    );
  }

  if (!hasOwnOffer) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚗</div>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {t.needsOwnOfferTitle}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {t.needsOwnOfferBody}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
            <button className="btn-primary" onClick={onNeedsOffer}>🚗 {t.needsOwnOfferCta}</button>
          </div>
        </div>
      </div>
    );
  }

  const bestMatch = offers[0];
  const otherOffers = offers.slice(1);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          🚗 {t.pickOfferTitle}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {request.requester.realName}: {request.fromAddress} → {request.toAddress} · {request.desiredTime}
        </p>

        {/* Best match pre-selected, single click confirms */}
        {bestMatch && (
          <label
            style={{
              display: 'block',
              padding: '0.875rem',
              border: `2px solid ${selectedId === bestMatch.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              marginBottom: otherOffers.length > 0 && changing ? '0.625rem' : '1rem',
              background: selectedId === bestMatch.id ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <input
                type="radio"
                checked={selectedId === bestMatch.id}
                onChange={() => setSelectedId(bestMatch.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-green">✓ {t.bestMatch}</span>
                  <span style={{ fontWeight: 600 }}>{bestMatch.departureTime}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {bestMatch.fromAddress} → {bestMatch.toAddress}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  🚗 {bestMatch.carMake} {bestMatch.carModel} · {bestMatch.availableSeats} {t.seats.toLowerCase()}
                </div>
              </div>
            </div>
          </label>
        )}

        {otherOffers.length > 0 && !changing && (
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="btn-ghost"
            style={{ fontSize: '0.8rem', marginBottom: '1rem' }}
          >
            🔄 {t.changeOffer} ({otherOffers.length})
          </button>
        )}

        {changing && otherOffers.map(o => (
          <label
            key={o.id}
            style={{
              display: 'block',
              padding: '0.875rem',
              border: `2px solid ${selectedId === o.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--border-radius)',
              cursor: 'pointer',
              marginBottom: '0.625rem',
              background: selectedId === o.id ? 'color-mix(in srgb, var(--color-primary) 6%, transparent)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <input type="radio" checked={selectedId === o.id} onChange={() => setSelectedId(o.id)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{o.departureTime}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {o.fromAddress} → {o.toAddress}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  🚗 {o.carMake} {o.carModel} · {o.availableSeats} {t.seats.toLowerCase()}
                </div>
              </div>
            </div>
          </label>
        ))}

        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!selectedId || confirming}>
            {confirming ? '…' : `✓ ${t.confirmPickup}`}
          </button>
        </div>
      </div>
    </div>
  );
}
