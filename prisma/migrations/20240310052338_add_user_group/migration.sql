/*
  Warnings:

  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(35)`.
  - You are about to alter the column `hash` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `group_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "firstName",
DROP COLUMN "lastName",
ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "group_id" INTEGER NOT NULL,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jwt_token" VARCHAR(255),
ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ADD COLUMN     "refresh_token" VARCHAR(255),
ADD COLUMN     "remember_token" VARCHAR(255),
ADD COLUMN     "updatedBy" INTEGER,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(35),
ALTER COLUMN "hash" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "level" INTEGER NOT NULL,
    "desc" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
