const NTFY_BASE = (process.env.NTFY_URL || 'https://ntfy.sh').replace(/\/$/, '');
const TOPIC_OFFERS   = 'svatba-jizdy-nabidky';
const TOPIC_REQUESTS = 'svatba-jizdy-poptavky';
const APP_URL = process.env.APP_URL?.replace(/\/$/, '') ?? null;

export function personalTopic(userId: string) {
  return `jizdy-${userId}`;
}

export function ntfySubscribeUrl(topic: string) {
  return `${NTFY_BASE}/${topic}`;
}

/** "Brno, okres Brno-město, South Moravian Region, Czechia" → "Brno, okres Brno-město" */
function shortAddress(full: string): string {
  const parts = full.split(', ');
  const okresIdx = parts.findIndex(p => p.toLowerCase().startsWith('okres'));
  if (okresIdx !== -1) return parts.slice(0, okresIdx + 1).join(', ');
  return parts.slice(0, 2).join(', ');
}

// ── Global payload (new ride listing) ────────────────────────────────────────

interface GlobalPayload {
  kind: 'offer' | 'request';
  rideId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  driverOrRequester: string;
  seats?: number;
}

// ── Personal payload (booking interactions) ───────────────────────────────────

type PersonalEvent =
  | 'passenger_joined'      // someone booked a seat on your offer
  | 'passenger_left'        // passenger cancelled their own booking on your offer
  | 'you_were_removed'      // driver removed you from their offer
  | 'pickup_confirmed'      // driver confirmed to pick you up from your request
  | 'offer_updated'         // an offer you're on was edited by the driver
  | 'offer_cancelled'       // an offer you're on was cancelled by the driver
  | 'request_updated'       // a request you confirmed was edited by the requester
  | 'request_cancelled';    // a request you confirmed was cancelled by the requester

interface PersonalPayload {
  event: PersonalEvent;
  rideId: string;
  rideType: 'offer' | 'request';
  from: string;
  to: string;
  date: string;
  time: string;
  otherParty: string;
}

// ── Message builders ──────────────────────────────────────────────────────────

type NtfyMessage = {
  title: string;
  message: string;
  tags: string[];
  click?: string;
  actions?: Array<{ action: 'view'; label: string; url: string }>;
};

function viewAction(label: string, url: string) {
  return { action: 'view' as const, label, url };
}

function buildGlobalMessage(p: GlobalPayload): NtfyMessage {
  const from = shortAddress(p.from);
  const to = shortAddress(p.to);
  const route = `${from} → ${to} | ${p.date} ${p.time}`;

  if (p.kind === 'offer') {
    const seats = p.seats ?? 1;
    const seatsLabel = seats === 1 ? '1 místo' : `${seats} místa`;
    const url = APP_URL ? `${APP_URL}/rides/offers/${p.rideId}?action=book` : null;
    return {
      title: 'Nová nabídka jízdy',
      message: `${p.driverOrRequester} nabízí ${seatsLabel} z ${route}. Klikněte pro rezervaci.`,
      tags: ['car'],
      ...(url && { click: url, actions: [viewAction('Rezervovat jízdu', url)] }),
    };
  } else {
    const url = APP_URL ? `${APP_URL}/rides/requests/${p.rideId}?action=pickup` : null;
    return {
      title: 'Nová poptávka jízdy',
      message: `${p.driverOrRequester} hledá odvoz z ${route}. Klikněte pro nabídnutí jízdy.`,
      tags: ['raised_hand'],
      ...(url && { click: url, actions: [viewAction('Vzít je s sebou', url)] }),
    };
  }
}

function buildPersonalMessage(p: PersonalPayload): NtfyMessage {
  const from = shortAddress(p.from);
  const to = shortAddress(p.to);
  const route = `${from} → ${to} | ${p.date} ${p.time}`;
  const rideUrl = APP_URL ? `${APP_URL}/rides/${p.rideType}s/${p.rideId}` : null;
  const openAction = rideUrl ? [viewAction('Otevřít jízdu', rideUrl)] : undefined;

  switch (p.event) {
    case 'passenger_joined':
      return {
        title: '🧑‍🤝‍🧑 Nový cestující',
        message: `${p.otherParty} se přihlásil/a k vaší jízdě z ${route}.`,
        tags: ['busts_in_silhouette'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'passenger_left':
      return {
        title: '🚪 Cestující odhlášen',
        message: `${p.otherParty} zrušil/a rezervaci ve vaší jízdě z ${route}.`,
        tags: ['door'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'you_were_removed':
      return {
        title: '❌ Byli jste odhlášeni',
        message: `Řidič vás odebral z jízdy z ${route}.`,
        tags: ['x'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'pickup_confirmed':
      return {
        title: '✅ Jízda potvrzena',
        message: `${p.otherParty} potvrdil/a, že vás vezme z ${route}.`,
        tags: ['white_check_mark'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'offer_updated':
      return {
        title: '✏️ Jízda upravena',
        message: `Řidič ${p.otherParty} upravil/a jízdu z ${route}.`,
        tags: ['pencil'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'offer_cancelled':
      return {
        title: '🚫 Jízda zrušena',
        message: `Řidič ${p.otherParty} zrušil/a jízdu z ${route}.`,
        tags: ['no_entry'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'request_updated':
      return {
        title: '✏️ Poptávka upravena',
        message: `${p.otherParty} upravil/a poptávku z ${route}.`,
        tags: ['pencil'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
    case 'request_cancelled':
      return {
        title: '🚫 Poptávka zrušena',
        message: `${p.otherParty} zrušil/a poptávku z ${route}.`,
        tags: ['no_entry'],
        ...(rideUrl && { click: rideUrl, actions: openAction }),
      };
  }
}

// ── Send helpers ──────────────────────────────────────────────────────────────

async function sendToTopic(topic: string, msg: NtfyMessage) {
  try {
    const res = await fetch(`${NTFY_BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ topic, ...msg }),
    });
    if (!res.ok) console.error(`ntfy publish failed for topic ${topic}:`, res.status);
  } catch (e) {
    console.error(`ntfy publish error for topic ${topic}:`, e);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Publish a new ride listing to the global discovery topic. Only for 'created'. */
export async function notifyGlobal(payload: GlobalPayload) {
  const topic = payload.kind === 'offer' ? TOPIC_OFFERS : TOPIC_REQUESTS;
  await sendToTopic(topic, buildGlobalMessage(payload));
}

/** Publish a personal interaction event to a specific user's topic. */
export async function notifyPersonal(userId: string, payload: PersonalPayload) {
  await sendToTopic(personalTopic(userId), buildPersonalMessage(payload));
}

/** @deprecated Use notifyGlobal for new listings only. */
export async function notifyRide(payload: GlobalPayload) {
  await notifyGlobal(payload);
}
