-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- Backfill existing local users before making email required
UPDATE "User"
SET "email" = "username" || '@example.com';

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
