-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('role_changed', 'account_unlocked', 'account_locked', 'profile_created', 'profile_updated', 'profile_published', 'profile_deleted', 'photo_saved', 'invite_created', 'invite_renewed', 'invite_cancelled', 'invite_submitted');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('user', 'invitee', 'system');

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_user_id" UUID,
    "actor_email" TEXT,
    "target_id" UUID NOT NULL,
    "target_email" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");

-- CreateIndex
CREATE INDEX "audit_events_action_created_at_idx" ON "audit_events"("action", "created_at");
