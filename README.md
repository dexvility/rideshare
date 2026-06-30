# Ride Share

A self-hosted ride-sharing coordination app for events — weddings, conferences, retreats, or any gathering where attendees need to organize carpools. Built with Next.js, PostgreSQL, and OpenStreetMap.

Attendees can:
- **Offer a ride**, listing seats, a car, departure time, and whether they're willing to detour to pick someone up
- **Request a ride**, specifying where they need to go and when
- Browse all open offers and requests on a map
- Join an existing offer, or have a driver confirm they'll pick up a specific request
- Get push notifications (via [ntfy.sh](https://ntfy.sh)) when new offers or requests are posted

The whole thing is designed to be spun up for a single event, customized via an admin panel (colors, fonts, branding text), and torn down afterward — no ongoing infrastructure commitment required.

---

## ⚠️ A note on authentication

**This app deliberately has no real authentication.** Signing in only requires a name and a phone number — there's no password, no verification code, no proof that you are who you say you are. Once "logged in," a session cookie persists on that device.

This is an intentional tradeoff, not an oversight: for a small, trusted group of event attendees, the friction of password resets and email verification isn't worth it. The practical consequence is that **anyone who knows or guesses another attendee's phone number can sign in as them**, see their rides, and edit or cancel them.

Don't use this for anything where that risk is unacceptable. It's built for "a few dozen people coordinating rides to the same wedding," not for any setting with adversarial users or sensitive data.

---

## Quick start (local, no reverse proxy)

This is the fastest way to try it out. It runs entirely on your machine with no TLS and no public exposure.

### 1. Clone and configure

```bash
git clone <this-repo-url> rideshare
cd rideshare
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description | Generate with |
|---|---|---|
| `POSTGRES_PASSWORD` | Database password | `openssl rand -hex 24` |
| `ADMIN_SECRET` | Token for the `/admin` panel | `openssl rand -hex 32` |
| `DEMO_DATA` | `true` to seed sample users and rides, `false` for a clean start | — |
| `APP_NAME`, `HERO_EMOJI`, `H1_TITLE`, `H2_SUBTITLE` | Initial branding text (editable later from `/admin`) | — |

### 2. Run it

```bash
docker compose up -d --build
```

The app will be available at **http://localhost:3000**.

That's it — no domain, no proxy, no TLS certificate needed for local use or testing.

---

## Architecture

```
docker compose up
    │
    ▼
rideshare (Next.js, port 3000)
    │
    ▼
rideshare-db (PostgreSQL 16)
```

- **Data persistence:** bind-mounted to `./data/pgdata` (database) and `./data/cache` (Next.js build cache), both relative to the repo root.
- **Migrations:** run automatically on container startup via `prisma migrate deploy`. This is safe to re-run — it only applies new migrations and never touches existing data.
- **Seeding:** runs automatically on startup, but only inserts demo data if `DEMO_DATA=true` **and** the rides table is currently empty. A populated database is never overwritten.

---

## Deploying behind a reverse proxy

For a real public deployment you'll want TLS and a domain. The app itself doesn't change — only how you expose port 3000. Below are the three most common setups.

### Traefik

If you already run Traefik with a `letsencrypt` (or similarly named) certificate resolver and an external Docker network it watches:

```yaml
services:
  rideshare:
    # ...same as docker-compose.yml, minus the `ports:` block...
    networks:
      - proxy
      - default
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rideshare.rule=Host(`rides.example.com`)"
      - "traefik.http.routers.rideshare.entrypoints=websecure"
      - "traefik.http.routers.rideshare.tls.certresolver=letsencrypt"
      - "traefik.http.services.rideshare.loadbalancer.server.port=3000"
      - "traefik.docker.network=proxy"

networks:
  proxy:
    external: true
```

Remove the `ports:` mapping from the `rideshare` service — Traefik talks to the container directly over the Docker network, so the port doesn't need to be published to the host.

### Caddy

Caddy's automatic HTTPS makes this the least config-heavy option. Run Caddy on the host (or in its own container on the same Docker network) with a `Caddyfile`:

```
rides.example.com {
    reverse_proxy localhost:3000
}
```

Keep the `ports: ["3000:3000"]` mapping in `docker-compose.yml` so Caddy on the host can reach it, or put both in the same Docker network and use `reverse_proxy rideshare:3000` instead if Caddy is containerized.

### nginx

```nginx
server {
    listen 443 ssl;
    server_name rides.example.com;

    ssl_certificate     /etc/letsencrypt/live/rides.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rides.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain the certificate with `certbot` (or your preferred ACME client) as usual, then keep the `ports: ["3000:3000"]` mapping so nginx on the host can reach the container.

---

## Updating

```bash
git pull
docker compose up -d --build
```

Migrations run automatically as part of container startup — no manual database steps required.

---

## Admin panel

Available at `/admin`.

- Log in with the token set in `ADMIN_SECRET`
- Edit the color scheme, fonts, border radius, and app branding (name, emoji, headings) with a live preview
- Add arbitrary custom CSS
- All changes are saved to the database and take effect immediately for all visitors

---

## Push notifications (ntfy.sh)

The app publishes to two topics:
- `<your-topic>-nabidky` — when a ride **offer** is created, edited, or cancelled
- `<your-topic>-poptavky` — when a ride **request** is created, edited, or cancelled

(Topic names are currently fixed in `src/lib/ntfy.ts` — adjust them there if you want different naming.)

Attendees install [ntfy.sh](https://ntfy.sh) and subscribe to one or both topics from their profile page, which shows the exact topic names and a download link. To self-host ntfy instead of using the public server, set `NTFY_URL=https://ntfy.yourdomain.com` in `.env`.

---

## Local development

```bash
# Requires a running PostgreSQL instance
cp .env.example .env.local
# Edit DATABASE_URL to point at your local Postgres

npm install
npx prisma migrate deploy
DEMO_DATA=true node prisma/seed.js
npm run dev
```

---

## Project structure

```
rideshare/
├── prisma/
│   ├── schema.prisma         # Data model
│   ├── seed.js                # Demo data (gated behind DEMO_DATA=true)
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home page (server component)
│   │   ├── HomeClient.tsx     # Home page (client component, modals)
│   │   ├── auth/page.tsx      # Sign in / registration
│   │   ├── my-rides/          # "My rides" — offers, requests, passenger view
│   │   ├── profile/           # User profile and notification settings
│   │   ├── admin/             # Admin panel (theme/branding editor)
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── map/                # Leaflet/OSM components
│   │   ├── rides/              # Ride cards and forms
│   │   └── ui/                 # NavBar, PWA banner, contact button, toast
│   ├── lib/
│   │   ├── prisma.ts           # DB client
│   │   ├── session.ts          # Session management (see auth note above)
│   │   ├── ntfy.ts              # Push notifications
│   │   ├── geo.ts               # Geocoding, distance, address formatting
│   │   └── theme.ts             # CSS variables and branding, sourced from DB
│   └── i18n/translations.ts    # Localization (currently English + Czech)
├── docker-compose.yml          # Local, proxy-less deployment
├── Dockerfile
└── docker-entrypoint.sh        # migrate → seed → start
```
