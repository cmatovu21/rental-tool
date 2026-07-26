-- Migration 0002_constraints_and_partial_indexes
-- These rules protect financial and occupancy integrity at the database
-- level (not just in application code). They're written by hand because
-- Prisma's schema language cannot express CHECK constraints or partial
-- (WHERE-scoped) unique indexes directly.

-- ── Only one ACTIVE lease per unit at a time ────────────────────────
-- A unit can have many historical leases, but never two simultaneously
-- active ones. This is the DB-level guarantee behind "occupancy is
-- derived from active leases" (see database design doc).
CREATE UNIQUE INDEX "one_active_lease_per_unit"
    ON "leases" ("unit_id")
    WHERE "status" = 'ACTIVE';

-- ── Positive-amount guards on every money column ────────────────────
ALTER TABLE "units"
    ADD CONSTRAINT "units_rent_amount_positive" CHECK ("rent_amount" > 0);

ALTER TABLE "leases"
    ADD CONSTRAINT "leases_rent_amount_positive" CHECK ("rent_amount" > 0),
    ADD CONSTRAINT "leases_deposit_amount_nonnegative" CHECK ("deposit_amount" >= 0),
    ADD CONSTRAINT "leases_dates_valid" CHECK ("end_date" > "start_date"),
    ADD CONSTRAINT "leases_billing_day_range" CHECK ("billing_day" BETWEEN 1 AND 28);

ALTER TABLE "deposits"
    ADD CONSTRAINT "deposits_amount_collected_nonnegative" CHECK ("amount_collected" >= 0),
    ADD CONSTRAINT "deposits_amount_refunded_nonnegative" CHECK ("amount_refunded" >= 0),
    ADD CONSTRAINT "deposits_refund_not_exceed_collected" CHECK ("amount_refunded" <= "amount_collected");

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "refunds"
    ADD CONSTRAINT "refunds_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "maintenance_expenses"
    ADD CONSTRAINT "maintenance_expenses_amount_positive" CHECK ("amount" > 0);

-- ── Non-cash payments must carry a reference number ─────────────────
-- (Cash is the only method allowed to omit one.)
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_reference_required_unless_cash" CHECK (
        "method" = 'CASH' OR ("reference_number" IS NOT NULL AND length("reference_number") > 0)
    );

-- ── Polymorphic photos.entity_type is restricted to known entities ──
ALTER TABLE "photos"
    ADD CONSTRAINT "photos_entity_type_valid" CHECK (
        "entity_type" IN ('property', 'unit', 'maintenance_ticket', 'inspection')
    );

-- ── Units/bedrooms/bathrooms sanity bounds ──────────────────────────
ALTER TABLE "units"
    ADD CONSTRAINT "units_bedrooms_nonnegative" CHECK ("bedrooms" >= 0),
    ADD CONSTRAINT "units_bathrooms_nonnegative" CHECK ("bathrooms" >= 0);
