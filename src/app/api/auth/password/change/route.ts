import { NextRequest, NextResponse } from 'next/server';
import { AUTH_MODE } from '@/lib/auth-config';
import { getSession } from '@/lib/session';
import { verifyPassword, hashPassword, isStrongPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  if (AUTH_MODE !== 'password') {
    return NextResponse.json({ error: 'Password auth is disabled' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || !isStrongPassword(newPassword)) {
    return NextResponse.json({ error: 'passwordTooWeak' }, { status: 400 });
  }

  const user = session.user;

  // If user has an existing password, verify it. Google-only users can set a password
  // without a current password.
  if (user.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'fillRequired' }, { status: 400 });
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'invalidCredentials' }, { status: 401 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
