-- Migration 0003_auth
-- Adds the two tables authentication needs on top of the Milestone 2 schema:
-- staff invites (invite-only onboarding for Landlord/Caretaker/Accountant)
-- and password reset requests (backs both the email-link and SMS-OTP flows).

CREATE TYPE "ResetChannel" AS ENUM ('EMAIL', 'SMS');

CREATE TABLE "invites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id")
);
CREATE UNIQUE INDEX "invites_token_hash_key" ON "invites"("token_hash");
CREATE INDEX "invites_email_idx" ON "invites"("email");

-- Staff invites are never issued for the Tenant role (tenants self-register).
ALTER TABLE "invites"
    ADD CONSTRAINT "invites_role_not_tenant" CHECK ("role" <> 'TENANT');

CREATE TABLE "password_reset_requests" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "channel" "ResetChannel" NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "password_reset_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
CREATE INDEX "password_reset_requests_user_id_idx" ON "password_reset_requests"("user_id");

ALTER TABLE "password_reset_requests"
    ADD CONSTRAINT "password_reset_requests_attempts_nonnegative" CHECK ("attempts" >= 0);
