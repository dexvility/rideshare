import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { randomUUID } from 'crypto';

const SESSION_COOKIE = 'rideshare_session';
const SESSION_DURATION_DAYS = 30;

export async function getSession() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: sessionId } });
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function createSession(userId: string): Promise<string> {
  const id = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({ data: { id, userId, expiresAt } });
  return id;
}

export function setSessionCookie(sessionId: string) {
  cookies().set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
}
