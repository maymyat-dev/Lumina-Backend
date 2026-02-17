-- CreateEnum
CREATE TYPE "LOGIN_TYPE" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateTable
CREATE TABLE "Users" (
    "id" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "unique_id" TEXT,
    "login_type" "LOGIN_TYPE" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);
