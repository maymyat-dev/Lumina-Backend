/*
  Warnings:

  - You are about to drop the column `login_type` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `unique_id` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "login_type",
DROP COLUMN "unique_id",
ADD COLUMN     "loginType" "LOGIN_TYPE" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "otpCode" TEXT,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "otpVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "uniqueId" TEXT,
ALTER COLUMN "firstName" DROP NOT NULL;
