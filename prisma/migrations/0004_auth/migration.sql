-- Make phone nullable (Google OAuth users start without one)
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- New auth columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT true;

-- Verification tokens (email verify + password reset)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "VerificationToken_userId_idx" ON "VerificationToken"("userId");

ALTER TABLE "VerificationToken"
    DROP CONSTRAINT IF EXISTS "VerificationToken_userId_fkey";
ALTER TABLE "VerificationToken"
    ADD CONSTRAINT "VerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OIDC linked accounts
CREATE TABLE IF NOT EXISTS "OidcAccount" (
    "id"       TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sub"      TEXT NOT NULL,
    CONSTRAINT "OidcAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OidcAccount_provider_sub_key" ON "OidcAccount"("provider", "sub");
CREATE INDEX IF NOT EXISTS "OidcAccount_userId_idx" ON "OidcAccount"("userId");

ALTER TABLE "OidcAccount"
    DROP CONSTRAINT IF EXISTS "OidcAccount_userId_fkey";
ALTER TABLE "OidcAccount"
    ADD CONSTRAINT "OidcAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
