-- AlterTable: add self-referential mergedIntoId to Table for table group merging
ALTER TABLE "Table" ADD COLUMN "mergedIntoId" TEXT;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_mergedIntoId_fkey"
  FOREIGN KEY ("mergedIntoId") REFERENCES "Table"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
