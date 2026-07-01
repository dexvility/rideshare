const NTFY_BASE = (process.env.NTFY_URL || 'https://ntfy.sh').replace(/\/$/, '');
const TOPIC_OFFERS   = 'svatba-jizdy-nabidky';
const TOPIC_REQUESTS = 'svatba-jizdy-poptavky';

export function personalTopic(userId: string) {
  return `jizdy-${userId}`;
}

export function ntfySubscribeUrl(topic: string) {
  return `${NTFY_BASE}/${topic}`;
}

// ── Global payload (new ride listing) ────────────────────────────────────────

interface GlobalPayload {
  kind: 'offer' | 'request';
  from: string;
  to: string;
  date: string;
  time: string;
  driverOrRequester: string;
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
  from: string;
  to: string;
  date: string;
  time: string;
  otherParty: string; // the name of the person who triggered the event
}

// ── Message builders ──────────────────────────────────────────────────────────

function buildGlobalMessage(p: GlobalPayload): { title: string; message: string; tags: string[] } {
  const kindLabel = p.kind === 'offer' ? 'nabídka jízdy' : 'poptávka jízdy';
  return {
    title: `Nová ${kindLabel}`,
    message: `${p.driverOrRequester}: ${p.from} → ${p.to} | ${p.date} ${p.time}`,
    tags: p.kind === 'offer' ? ['car'] : ['raised_hand'],
  };
}

function buildPersonalMessage(p: PersonalPayload): { title: string; message: string; tags: string[] } {
  const route = `${p.from} → ${p.to} | ${p.date} ${p.time}`;
  switch (p.event) {
    case 'passenger_joined':
      return { title: '🧑‍🤝‍🧑 Nový cestující', message: `${p.otherParty} se přihlásil/a k vaší jízdě\n${route}`, tags: ['busts_in_silhouette'] };
    case 'passenger_left':
      return { title: '🚪 Cestující odhlášen', message: `${p.otherParty} zrušil/a rezervaci ve vaší jízdě\n${route}`, tags: ['door'] };
    case 'you_were_removed':
      return { title: '❌ Byli jste odhlášeni', message: `Řidič vás odebral z jízdy\n${route}`, tags: ['x'] };
    case 'pickup_confirmed':
      return { title: '✅ Jízda potvrzena', message: `${p.otherParty} potvrdil/a, že vás vezme\n${route}`, tags: ['white_check_mark'] };
    case 'offer_updated':
      return { title: '✏️ Jízda upravena', message: `Řidič ${p.otherParty} upravil/a jízdu, na kterou jedete\n${route}`, tags: ['pencil'] };
    case 'offer_cancelled':
      return { title: '🚫 Jízda zrušena', message: `Řidič ${p.otherParty} zrušil/a jízdu, na kterou jste byli přihlášeni\n${route}`, tags: ['no_entry'] };
    case 'request_updated':
      return { title: '✏️ Poptávka upravena', message: `${p.otherParty} upravil/a poptávku, ke které jste se přihlásili\n${route}`, tags: ['pencil'] };
    case 'request_cancelled':
      return { title: '🚫 Poptávka zrušena', message: `${p.otherParty} zrušil/a poptávku, ke které jste se přihlásili\n${route}`, tags: ['no_entry'] };
  }
}

// ── Send helpers ──────────────────────────────────────────────────────────────

async function sendToTopic(topic: string, title: string, message: string, tags: string[]) {
  try {
    const res = await fetch(`${NTFY_BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ topic, title, message, tags }),
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
  const { title, message, tags } = buildGlobalMessage(payload);
  await sendToTopic(topic, title, message, tags);
}

/** Publish a personal interaction event to a specific user's topic. */
export async function notifyPersonal(userId: string, payload: PersonalPayload) {
  const { title, message, tags } = buildPersonalMessage(payload);
  await sendToTopic(personalTopic(userId), title, message, tags);
}

/** @deprecated Use notifyGlobal for new listings only. */
export async function notifyRide(payload: GlobalPayload) {
  await notifyGlobal(payload);
}
