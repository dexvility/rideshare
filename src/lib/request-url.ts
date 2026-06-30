import { NextRequest } from 'next/server';

/**
 * Returns the public base URL for server-side redirects.
 *
 * Priority:
 * 1. APP_URL env var (explicit, most reliable behind a reverse proxy)
 * 2. X-Forwarded-Proto + X-Forwarded-Host headers set by Traefik/nginx/etc.
 * 3. req.url as-is (direct / dev)
 */
export function getBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');

  const proto = req.headers.get('x-forwarded-proto') ?? new URL(req.url).protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

export function redirectTo(path: string, req: NextRequest) {
  return `${getBaseUrl(req)}${path}`;
}
