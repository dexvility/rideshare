-- Make email optional
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Add isReturnRide to RideOffer
ALTER TABLE "RideOffer" ADD COLUMN IF NOT EXISTS "isReturnRide" BOOLEAN NOT NULL DEFAULT false;

-- Add fulfilledByOfferId to RideRequest
ALTER TABLE "RideRequest" ADD COLUMN IF NOT EXISTS "fulfilledByOfferId" TEXT;

-- Create OfferJoinPassenger table
CREATE TABLE IF NOT EXISTS "OfferJoinPassenger" (
    "id" TEXT NOT NULL,
    "offerJoinId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferJoinPassenger_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'OfferJoinPassenger_offerJoinId_fkey'
  ) THEN
    ALTER TABLE "OfferJoinPassenger"
      ADD CONSTRAINT "OfferJoinPassenger_offerJoinId_fkey"
      FOREIGN KEY ("offerJoinId") REFERENCES "OfferJoin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
