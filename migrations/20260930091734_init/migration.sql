-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('viewer', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('invited', 'awaiting_review', 'published');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "failed_sign_in_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMPTZ(3),
    "email_verified_at" TIMESTAMPTZ(3),
    "last_sign_in_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "company_email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "preferred_name" TEXT,
    "position" TEXT,
    "start_date" DATE,
    "linked_in" TEXT,
    "hobbies" TEXT,
    "something_interesting" TEXT,
    "background" TEXT,
    "photo_key" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'published',
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_company_email_key" ON "profiles"("company_email");

-- CreateIndex
CREATE INDEX "profiles_status_start_date_idx" ON "profiles"("status", "start_date");

-- Added by hand (Prisma schema cannot express check constraints): emails are stored trimmed,
-- lowercased and on the company domain, so matching a user to a profile by email is exact.
ALTER TABLE "users" ADD CONSTRAINT "users_email_format_check"
    CHECK ("email" = lower(btrim("email")) AND "email" LIKE '%_@singular.co.za');

ALTER TABLE "profiles" ADD CONSTRAINT "profiles_company_email_format_check"
    CHECK ("company_email" = lower(btrim("company_email")) AND "company_email" LIKE '%_@singular.co.za');
