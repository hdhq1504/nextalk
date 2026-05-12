-- DropIndex
DROP INDEX "users_email_idx";

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "image_urls" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0;
