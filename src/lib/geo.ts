export interface GeoResult {
  address: string;
  lat: number;
  lng: number;
}

export async function geocodeAddress(query: string): Promise<GeoResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'cz,sk');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'rideshare-wedding-app/1.0' },
  });

  if (!res.ok) return [];
  const data = await res.json();

  return data.map((item: any) => ({
    address: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function estimateDriveMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distKm = haversineKm(lat1, lng1, lat2, lng2);
  // road factor 1.4, average 60 km/h
  return Math.round((distKm * 1.4 / 60) * 60);
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function formatDate(date: Date | string, locale: string = 'cs-CZ'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Shortens a Nominatim-style full address ("Honětice 16, 768 13 Honětice, okres
// Kroměříž, Zlínský kraj, Česko") down to just the city/village and district
// ("Honětice, okres Kroměříž") for compact display on ride tiles. Falls back to
// the original string if it doesn't look like a Nominatim address.
export function shortenAddress(address: string): string {
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return address;

  // Find the district part ("okres X") if present
  const districtPart = parts.find(p => /^okres\s/i.test(p));

  // Find a city/village-like part: prefer a part that contains letters and
  // isn't a postal code, house number, or "Česko"/"Česká republika".
  const cityPart = parts.find(p =>
    !/^okres\s/i.test(p) &&
    !/^\d+$/.test(p) &&
    !/^\d{3}\s?\d{2}/.test(p) &&
    !/^(Česko|Česká republika)$/i.test(p) &&
    !/kraj$/i.test(p)
  );

  if (cityPart && districtPart) return `${cityPart}, ${districtPart}`;
  if (cityPart) return cityPart;
  return parts[0];
}
