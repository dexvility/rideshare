'use client';

import { useState } from 'react';
import { LocationPicker } from '@/components/map/LocationPicker';
import { useLocale } from '@/app/providers';

interface RequestFormData {
  fromAddress: string; fromLat: number; fromLng: number;
  toAddress: string; toLat: number; toLng: number;
  date: string; desiredTime: string;
  passengerCount: number; notes: string;
  isFlexibleTime: boolean;
}

interface RequestRideFormProps {
  onClose: () => void;
  onSubmit: (data: RequestFormData) => Promise<void>;
  initial?: Partial<RequestFormData>;
  editMode?: boolean;
}

const WEDDING_DATE = '2026-09-19';

export function RequestRideForm({ onClose, onSubmit, initial, editMode }: RequestRideFormProps) {
  const { t } = useLocale();
  const [from, setFrom] = useState<{ address: string; lat: number; lng: number } | null>(
    initial?.fromAddress ? { address: initial.fromAddress, lat: initial.fromLat!, lng: initial.fromLng! } : null
  );
  const [to, setTo] = useState<{ address: string; lat: number; lng: number } | null>(
    initial?.toAddress ? { address: initial.toAddress, lat: initial.toLat!, lng: initial.toLng! } : null
  );
  const [date, setDate] = useState(initial?.date || WEDDING_DATE);
  const [desiredTime, setDesiredTime] = useState(initial?.desiredTime || '11:00');
  const [passengerCount, setPassengerCount] = useState(initial?.passengerCount || 1);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [isFlexibleTime, setIsFlexibleTime] = useState(initial?.isFlexibleTime || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) { setError(t.fillRequired); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        fromAddress: from.address, fromLat: from.lat, fromLng: from.lng,
        toAddress: to.address, toLat: to.lat, toLng: to.lng,
        date, desiredTime, passengerCount, notes, isFlexibleTime,
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
              {editMode ? `✏️ ${t.edit}` : `🙋 ${t.requestRide}`}
            </h2>
            <div className="accent-line" />
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '1.3rem', padding: '0.25rem' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LocationPicker label={`${t.from} *`} value={from} onChange={setFrom} />
          <LocationPicker label={`${t.to} *`} value={to} onChange={setTo} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.date} *</label>
              <input className="input-base" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.desiredTime} *</label>
              <input className="input-base" type="time" value={desiredTime} onChange={e => setDesiredTime(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.passengers}</label>
            <input className="input-base" type="number" min={1} max={8} value={passengerCount} onChange={e => setPassengerCount(parseInt(e.target.value))} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={isFlexibleTime} onChange={e => setIsFlexibleTime(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
            {t.isFlexibleTime}
          </label>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>{t.notes}</label>
            <textarea className="input-base" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t.placeholderNotesPassenger} />
          </div>

          {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">{t.cancel}</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '…' : editMode ? t.save : t.requestRide}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
