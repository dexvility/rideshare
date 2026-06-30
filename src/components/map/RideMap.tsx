'use client';

import { useEffect, useRef, useState } from 'react';

interface RideMapProps {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromLabel?: string;
  toLabel?: string;
}

export function RideMap({ fromLat, fromLng, toLat, toLng, fromLabel, toLabel }: RideMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const fromMarkerRef = useRef<any>(null);
  const toMarkerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      // Fix Leaflet default icon path
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const midLat = (fromLat + toLat) / 2;
      const midLng = (fromLng + toLng) / 2;

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([midLat, midLng], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      const greenIcon = L.divIcon({
        html: `<div style="background:var(--color-success);width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [12, 12],
        className: '',
      });

      const redIcon = L.divIcon({
        html: `<div style="background:var(--color-error);width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [12, 12],
        className: '',
      });

      fromMarkerRef.current = L.marker([fromLat, fromLng], { icon: greenIcon })
        .addTo(map)
        .bindPopup(fromLabel || 'Výjezd');

      toMarkerRef.current = L.marker([toLat, toLng], { icon: redIcon })
        .addTo(map)
        .bindPopup(toLabel || 'Cíl');

      // Fit bounds
      const bounds = L.latLngBounds([[fromLat, fromLng], [toLat, toLng]]);
      map.fitBounds(bounds, { padding: [24, 24] });

      mapInstanceRef.current = map;
      setReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [fromLat, fromLng, toLat, toLng]);

  function zoomTo(lat: number, lng: number) {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([lat, lng], 13, { animate: true });
  }

  function zoomFit() {
    if (!mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    import('leaflet').then((L) => {
      const bounds = L.latLngBounds([[fromLat, fromLng], [toLat, toLng]]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] });
    });
  }

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapRef}
        style={{
          height: '160px',
          width: '100%',
          borderRadius: 'var(--border-radius)',
          background: '#e8e8e8',
        }}
      />
      {ready && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            onClick={() => zoomTo(fromLat, fromLng)}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.375rem' }}
          >
            🟢 Nástup
          </button>
          <button
            onClick={() => zoomTo(toLat, toLng)}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.375rem' }}
          >
            🔴 Výstup
          </button>
          <button
            onClick={zoomFit}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.375rem' }}
          >
            🗺️ Celá
          </button>
        </div>
      )}
    </div>
  );
}
