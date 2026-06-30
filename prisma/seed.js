// prisma/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_DATA = process.env.DEMO_DATA === 'true';

const HONETICE = { address: 'Honětice 16, 768 13 Honětice', lat: 49.2049, lng: 17.2493 };

const CZECH_USERS = [
  { nickname: 'honza_k', realName: 'Jan Kovář', phone: '+420601111001', email: 'jan.kovar@example.cz', hasTelegram: true, hasWhatsapp: true, preferredIM: 'whatsapp' },
  { nickname: 'petra_n', realName: 'Petra Nováková', phone: '+420601111002', email: 'petra.novakova@example.cz', hasWhatsapp: true, hasSms: true },
  { nickname: 'martin_h', realName: 'Martin Horák', phone: '+420601111003', email: 'martin.horak@example.cz', hasTelegram: true, preferredIM: 'telegram' },
  { nickname: 'lucie_m', realName: 'Lucie Marková', phone: '+420601111004', email: 'lucie.markova@example.cz', hasSms: true, hasSignal: true, preferredIM: 'signal' },
  { nickname: 'tomas_s', realName: 'Tomáš Svoboda', phone: '+420601111005', email: 'tomas.svoboda@example.cz', hasWhatsapp: true },
  { nickname: 'eva_p', realName: 'Eva Procházková', phone: '+420601111006', email: 'eva.prochazkova@example.cz', hasTelegram: true, hasWhatsapp: true, preferredIM: 'telegram' },
];

const CITIES = [
  { address: 'Brno, náměstí Svobody', lat: 49.1922, lng: 16.6113 },
  { address: 'Praha, Václavské náměstí', lat: 50.0814, lng: 14.4275 },
  { address: 'Zlín, náměstí Míru', lat: 49.2236, lng: 17.6630 },
  { address: 'Uherské Hradiště, Masarykovo nám.', lat: 49.0682, lng: 17.4604 },
  { address: 'Olomouc, Horní náměstí', lat: 49.5938, lng: 17.2508 },
  { address: 'Kroměříž, Velké náměstí', lat: 49.2964, lng: 17.3942 },
];

const CARS = [
  { make: 'Škoda', model: 'Octavia' },
  { make: 'Volkswagen', model: 'Golf' },
  { make: 'Škoda', model: 'Superb' },
  { make: 'Toyota', model: 'Corolla' },
  { make: 'Hyundai', model: 'i30' },
  { make: 'Ford', model: 'Focus' },
];

const WEDDING_DATE = new Date('2026-09-19');

