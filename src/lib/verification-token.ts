import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

export function generateToken(): { plain: string; hash: string } {
  const plain = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

export async function createVerificationToken(
  userId: string,
  type: 'email_verify' | 'password_reset',
  ttlMinutes = 60,
): Promise<string> {
  // Invalidate any existing token of the same type for this user
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const { plain, hash } = generateToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await prisma.verificationToken.create({ data: { userId, tokenHash: hash, type, expiresAt } });
  return plain;
}

export async function consumeVerificationToken(
  plain: string,
  type: 'email_verify' | 'password_reset',
) {
  const hash = createHash('sha256').update(plain).digest('hex');
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hash } });

  if (!record || record.type !== type || record.expiresAt < new Date()) {
    if (record) await prisma.verificationToken.delete({ where: { id: record.id } });
    return null;
  }

  await prisma.verificationToken.delete({ where: { id: record.id } });
  return record.userId;
}
