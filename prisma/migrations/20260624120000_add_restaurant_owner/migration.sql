-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "ownerId" INTEGER;

-- Backfill existing restaurants with the first existing user.
UPDATE "Restaurant"
SET "ownerId" = (
    SELECT "id"
    FROM "User"
    ORDER BY "id"
    LIMIT 1
);

ALTER TABLE "Restaurant" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
