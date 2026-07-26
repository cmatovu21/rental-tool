# RentLedger — Rental Property Management System

A complete rental property management app for a single landlord/company in
Uganda: properties and units, tenant lifecycle, rent collection across
MTN/Airtel/Bank/Cash, automatic reminders, maintenance, and reports —
built across 12 milestones per the original plan.

---

## Quick start

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Then edit .env:
#   JWT_SECRET     — generate with: openssl rand -hex 32
#   APP_URL        — http://localhost:3000 for local dev
#   CRON_SECRET    — any random string, used by the reminder scheduler

# 4. Apply the database schema
npx prisma migrate deploy
npx prisma generate

# 5. Seed realistic sample data (3 properties, 8 units, 6 tenants, payment
#    history, a maintenance ticket, reminder templates)
npx prisma db seed

# 6. Run it
npm run dev
# → http://localhost:3000
```

**Demo logins** (password `Password123!` for all):

| Role | Email |
|---|---|
| Landlord | landlord@demo.rentalapp.ug |
| Caretaker | caretaker@demo.rentalapp.ug |
| Accountant | accountant@demo.rentalapp.ug |
| Tenant | david.mukasa@example.com |

Or register a new tenant account at `/register`, or (as Landlord) invite a
caretaker/accountant at `/settings/users`.

---

## What's built, by milestone

1. **Planning** — PRD, database design/ERD, user stories, screens, tech
   stack, roadmap, folder structure (delivered separately as planning docs).
2. **Database** — 21-table Postgres schema via Prisma, hand-written CHECK
   constraints and a partial unique index Prisma's schema language can't
   express, seed data.
3. **Authentication** — invite-only staff onboarding, open tenant
   self-registration, JWT sessions (`jose`, Edge-compatible), dual-channel
   (email/SMS) password reset, role-based middleware.
4. **Dashboard** — KPIs, Recharts line/donut/bar charts, recent payments,
   vacant units, lease expiry — role-scoped (Landlord sees everything,
   Caretaker sees operations, Accountant sees financials).
5. **Property Module** — properties, units, photo upload/gallery, GPS entry
   + map preview, occupancy status synced from active leases.
6. **Tenant Module** — profiles, documents, lease creation/termination
   (assigns a unit, creates the deposit, flips occupancy), inspection
   history, real payment history.
7. **Payment Module** — all 4 payment methods with reference-number
   enforcement, proof-of-payment upload, auto-generated PDF receipts,
   partial/advance payments, refunds, a billing-day-aware monthly ledger.
8. **Reminder Engine** — 7 trigger points (7/3 days before, due today,
   3/7/14/30 overdue) across SMS/WhatsApp/Email, editable templates, a
   secret-protected cron endpoint plus a manual "run now" button, full
   delivery log.
9. **Maintenance** — tenant-submitted tickets (with photos), caretaker
   status updates, Landlord expense approval, live on the dashboard.
10. **Reports** — Rent Roll, Cash Flow, Income Statement, Occupancy,
    Maintenance Costs, Outstanding Rent, Late Tenants, Revenue Trends —
    all exportable to CSV, Excel, and PDF.
11. **Mobile** — responsive layouts throughout; a hamburger menu on the
    dashboard and tenant portal headers for small screens.
12. **Polish** — dark mode (toggle + persistence, see limitation below),
    loading skeletons and error boundaries per route group, a global 404,
    baseline security headers, focus-visible styles, `prefers-reduced-motion`
    support, and a skip-to-content link.

---

## Architecture at a glance

- **Next.js 14 (App Router) + TypeScript**, full-stack in one codebase.
- **PostgreSQL + Prisma**, money stored as `bigint` (whole UGX, no floats).
- **JWT sessions** in an httpOnly cookie, RBAC enforced in `middleware.ts`
  *and* re-checked in every API route (never rely on one layer alone).
- **Service layer** (`src/server/services/`) holds business logic; API
  routes (`src/app/api/`) stay thin.
- Design system: forest green / ochre / warm paper palette, Fraunces +
  Inter + IBM Plex Mono typography, a "torn rent receipt" motif on auth
  screens — see `src/components/auth/auth-card.tsx`.

## Known limitations (by design, given this was built without live
infrastructure to test against)

- **Notifications are stubbed.** Email/SMS/WhatsApp all log to the console
  (`src/lib/notifications/`) instead of calling a real provider. Each file
  has a clearly marked spot to plug in Resend, Africa's Talking, etc.
- **File storage is local disk** (`public/uploads/`), not S3/Spaces. Fine
  for `npm run dev` or a persistent VPS; won't survive redeploys on
  serverless platforms. See `src/lib/storage.ts`.
- **Dark mode is partial.** The toggle, persistence, page shells, and
  shared form primitives (Button/Field/Alert) support it; the many
  per-page `bg-white` cards throughout the app do not yet have `dark:`
  variants. Toggling it won't break anything, but full visual coverage
  is a good follow-up task — search for `bg-white border border-rule` to
  find the remaining spots.
- **The reminder engine needs an external trigger.** `/api/cron/reminders`
  is built and secret-protected, but nothing in this environment calls it
  daily — wire it up to Vercel Cron, a system crontab, or similar.
- **No automated test suite.** Everything here was verified statically
  (TypeScript syntax-checked, every import resolved, migrations checked
  for consistency) since this sandbox has no live Postgres or browser to
  run it against end-to-end. Worth a real click-through before relying on
  it for actual rent collection.

## Project structure

```
prisma/                  schema.prisma, 3 migrations, seed.ts
src/
  app/
    (auth)/               login, register, forgot/reset-password, accept-invite
    (dashboard)/           staff app: dashboard, properties, units, tenants,
                           payments, reminders, maintenance, reports, settings
    (portal)/              tenant app: dashboard, maintenance
    api/                   one route folder per resource
  components/             organized by feature (auth, properties, tenants,
                           payments, reminders, maintenance, reports, ui, layout)
  lib/                    auth, validators, money formatting, storage,
                           notifications, API error mapping
  server/services/        all business logic — the thing API routes call
docker-compose.yml        local Postgres
```
