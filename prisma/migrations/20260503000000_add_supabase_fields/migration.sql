-- Add supabaseUserId to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "supabaseUserId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- Make passwordHash nullable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add trial + warning fields to Restaurant
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "trialStartsAt" TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "lastWarningSentAt" TIMESTAMP(3);