async function main() {
  // Always ensure default theme exists
  const themeExists = await prisma.themeConfig.findFirst();
  if (!themeExists) {
    await prisma.themeConfig.create({
      data: {
        config: {
          colorPrimary: '#2D5016',
          colorSecondary: '#8B6914',
          colorAccent: '#C8A951',
          colorBackground: '#FAFAF7',
          colorSurface: '#FFFFFF',
          colorText: '#1A1A1A',
          colorTextMuted: '#6B7280',
          colorBorder: '#E5E7EB',
          colorSuccess: '#16A34A',
          colorError: '#DC2626',
          fontDisplay: 'Playfair Display',
          fontBody: 'Inter',
          borderRadius: '0.75rem',
          appName: process.env.NEXT_PUBLIC_APP_NAME || 'Ride Share',
          heroEmoji: process.env.NEXT_PUBLIC_HERO_EMOJI || '🚗',
          h1Title: process.env.NEXT_PUBLIC_H1_TITLE || 'Ride Sharing',
          h2Subtitle: process.env.NEXT_PUBLIC_H2_SUBTITLE || 'Find or offer a ride',
        },
        customCss: '',
      },
    });
    console.log('✓ Default theme created');
  }

  if (!DEMO_DATA) {
    console.log('DEMO_DATA not set to true, skipping demo seed.');
    return;
  }

  // Check if rides already exist — don't re-seed
  const existingOffers = await prisma.rideOffer.count();
  if (existingOffers > 0) {
    console.log('Demo data already present, skipping seed.');
    return;
  }

  console.log('Seeding demo data...');

  // Create users
  const createdUsers = [];
  for (const u of CZECH_USERS) {
    const user = await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: { ...u, notifyOffers: true, notifyRequests: false },
    });
    createdUsers.push(user);
  }
  console.log(`✓ ${createdUsers.length} demo users created`);

  // Rides TO Honětice (drivers coming from cities)
  const toHoneticOffers = [
    { driverIdx: 0, fromIdx: 0, seats: 3, time: '11:00', car: CARS[0], allowsDetours: true, fee: 0 },
    { driverIdx: 1, fromIdx: 1, seats: 2, time: '10:00', car: CARS[2], allowsDetours: false, fee: 150 },
    { driverIdx: 2, fromIdx: 2, seats: 4, time: '11:30', car: CARS[1], allowsDetours: true, fee: 0 },
    { driverIdx: 4, fromIdx: 3, seats: 2, time: '12:00', car: CARS[4], allowsDetours: false, fee: 50 },
  ];

  for (const o of toHoneticOffers) {
    const from = CITIES[o.fromIdx];
    await prisma.rideOffer.create({
      data: {
        driverId: createdUsers[o.driverIdx].id,
        fromAddress: from.address,
        fromLat: from.lat,
        fromLng: from.lng,
        toAddress: HONETICE.address,
        toLat: HONETICE.lat,
        toLng: HONETICE.lng,
        date: WEDDING_DATE,
        departureTime: o.time,
        estimatedArrival: bumpTime(o.time, estimateDriveMinutes(from.lat, from.lng, HONETICE.lat, HONETICE.lng)),
        totalSeats: o.seats,
        availableSeats: o.seats,
        carMake: o.car.make,
        carModel: o.car.model,
        allowsDetours: o.allowsDetours,
        fee: o.fee,
      },
    });
  }
  console.log(`✓ ${toHoneticOffers.length} ride offers TO Honětice`);

  // Rides FROM Honětice (return trips)
  const fromHoneticOffers = [
    { driverIdx: 3, toIdx: 0, seats: 3, time: '23:00', car: CARS[3], allowsDetours: true, fee: 0 },
    { driverIdx: 5, toIdx: 2, seats: 2, time: '22:30', car: CARS[5], allowsDetours: false, fee: 80 },
    { driverIdx: 0, toIdx: 4, seats: 2, time: '00:00', car: CARS[0], allowsDetours: false, fee: 0 },
  ];

  for (const o of fromHoneticOffers) {
    const to = CITIES[o.toIdx];
    await prisma.rideOffer.create({
      data: {
        driverId: createdUsers[o.driverIdx].id,
        fromAddress: HONETICE.address,
        fromLat: HONETICE.lat,
        fromLng: HONETICE.lng,
        toAddress: to.address,
        toLat: to.lat,
        toLng: to.lng,
        date: WEDDING_DATE,
        departureTime: o.time,
        estimatedArrival: bumpTime(o.time, estimateDriveMinutes(HONETICE.lat, HONETICE.lng, to.lat, to.lng)),
        totalSeats: o.seats,
        availableSeats: o.seats,
        carMake: o.car.make,
        carModel: o.car.model,
        allowsDetours: o.allowsDetours,
        fee: o.fee,
      },
    });
  }
  console.log(`✓ ${fromHoneticOffers.length} ride offers FROM Honětice`);

  // Ride requests TO Honětice
  const toHoneticRequests = [
    { requesterIdx: 1, fromIdx: 5, time: '10:30', passengers: 2 },
    { requesterIdx: 3, fromIdx: 3, time: '11:00', passengers: 1 },
  ];

  for (const r of toHoneticRequests) {
    const from = CITIES[r.fromIdx];
    await prisma.rideRequest.create({
      data: {
        requesterId: createdUsers[r.requesterIdx].id,
        fromAddress: from.address,
        fromLat: from.lat,
        fromLng: from.lng,
        toAddress: HONETICE.address,
        toLat: HONETICE.lat,
        toLng: HONETICE.lng,
        date: WEDDING_DATE,
        desiredTime: r.time,
        passengerCount: r.passengers,
      },
    });
  }

  // Ride requests FROM Honětice
  const fromHoneticRequests = [
    { requesterIdx: 2, toIdx: 0, time: '23:30', passengers: 1 },
    { requesterIdx: 4, toIdx: 1, time: '22:00', passengers: 3 },
  ];

  for (const r of fromHoneticRequests) {
    const to = CITIES[r.toIdx];
    await prisma.rideRequest.create({
      data: {
        requesterId: createdUsers[r.requesterIdx].id,
        fromAddress: HONETICE.address,
        fromLat: HONETICE.lat,
        fromLng: HONETICE.lng,
        toAddress: to.address,
        toLat: to.lat,
        toLng: to.lng,
        date: WEDDING_DATE,
        desiredTime: r.time,
        passengerCount: r.passengers,
      },
    });
  }

  console.log('✓ Ride requests seeded');
  console.log('✅ Demo data seeding complete!');
}

function estimateDriveMinutes(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distKm = 2 * R * Math.asin(Math.sqrt(a));
  return Math.round((distKm * 1.4) / 50 * 60);
}

function bumpTime(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
