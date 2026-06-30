'use client';

import { useEffect, useRef, useState } from 'react';
import { geocodeAddress, type GeoResult } from '@/lib/geo';
import { useLocale } from '@/app/providers';

interface LocationPickerProps {
  label: string;
  value: { address: string; lat: number; lng: number } | null;
  onChange: (v: { address: string; lat: number; lng: number }) => void;
}

export function LocationPicker({ label, value, onChange }: LocationPickerProps) {
  const { t } = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!showMap) return;
    if (mapInstanceRef.current) return;
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const initLat = value?.lat || 49.2049;
      const initLng = value?.lng || 17.2493;

      const map = L.map(mapRef.current!, { zoomControl: true }).setView([initLat, initLng], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current.getLatLng();
          const res = await reverseGeocode(pos.lat, pos.lng);
          onChange({ address: res, lat: pos.lat, lng: pos.lng });
          setQuery(res);
        });
      }

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', async () => {
            const pos = markerRef.current.getLatLng();
            const res = await reverseGeocode(pos.lat, pos.lng);
            onChange({ address: res, lat: pos.lat, lng: pos.lng });
            setQuery(res);
          });
        }
        const res = await reverseGeocode(lat, lng);
        onChange({ address: res, lat, lng });
        setQuery(res);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMap]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'rideshare-wedding/1.0' } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  function handleQueryChange(q: string) {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 3) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await geocodeAddress(q);
      setResults(r);
      setSearching(false);
    }, 400);
  }

  function selectResult(r: GeoResult) {
    onChange(r);
    setQuery(r.address);
    setResults([]);
    if (mapInstanceRef.current) {
      import('leaflet').then((L) => {
        mapInstanceRef.current.setView([r.lat, r.lng], 13);
        if (markerRef.current) {
          markerRef.current.setLatLng([r.lat, r.lng]);
        } else {
          markerRef.current = L.marker([r.lat, r.lng], { draggable: true }).addTo(mapInstanceRef.current);
        }
      });
    }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', color: 'var(--color-text)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-base"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t.placeholderSearchAddress}
          autoComplete="off"
        />
        {searching && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            …
          </span>
        )}
        {results.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 200,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.625rem 0.875rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
                className="hover:bg-gray-50"
              >
                📍 {r.address}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="btn-ghost"
        style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
      >
        {showMap ? '🗺️ Skrýt mapu' : '📌 Vybrat na mapě'}
      </button>

      {showMap && (
        <div style={{ marginTop: '0.5rem' }}>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
          <div ref={mapRef} style={{ height: '220px', width: '100%', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }} />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Klikněte na mapu nebo přetáhněte značku
          </p>
        </div>
      )}

      {value && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          ✓ {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
