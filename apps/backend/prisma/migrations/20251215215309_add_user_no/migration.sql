/*
  Warnings:

  - A unique constraint covering the columns `[user_no]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "user_no" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_user_no_key" ON "users"("user_no");
