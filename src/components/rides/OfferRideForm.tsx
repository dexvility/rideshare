'use client';

import { useState, useEffect } from 'react';
import { LocationPicker } from '@/components/map/LocationPicker';
import { estimateDriveMinutes, addMinutesToTime } from '@/lib/geo';
import { useLocale } from '@/app/providers';

interface OfferFormData {
  fromAddress: string; fromLat: number; fromLng: number;
  toAddress: string; toLat: number; toLng: number;
  date: string; departureTime: string; estimatedArrival: string;
  totalSeats: number; carMake: string; carModel: string;
  allowsDetours: boolean; fee: number; notes: string;
  isReturnRide?: boolean;
  isFlexibleTime: boolean;
}

interface OfferRideFormProps {
  onClose: () => void;
  onSubmit: (data: OfferFormData) => Promise<void>;
  initial?: Partial<OfferFormData>;
  editMode?: boolean;
}

const WEDDING_DATE = '2026-09-19';

export function OfferRideForm({ onClose, onSubmit, initial, editMode }: OfferRideFormProps) {
  const { t } = useLocale();
  const [from, setFrom] = useState<{ address: string; lat: number; lng: number } | null>(
    initial?.fromAddress ? { address: initial.fromAddress, lat: initial.fromLat!, lng: initial.fromLng! } : null
  );
  const [to, setTo] = useState<{ address: string; lat: number; lng: number } | null>(
    initial?.toAddress ? { address: initial.toAddress, lat: initial.toLat!, lng: initial.toLng! } : null
  );
  const [date, setDate] = useState(initial?.date || WEDDING_DATE);
  const [departureTime, setDepartureTime] = useState(initial?.departureTime || '11:00');
  const [estimatedArrival, setEstimatedArrival] = useState(initial?.estimatedArrival || '');
  const [arrivalEditable, setArrivalEditable] = useState(false);
  const [totalSeats, setTotalSeats] = useState(initial?.totalSeats || 3);
  const [carMake, setCarMake] = useState(initial?.carMake || '');
  const [carModel, setCarModel] = useState(initial?.carModel || '');
  const [allowsDetours, setAllowsDetours] = useState(initial?.allowsDetours || false);
  const [isFlexibleTime, setIsFlexibleTime] = useState(initial?.isFlexibleTime || false);
  const [fee, setFee] = useState(initial?.fee || 0);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When opened with prefilled from/to/time (e.g. return-ride prefill) but no
  // arrival estimate yet, calculate it once on mount.
  useEffect(() => {
    if (from && to && !estimatedArrival && !arrivalEditable) {
      const mins = estimateDriveMinutes(from.lat, from.lng, to.lat, to.lng);
      setEstimatedArrival(addMinutesToTime(departureTime, mins));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateEstimate(f: typeof from, tgt: typeof to, depTime: string) {
    if (f && tgt && !arrivalEditable) {
      const mins = estimateDriveMinutes(f.lat, f.lng, tgt.lat, tgt.lng);
      setEstimatedArrival(addMinutesToTime(depTime, mins));
    }
  }

  function handleFromChange(v: { address: string; lat: number; lng: number }) {
    setFrom(v);
    updateEstimate(v, to, departureTime);
  }

  function handleToChange(v: { address: string; lat: number; lng: number }) {
    setTo(v);
    updateEstimate(from, v, departureTime);
  }

  function handleTimeChange(v: string) {
    setDepartureTime(v);
    updateEstimate(from, to, v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !carMake || !carModel) {
      setError(t.fillRequired);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        fromAddress: from.address, fromLat: from.lat, fromLng: from.lng,
        toAddress: to.address, toLat: to.lat, toLng: to.lng,
        date, departureTime, estimatedArrival,
        totalSeats, carMake, carModel, allowsDetours, fee, notes,
        isReturnRide: initial?.isReturnRide,
        isFlexibleTime,
      });
    } catch (err: any) {
      setError(err.message || 'Chyba');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '1.4rem', fontWeight: 700 }}>
              {editMode ? `✏️ ${t.edit}` : `🚗 ${t.offerRide}`}
            </h2>
            <div className="accent-line" />
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '1.3rem', padding: '0.25rem' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LocationPicker label={`${t.from} *`} value={from} onChange={handleFromChange} />
          <LocationPicker label={`${t.to} *`} value={to} onChange={handleToChange} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.date} *</label>
              <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.departureTime} *</label>
              <input className="input-base" type="time" value={departureTime} onChange={e => handleTimeChange(e.target.value)} required />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t.estimatedArrival}</label>
              {!arrivalEditable && (
                <button
                  type="button"
                  onClick={() => setArrivalEditable(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {t.edit}
                </button>
              )}
            </div>
            <input
              className="input-base"
              type="time"
              value={estimatedArrival}
              onChange={e => setEstimatedArrival(e.target.value)}
              readOnly={!arrivalEditable}
              style={!arrivalEditable ? { background: 'var(--color-background)', color: 'var(--color-text-muted)', cursor: 'default' } : undefined}
            />
            {!arrivalEditable && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{t.arrivalAutoHint}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.seats} *</label>
              <input className="input-base" type="number" min={1} max={8} value={totalSeats} onChange={e => setTotalSeats(parseInt(e.target.value))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.carMake} *</label>
              <input className="input-base" value={carMake} onChange={e => setCarMake(e.target.value)} placeholder={t.placeholderCarMake} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.carModel} *</label>
              <input className="input-base" value={carModel} onChange={e => setCarModel(e.target.value)} placeholder={t.placeholderCarModel} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.fee}</label>
            <input className="input-base" type="number" min={0} step={10} value={fee} onChange={e => setFee(parseInt(e.target.value) || 0)} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{t.feeHint}</p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={allowsDetours} onChange={e => setAllowsDetours(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
            {t.allowsDetours}
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={isFlexibleTime} onChange={e => setIsFlexibleTime(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
            {t.isFlexibleTime}
          </label>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.notes}</label>
            <textarea className="input-base" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t.placeholderNotesDriver} />
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '…' : editMode ? t.save : t.offerRide}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
