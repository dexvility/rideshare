'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from '@/app/providers';
import { ContactButton } from '@/components/ui/ContactButton';
import { shortenAddress } from '@/lib/geo';
import type { RideOffer, User, OfferJoin, OfferJoinPassenger } from '@prisma/client';

const RideMap = dynamic(() => import('@/components/map/RideMap').then(m => ({ default: m.RideMap })), { ssr: false });

interface OfferWithDetails extends RideOffer {
  driver: User;
  joins: (OfferJoin & { user: User; coPassengers: OfferJoinPassenger[] })[];
}

interface RideOfferCardProps {
  offer: OfferWithDetails;
  currentUserId?: string;
  onJoin?: (offerId: string) => void;
  onEdit?: (offer: OfferWithDetails) => void;
  onDelete?: (offerId: string) => void;
  onCancelReservation?: (offerId: string) => void;
  onRemovePassenger?: (offerId: string, userId: string) => void;
}

export function RideOfferCard({ offer, currentUserId, onJoin, onEdit, onDelete, onCancelReservation, onRemovePassenger }: RideOfferCardProps) {
  const { t } = useLocale();
  const [showMap, setShowMap] = useState(false);
  const isOwner = currentUserId === offer.driverId;
  const myJoin = offer.joins.find(j => j.userId === currentUserId);
  const hasJoined = !!myJoin;
  const fee = Number(offer.fee);
  const isGreyedOut = (offer.isFull || offer.availableSeats <= 0) && !isOwner && !hasJoined;

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  // Phone/contact only visible to: the driver themselves (sees all passengers),
  // or a passenger who has a confirmed join on this offer (sees the driver).
  const canSeeDriverContact = isOwner || hasJoined;

  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        transition: 'box-shadow 0.15s, opacity 0.15s',
        opacity: isGreyedOut ? 0.55 : 1,
        filter: isGreyedOut ? 'grayscale(0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {offer.isFull && <span className="badge badge-red">{t.full}</span>}
            {offer.isCancelled && <span className="badge badge-gray">{t.cancelled}</span>}
            {!offer.isFull && !offer.isCancelled && (
              <span className="badge badge-green">{t.seatsLeft(offer.availableSeats)}</span>
            )}
            {fee === 0 ? (
              <span className="badge badge-yellow">{t.free}</span>
            ) : (
              <span className="badge badge-yellow">{fee} Kč</span>
            )}
            {offer.allowsDetours && (
              <span className="badge" style={{ background: 'rgba(45,80,22,0.1)', color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                ↙ {t.detours}
              </span>
            )}
            {offer.isFlexibleTime && (
              <span className="badge" style={{ background: 'rgba(45,80,22,0.1)', color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                🕐 {t.flexibleTimeTag}
              </span>
            )}
            {hasJoined && (
              <span className="badge" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                ✓ {t.yourReservation}
              </span>
            )}
          </div>

          <div style={{ marginTop: '0.625rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} title={offer.fromAddress}>
              <span style={{ color: 'var(--color-success)' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenAddress(offer.fromAddress)}</span>
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', paddingLeft: '1.25rem', margin: '0.1rem 0' }}>↓</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} title={offer.toAddress}>
              <span style={{ color: 'var(--color-error)' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenAddress(offer.toAddress)}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-display), Georgia, serif' }}>
            {offer.departureTime}
          </div>
          {offer.estimatedArrival && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>→ {offer.estimatedArrival}</div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {formatDate(offer.date)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span>🚗 {offer.carMake} {offer.carModel}</span>
        <span>·</span>
        <span>👤 {offer.driver.realName}</span>
        {!canSeeDriverContact && (
          <span style={{ fontStyle: 'italic' }}>· 🔒 {t.phoneHidden}</span>
        )}
        {canSeeDriverContact && !isOwner && (
          <span>· {offer.driver.phone ?? ''}</span>
        )}
      </div>

      {/* Passengers list - only driver sees full list with contact + remove */}
      {isOwner && offer.joins.length > 0 && (
        <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {offer.joins.map(j => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', background: 'var(--color-background)', padding: '0.375rem 0.625rem', borderRadius: 'calc(var(--border-radius) * 0.6)', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>🧑‍🤝‍🧑 {j.user.realName} {j.user.phone ? `(${j.user.phone})` : ''} {j.seats > 1 ? `+${j.seats - 1}` : ''}</span>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                <ContactButton
                  name={j.user.realName}
                  phone={j.user.phone}
                  hasTelegram={j.user.hasTelegram}
                  hasWhatsapp={j.user.hasWhatsapp}
                  hasSignal={j.user.hasSignal}
                  hasSms={j.user.hasSms}
                  preferredIM={j.user.preferredIM}
                />
                {onRemovePassenger && (
                  <button
                    onClick={() => onRemovePassenger(offer.id, j.userId)}
                    className="btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem', color: 'var(--color-error)' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {offer.notes && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          "{offer.notes}"
        </div>
      )}

      <button
        onClick={() => setShowMap(!showMap)}
        className="btn-ghost"
        style={{ marginTop: '0.625rem', fontSize: '0.78rem', padding: '0.25rem 0.5rem' }}
      >
        🗺️ {showMap ? 'Skrýt mapu' : 'Zobrazit mapu'}
      </button>

      {showMap && (
        <div style={{ marginTop: '0.5rem' }}>
          <RideMap
            fromLat={offer.fromLat}
            fromLng={offer.fromLng}
            toLat={offer.toLat}
            toLng={offer.toLng}
            fromLabel={offer.fromAddress}
            toLabel={offer.toAddress}
          />
        </div>
      )}

      <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {!isOwner && !offer.isCancelled && !offer.isFull && !hasJoined && currentUserId && (
          <button
            onClick={() => onJoin?.(offer.id)}
            className="btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {t.joinOffer}
          </button>
        )}
        {!isOwner && hasJoined && (
          <>
            <button
              onClick={() => onCancelReservation?.(offer.id)}
              className="btn-danger"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              ✕ {t.cancelReservation}
            </button>
            <ContactButton
              name={offer.driver.realName}
              phone={offer.driver.phone}
              hasTelegram={offer.driver.hasTelegram}
              hasWhatsapp={offer.driver.hasWhatsapp}
              hasSignal={offer.driver.hasSignal}
              hasSms={offer.driver.hasSms}
              preferredIM={offer.driver.preferredIM}
            />
          </>
        )}
        {isOwner && !offer.isCancelled && (
          <>
            <button onClick={() => onEdit?.(offer)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              ✏️ {t.edit}
            </button>
            <button onClick={() => onDelete?.(offer.id)} className="btn-danger" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              🗑️ {t.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
