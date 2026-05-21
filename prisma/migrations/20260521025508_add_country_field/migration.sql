-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'CA',
ALTER COLUMN "currency" SET DEFAULT 'CAD';
