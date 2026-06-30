'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from '@/app/providers';
import { shortenAddress } from '@/lib/geo';
import type { RideRequest, User } from '@prisma/client';

const RideMap = dynamic(() => import('@/components/map/RideMap').then(m => ({ default: m.RideMap })), { ssr: false });

interface RequestWithUser extends RideRequest {
  requester: User;
}

interface RideRequestCardProps {
  request: RequestWithUser;
  currentUserId?: string;
  onIWillTakeYou?: (requestId: string) => void;
  onEdit?: (request: RequestWithUser) => void;
  onDelete?: (requestId: string) => void;
}

export function RideRequestCard({ request, currentUserId, onIWillTakeYou, onEdit, onDelete }: RideRequestCardProps) {
  const { t } = useLocale();
  const [showMap, setShowMap] = useState(false);
  const isOwner = currentUserId === request.requesterId;
  const isGreyedOut = request.isFulfilled && !isOwner;

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        borderLeft: '3px solid var(--color-accent)',
        opacity: isGreyedOut ? 0.55 : 1,
        filter: isGreyedOut ? 'grayscale(0.3)' : 'none',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
            {request.isFulfilled && <span className="badge badge-gray">🚗 {t.pickedUp}</span>}
            {request.isCancelled && <span className="badge badge-gray">{t.cancelled}</span>}
            {!request.isFulfilled && !request.isCancelled && (
              <span className="badge badge-yellow">🙋 Hledá jízdu</span>
            )}
            <span className="badge badge-gray">
              {request.passengerCount} {request.passengerCount === 1 ? 'osoba' : request.passengerCount < 5 ? 'osoby' : 'osob'}
            </span>
            {request.isFlexibleTime && (
              <span className="badge" style={{ background: 'rgba(45,80,22,0.1)', color: 'var(--color-primary)', fontSize: '0.7rem' }}>
                🕐 {t.flexibleTimeTag}
              </span>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} title={request.fromAddress}>
              <span style={{ color: 'var(--color-success)' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenAddress(request.fromAddress)}</span>
            </div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', paddingLeft: '1.25rem', margin: '0.1rem 0' }}>↓</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }} title={request.toAddress}>
              <span style={{ color: 'var(--color-error)' }}>●</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortenAddress(request.toAddress)}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-secondary)', fontFamily: 'var(--font-display), Georgia, serif' }}>
            {request.desiredTime}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {formatDate(request.date)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span>👤 {request.requester.realName}</span>
      </div>

      {request.notes && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          "{request.notes}"
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
            fromLat={request.fromLat}
            fromLng={request.fromLng}
            toLat={request.toLat}
            toLng={request.toLng}
            fromLabel={request.fromAddress}
            toLabel={request.toAddress}
          />
        </div>
      )}

      <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {!isOwner && !request.isCancelled && !request.isFulfilled && currentUserId && (
          <button
            onClick={() => onIWillTakeYou?.(request.id)}
            className="btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            🚗 {t.iWillTakeYou}
          </button>
        )}
        {isOwner && !request.isCancelled && (
          <>
            <button onClick={() => onEdit?.(request)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              ✏️ {t.edit}
            </button>
            <button onClick={() => onDelete?.(request.id)} className="btn-danger" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              🗑️ {t.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
