-- Migration 0001_init
-- Generated to match prisma/schema.prisma. Run via `prisma migrate deploy`
-- or apply directly with `psql -f` against a fresh database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ── ENUMS ──────────────────────────────────────────────────────────
CREATE TYPE "UserRole" AS ENUM ('LANDLORD', 'CARETAKER', 'ACCOUNTANT', 'TENANT');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "UnitStatus" AS ENUM ('VACANT', 'OCCUPIED', 'MAINTENANCE');
CREATE TYPE "TenantStatus" AS ENUM ('PROSPECTIVE', 'ACTIVE', 'FORMER');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'VIEWING_SCHEDULED', 'APPROVED', 'REJECTED', 'CLOSED');
CREATE TYPE "ViewingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "LeaseStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FORFEITED');
CREATE TYPE "PaymentMethod" AS ENUM ('MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CASH');
CREATE TYPE "PaymentType" AS ENUM ('RENT', 'DEPOSIT', 'ADVANCE', 'OTHER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CLOSED');
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReminderTriggerType" AS ENUM ('DAYS_BEFORE_7', 'DAYS_BEFORE_3', 'DUE_TODAY', 'OVERDUE_3', 'OVERDUE_7', 'OVERDUE_14', 'OVERDUE_30');
CREATE TYPE "ReminderChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE "InspectionType" AS ENUM ('MOVE_IN', 'MOVE_OUT', 'ROUTINE');
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- ── users ──────────────────────────────────────────────────────────
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- ── properties ─────────────────────────────────────────────────────
CREATE TABLE "properties" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "gps_lat" DECIMAL(9,6),
    "gps_lng" DECIMAL(9,6),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- ── units ──────────────────────────────────────────────────────────
CREATE TABLE "units" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "property_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "size_sqm" DECIMAL(8,2),
    "rent_amount" BIGINT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'VACANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "units_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "units_property_id_unit_number_key" ON "units"("property_id", "unit_number");
CREATE INDEX "units_property_id_idx" ON "units"("property_id");
CREATE INDEX "units_status_idx" ON "units"("status");

-- ── tenants ────────────────────────────────────────────────────────
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "national_id" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'PROSPECTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
CREATE UNIQUE INDEX "tenants_user_id_key" ON "tenants"("user_id");

-- ── tenant_documents ───────────────────────────────────────────────
CREATE TABLE "tenant_documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenant_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tenant_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
CREATE INDEX "tenant_documents_tenant_id_idx" ON "tenant_documents"("tenant_id");

-- ── inquiries ──────────────────────────────────────────────────────
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenant_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inquiries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id"),
    CONSTRAINT "inquiries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id")
);
CREATE INDEX "inquiries_unit_id_idx" ON "inquiries"("unit_id");
CREATE INDEX "inquiries_tenant_id_idx" ON "inquiries"("tenant_id");

-- ── viewings ───────────────────────────────────────────────────────
CREATE TABLE "viewings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "inquiry_id" TEXT NOT NULL,
    "caretaker_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "ViewingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "viewings_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id"),
    CONSTRAINT "viewings_caretaker_id_fkey" FOREIGN KEY ("caretaker_id") REFERENCES "users"("id")
);
CREATE UNIQUE INDEX "viewings_inquiry_id_key" ON "viewings"("inquiry_id");
CREATE INDEX "viewings_caretaker_id_idx" ON "viewings"("caretaker_id");

-- ── leases ─────────────────────────────────────────────────────────
CREATE TABLE "leases" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "tenant_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "rent_amount" BIGINT NOT NULL,
    "deposit_amount" BIGINT NOT NULL,
    "billing_day" INTEGER NOT NULL,
    "status" "LeaseStatus" NOT NULL DEFAULT 'PENDING',
    "signed_document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id"),
    CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id")
);
CREATE INDEX "leases_unit_id_idx" ON "leases"("unit_id");
CREATE INDEX "leases_tenant_id_idx" ON "leases"("tenant_id");
CREATE INDEX "leases_status_idx" ON "leases"("status");

-- ── deposits ───────────────────────────────────────────────────────
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "lease_id" TEXT NOT NULL,
    "amount_collected" BIGINT NOT NULL,
    "amount_refunded" BIGINT NOT NULL DEFAULT 0,
    "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "reconciliation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "deposits_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id")
);
CREATE UNIQUE INDEX "deposits_lease_id_key" ON "deposits"("lease_id");

-- ── payments ───────────────────────────────────────────────────────
CREATE TABLE "payments" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "lease_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference_number" TEXT,
    "receipt_upload_url" TEXT,
    "payment_type" "PaymentType" NOT NULL DEFAULT 'RENT',
    "paid_for_period" DATE,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id"),
    CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id")
);
CREATE INDEX "payments_lease_id_idx" ON "payments"("lease_id");
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- ── refunds ────────────────────────────────────────────────────────
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "payment_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id"),
    CONSTRAINT "refunds_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id")
);
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- ── receipts ───────────────────────────────────────────────────────
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "payment_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
);
CREATE UNIQUE INDEX "receipts_payment_id_key" ON "receipts"("payment_id");
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- ── maintenance_tickets ────────────────────────────────────────────
CREATE TABLE "maintenance_tickets" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "unit_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "maintenance_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "maintenance_tickets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id"),
    CONSTRAINT "maintenance_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id"),
    CONSTRAINT "maintenance_tickets_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id")
);
CREATE INDEX "maintenance_tickets_unit_id_idx" ON "maintenance_tickets"("unit_id");
CREATE INDEX "maintenance_tickets_status_idx" ON "maintenance_tickets"("status");

-- ── maintenance_expenses ───────────────────────────────────────────
CREATE TABLE "maintenance_expenses" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "ticket_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "description" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenance_expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "maintenance_expenses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "maintenance_tickets"("id"),
    CONSTRAINT "maintenance_expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id")
);
CREATE INDEX "maintenance_expenses_ticket_id_idx" ON "maintenance_expenses"("ticket_id");

-- ── reminder_templates ─────────────────────────────────────────────
CREATE TABLE "reminder_templates" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "trigger_type" "ReminderTriggerType" NOT NULL,
    "message_body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reminder_templates_pkey" PRIMARY KEY ("id")
);

-- ── reminders ──────────────────────────────────────────────────────
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "lease_id" TEXT NOT NULL,
    "template_id" TEXT,
    "trigger_type" "ReminderTriggerType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "billing_period" DATE NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reminders_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id"),
    CONSTRAINT "reminders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "reminder_templates"("id")
);
CREATE UNIQUE INDEX "reminder_dedupe" ON "reminders"("lease_id", "trigger_type", "channel", "billing_period");
CREATE INDEX "reminders_lease_id_idx" ON "reminders"("lease_id");
CREATE INDEX "reminders_status_idx" ON "reminders"("status");

-- ── inspections ────────────────────────────────────────────────────
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "lease_id" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "inspector_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "condition_notes" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inspections_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id"),
    CONSTRAINT "inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id")
);
CREATE INDEX "inspections_lease_id_idx" ON "inspections"("lease_id");

-- ── photos (polymorphic) ───────────────────────────────────────────
CREATE TABLE "photos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "photos_entity_type_entity_id_idx" ON "photos"("entity_type", "entity_id");

-- ── audit_log ──────────────────────────────────────────────────────
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id")
);
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");
