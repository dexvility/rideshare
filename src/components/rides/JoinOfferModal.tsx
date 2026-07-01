'use client';

import { useState } from 'react';
import { useLocale } from '@/app/providers';
import { isValidPhone } from '@/lib/validate';
import type { RideOffer, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';

interface OfferWithDetails extends RideOffer {
  driver: User;
  joins: (OfferJoin & { user: User; coPassengers: OfferJoinPassenger[] })[];
}

interface CoPassengerInput { name: string; phone: string; }

interface JoinOfferModalProps {
  offer: OfferWithDetails;
  onClose: () => void;
  onJoined: () => void;
}

export function JoinOfferModal({ offer, onClose, onJoined }: JoinOfferModalProps) {
  const { t } = useLocale();
  const [seats, setSeats] = useState(1);
  const [coPassengers, setCoPassengers] = useState<CoPassengerInput[]>([]);
  const [error, setError] = useState('');

  function updateSeats(n: number) {
    const clamped = Math.max(1, Math.min(n, offer.availableSeats));
    setSeats(clamped);
    const extraCount = Math.max(0, clamped - 1);
    setCoPassengers(prev => {
      const next = [...prev];
      while (next.length < extraCount) next.push({ name: '', phone: '+420' });
      while (next.length > extraCount) next.pop();
      return next;
    });
  }

  async function handleJoin() {
    setError('');
    for (const cp of coPassengers) {
      if (!cp.name.trim() || !cp.phone.trim()) { setError(t.coPassengerFillAll); return; }
      if (!isValidPhone(cp.phone)) { setError(t.coPassengerPhoneInvalid); return; }
    }
    const res = await fetch(`/api/rides/offers/${offer.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats, coPassengers }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(t[err.error as keyof typeof t] as string || err.error);
      return;
    }
    onJoined();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.25rem', marginBottom: '1rem' }}>
          🚗 {t.joinOffer}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {offer.fromAddress} → {offer.toAddress}
        </p>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
            {t.passengers}
          </label>
          <input
            className="input-base"
            type="number"
            min={1}
            max={offer.availableSeats}
            value={seats}
            onChange={e => updateSeats(parseInt(e.target.value) || 1)}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {t.seatsLeft(offer.availableSeats)}
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
                      onChange={e => { const next = [...coPassengers]; next[idx] = { ...next[idx], name: e.target.value }; setCoPassengers(next); }}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.625rem' }}
                    />
                    <input
                      className="input-base"
                      placeholder={t.coPassengerPhone}
                      value={cp.phone}
                      onChange={e => { const next = [...coPassengers]; next[idx] = { ...next[idx], phone: e.target.value }; setCoPassengers(next); }}
                      style={{ fontSize: '0.85rem', padding: '0.5rem 0.625rem' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => { onClose(); setError(''); }}>{t.cancel}</button>
          <button
            className="btn-primary"
            disabled={seats < 1 || seats > offer.availableSeats}
            onClick={handleJoin}
          >
            {t.joinOffer}
          </button>
        </div>
      </div>
    </div>
  );
}
