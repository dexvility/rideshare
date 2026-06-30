const NTFY_BASE = process.env.NTFY_URL || 'https://ntfy.sh';
const TOPIC_OFFERS = 'svatba-jizdy-nabidky';
const TOPIC_REQUESTS = 'svatba-jizdy-poptavky';

type NotifyAction = 'created' | 'updated' | 'cancelled';
type RideKind = 'offer' | 'request';

interface NotifyPayload {
  kind: RideKind;
  action: NotifyAction;
  from: string;
  to: string;
  date: string;
  time: string;
  driverOrRequester: string;
}

function buildMessage(p: NotifyPayload, lang: 'cs' | 'en' = 'cs'): { title: string; message: string } {
  const actionLabel = {
    cs: { created: 'Nová', updated: 'Upravená', cancelled: 'Zrušená' },
    en: { created: 'New', updated: 'Updated', cancelled: 'Cancelled' },
  }[lang][p.action];

  const kindLabel = {
    cs: { offer: 'nabídka jízdy', request: 'poptávka jízdy' },
    en: { offer: 'ride offer', request: 'ride request' },
  }[lang][p.kind];

  const title = `${actionLabel} ${kindLabel}`;
  const message = `${p.driverOrRequester}: ${p.from} → ${p.to} | ${p.date} ${p.time}`;

  return { title, message };
}

async function sendToTopic(topic: string, title: string, message: string, tags: string[]) {
  try {
    // Use the JSON publish API instead of headers — ntfy's HTTP headers must be
    // ISO-8859-1/ASCII safe, which mangles Czech diacritics (ě š č ř ž ý á í é ů ú ň ť ď).
    // The JSON body is UTF-8 safe and ntfy renders it correctly.
    const res = await fetch(`${NTFY_BASE}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        topic,
        title,
        message,
        tags,
      }),
    });
    if (!res.ok) {
      console.error(`ntfy publish failed for topic ${topic}:`, res.status);
    }
  } catch (e) {
    console.error(`ntfy publish error for topic ${topic}:`, e);
  }
}

export async function notifyRide(payload: NotifyPayload) {
  const { title, message } = buildMessage(payload);
  const topic = payload.kind === 'offer' ? TOPIC_OFFERS : TOPIC_REQUESTS;
  const tags = payload.kind === 'offer' ? ['car'] : ['raised_hand'];

  await sendToTopic(topic, title, message, tags);
}
