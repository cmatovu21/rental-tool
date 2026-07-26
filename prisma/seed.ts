/**
 * Seed script — populates a fresh database with realistic sample data:
 * demo login accounts (one per role), 3 properties / 8 units, 6 tenants
 * across all lifecycle stages, leases, deposits, a mixed-method payment
 * history, one maintenance ticket with an expense, and reminder templates.
 *
 * Run with: `npx prisma db seed` (configured in package.json → prisma.seed)
 */
import { PrismaClient, PaymentMethod, PaymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Demo staff accounts (one per non-tenant role) ──────────────────
  const landlord = await prisma.user.create({
    data: {
      fullName: 'Grace Namutebi',
      email: 'landlord@demo.rentalapp.ug',
      phone: '+256700111222',
      passwordHash,
      role: 'LANDLORD',
    },
  });

  const caretaker = await prisma.user.create({
    data: {
      fullName: 'Peter Okello',
      email: 'caretaker@demo.rentalapp.ug',
      phone: '+256700333444',
      passwordHash,
      role: 'CARETAKER',
    },
  });

  const accountant = await prisma.user.create({
    data: {
      fullName: 'Sarah Nabirye',
      email: 'accountant@demo.rentalapp.ug',
      phone: '+256700555666',
      passwordHash,
      role: 'ACCOUNTANT',
    },
  });

  // ── Properties & Units ──────────────────────────────────────────────
  const kololoHeights = await prisma.property.create({
    data: {
      name: 'Kololo Heights Apartments',
      address: 'Plot 14, Kololo Hill Drive, Kampala',
      gpsLat: 0.335556,
      gpsLng: 32.591944,
      description: '3-storey apartment block, 4 units, secure parking.',
      units: {
        create: [
          { unitNumber: 'A1', bedrooms: 2, bathrooms: 2, sizeSqm: 85.5, rentAmount: 1_800_000n, status: 'OCCUPIED' },
          { unitNumber: 'A2', bedrooms: 2, bathrooms: 2, sizeSqm: 85.5, rentAmount: 1_800_000n, status: 'OCCUPIED' },
          { unitNumber: 'B1', bedrooms: 3, bathrooms: 2, sizeSqm: 110, rentAmount: 2_400_000n, status: 'VACANT' },
          { unitNumber: 'B2', bedrooms: 1, bathrooms: 1, sizeSqm: 55, rentAmount: 1_100_000n, status: 'MAINTENANCE' },
        ],
      },
    },
    include: { units: true },
  });

  const ntindaCourt = await prisma.property.create({
    data: {
      name: 'Ntinda Court',
      address: 'Ntinda Road, near Capital Shoppers, Kampala',
      gpsLat: 0.357778,
      gpsLng: 32.617778,
      description: 'Gated compound of standalone 2-bedroom units.',
      units: {
        create: [
          { unitNumber: '1', bedrooms: 2, bathrooms: 1, sizeSqm: 70, rentAmount: 1_400_000n, status: 'OCCUPIED' },
          { unitNumber: '2', bedrooms: 2, bathrooms: 1, sizeSqm: 70, rentAmount: 1_400_000n, status: 'VACANT' },
          { unitNumber: '3', bedrooms: 2, bathrooms: 1, sizeSqm: 72, rentAmount: 1_450_000n, status: 'OCCUPIED' },
        ],
      },
    },
    include: { units: true },
  });

  const bugoloBiz = await prisma.property.create({
    data: {
      name: 'Bugolobi Business Suites',
      address: 'Spring Road, Bugolobi, Kampala',
      gpsLat: 0.324722,
      gpsLng: 32.618889,
      description: 'Mixed residential/office units.',
      units: {
        create: [{ unitNumber: 'S1', bedrooms: 0, bathrooms: 1, sizeSqm: 40, rentAmount: 900_000n, status: 'VACANT' }],
      },
    },
    include: { units: true },
  });

  const [koA1, koA2, koB1, koB2] = kololoHeights.units;
  const [ntU1, ntU2, ntU3] = ntindaCourt.units;

  // ── Tenants across lifecycle stages ─────────────────────────────────
  const tenantUser1 = await prisma.user.create({
    data: {
      fullName: 'David Mukasa',
      email: 'david.mukasa@example.com',
      phone: '+256701234567',
      passwordHash,
      role: 'TENANT',
    },
  });

  const davidTenant = await prisma.tenant.create({
    data: {
      userId: tenantUser1.id,
      fullName: 'David Mukasa',
      phone: '+256701234567',
      email: 'david.mukasa@example.com',
      nationalId: 'CM12345678ABCDE',
      emergencyContactName: 'Esther Mukasa',
      emergencyContactPhone: '+256701234000',
      status: 'ACTIVE',
    },
  });

  const janeTenant = await prisma.tenant.create({
    data: {
      fullName: 'Jane Achieng',
      phone: '+256702345678',
      email: 'jane.achieng@example.com',
      nationalId: 'CF98765432XYZAB',
      emergencyContactName: 'Michael Achieng',
      emergencyContactPhone: '+256702345000',
      status: 'ACTIVE',
    },
  });

  const brianTenant = await prisma.tenant.create({
    data: {
      fullName: 'Brian Ssemwogerere',
      phone: '+256703456789',
      email: 'brian.ssem@example.com',
      status: 'ACTIVE',
    },
  });

  const irene = await prisma.tenant.create({
    data: {
      fullName: 'Irene Nakato',
      phone: '+256704567890',
      status: 'PROSPECTIVE',
    },
  });

  const moses = await prisma.tenant.create({
    data: {
      fullName: 'Moses Kato',
      phone: '+256705678901',
      status: 'FORMER',
    },
  });

  // Prospective tenant with an open inquiry + scheduled viewing on the vacant unit
  const inquiry = await prisma.inquiry.create({
    data: { tenantId: irene.id, unitId: koB1.id, message: 'Interested in the 3-bedroom, available from next month?', status: 'VIEWING_SCHEDULED' },
  });
  await prisma.viewing.create({
    data: {
      inquiryId: inquiry.id,
      caretakerId: caretaker.id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
  });

  // ── Active leases + deposits ─────────────────────────────────────────
  const davidLease = await prisma.lease.create({
    data: {
      tenantId: davidTenant.id,
      unitId: koA1.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      rentAmount: 1_800_000n,
      depositAmount: 1_800_000n,
      billingDay: 1,
      status: 'ACTIVE',
      signedDocumentUrl: 'https://storage.example.com/leases/david-mukasa-lease.pdf',
    },
  });
  await prisma.deposit.create({
    data: { leaseId: davidLease.id, amountCollected: 1_800_000n, status: 'HELD' },
  });

  const janeLease = await prisma.lease.create({
    data: {
      tenantId: janeTenant.id,
      unitId: koA2.id,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-10-31'),
      rentAmount: 1_800_000n,
      depositAmount: 1_800_000n,
      billingDay: 5,
      status: 'ACTIVE',
      signedDocumentUrl: 'https://storage.example.com/leases/jane-achieng-lease.pdf',
    },
  });
  await prisma.deposit.create({
    data: { leaseId: janeLease.id, amountCollected: 1_800_000n, status: 'HELD' },
  });

  const brianLease = await prisma.lease.create({
    data: {
      tenantId: brianTenant.id,
      unitId: ntU1.id,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2027-01-14'),
      rentAmount: 1_400_000n,
      depositAmount: 1_400_000n,
      billingDay: 15,
      status: 'ACTIVE',
      signedDocumentUrl: 'https://storage.example.com/leases/brian-ssemwogerere-lease.pdf',
    },
  });
  await prisma.deposit.create({
    data: { leaseId: brianLease.id, amountCollected: 1_400_000n, status: 'HELD' },
  });

  // Former tenant with an expired lease on ntU3 (now shown OCCUPIED for demo continuity;
  // in real use this would flip to VACANT once the lease ends — see Property Module milestone)
  await prisma.lease.create({
    data: {
      tenantId: moses.id,
      unitId: ntU3.id,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      rentAmount: 1_450_000n,
      depositAmount: 1_450_000n,
      billingDay: 1,
      status: 'EXPIRED',
    },
  });

  // ── Payment history (mixed methods, partial + advance examples) ─────
  async function recordPayment(opts: {
    leaseId: string;
    amount: bigint;
    method: PaymentMethod;
    referenceNumber?: string;
    paymentType?: PaymentType;
    paidForPeriod: Date;
    recordedById: string;
    daysAgo: number;
  }) {
    const createdAt = new Date(Date.now() - opts.daysAgo * 24 * 60 * 60 * 1000);
    const payment = await prisma.payment.create({
      data: {
        leaseId: opts.leaseId,
        amount: opts.amount,
        method: opts.method,
        referenceNumber: opts.referenceNumber,
        paymentType: opts.paymentType ?? 'RENT',
        paidForPeriod: opts.paidForPeriod,
        status: 'CONFIRMED',
        recordedById: opts.recordedById,
        createdAt,
        updatedAt: createdAt,
      },
    });
    await prisma.receipt.create({
      data: {
        paymentId: payment.id,
        receiptNumber: `RCPT-${createdAt.getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`,
      },
    });
    return payment;
  }

  // David: full months on time via MTN
  await recordPayment({ leaseId: davidLease.id, amount: 1_800_000n, method: 'MTN_MOBILE_MONEY', referenceNumber: 'MTN.240912.1345.A1B2C3', paidForPeriod: new Date('2026-05-01'), recordedById: accountant.id, daysAgo: 85 });
  await recordPayment({ leaseId: davidLease.id, amount: 1_800_000n, method: 'MTN_MOBILE_MONEY', referenceNumber: 'MTN.241012.0912.D4E5F6', paidForPeriod: new Date('2026-06-01'), recordedById: accountant.id, daysAgo: 55 });
  await recordPayment({ leaseId: davidLease.id, amount: 1_800_000n, method: 'BANK_TRANSFER', referenceNumber: 'STANBIC-TXN-88213345', paidForPeriod: new Date('2026-07-01'), recordedById: accountant.id, daysAgo: 24 });

  // Jane: a partial payment this month (still owes the balance)
  await recordPayment({ leaseId: janeLease.id, amount: 1_800_000n, method: 'AIRTEL_MONEY', referenceNumber: 'AIRTEL.240611.221.G7H8I9', paidForPeriod: new Date('2026-06-05'), recordedById: accountant.id, daysAgo: 50 });
  await recordPayment({ leaseId: janeLease.id, amount: 1_000_000n, method: 'AIRTEL_MONEY', referenceNumber: 'AIRTEL.240711.104.J1K2L3', paidForPeriod: new Date('2026-07-05'), recordedById: accountant.id, daysAgo: 20 });

  // Brian: pays cash, and made one advance payment covering next month early
  await recordPayment({ leaseId: brianLease.id, amount: 1_400_000n, method: 'CASH', paidForPeriod: new Date('2026-06-15'), recordedById: caretaker.id, daysAgo: 40 });
  await recordPayment({ leaseId: brianLease.id, amount: 1_400_000n, method: 'CASH', paymentType: 'ADVANCE', paidForPeriod: new Date('2026-08-15'), recordedById: caretaker.id, daysAgo: 5 });

  // ── Maintenance: one ticket with a caretaker-logged, owner-approved expense ─
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      unitId: koB2.id,
      tenantId: null,
      title: 'Bathroom pipe leak',
      description: 'Leak under the bathroom sink reported by neighboring tenant during vacancy check.',
      priority: 'HIGH',
      status: 'AWAITING_APPROVAL',
    },
  });
  await prisma.maintenanceExpense.create({
    data: {
      ticketId: ticket.id,
      amount: 150_000n,
      description: 'Plumber call-out + replacement pipe fitting',
      status: 'PENDING',
    },
  });

  // ── Reminder templates (one per trigger type, SMS as the default channel) ──
  const templates: Array<{ name: string; trigger: any; body: string }> = [
    { name: '7 days before due', trigger: 'DAYS_BEFORE_7', body: 'Hi {{tenant_name}}, a friendly reminder that your rent of UGX {{amount}} for {{unit}} is due on {{due_date}}.' },
    { name: '3 days before due', trigger: 'DAYS_BEFORE_3', body: 'Hi {{tenant_name}}, your rent of UGX {{amount}} is due in 3 days ({{due_date}}). Thank you!' },
    { name: 'Due today', trigger: 'DUE_TODAY', body: 'Hi {{tenant_name}}, your rent of UGX {{amount}} for {{unit}} is due today. Please make payment via MTN/Airtel/Bank/Cash.' },
    { name: '3 days overdue', trigger: 'OVERDUE_3', body: 'Hi {{tenant_name}}, your rent payment of UGX {{amount}} is now 3 days overdue. Kindly settle it at your earliest convenience.' },
    { name: '7 days overdue', trigger: 'OVERDUE_7', body: 'Hi {{tenant_name}}, your rent is now 7 days overdue. Please contact us to arrange payment.' },
    { name: '14 days overdue', trigger: 'OVERDUE_14', body: 'Hi {{tenant_name}}, your rent is 14 days overdue. This requires urgent attention.' },
    { name: '30 days overdue', trigger: 'OVERDUE_30', body: 'Hi {{tenant_name}}, your rent is 30 days overdue. Please contact the office immediately to discuss your account.' },
  ];
  for (const t of templates) {
    await prisma.reminderTemplate.create({
      data: { name: t.name, channel: 'SMS', triggerType: t.trigger, messageBody: t.body },
    });
  }

  // ── Sample photos ────────────────────────────────────────────────────
  await prisma.photo.createMany({
    data: [
      { entityType: 'property', entityId: kololoHeights.id, url: 'https://storage.example.com/photos/kololo-heights-front.jpg', caption: 'Front view' },
      { entityType: 'unit', entityId: koA1.id, url: 'https://storage.example.com/photos/koA1-living-room.jpg', caption: 'Living room' },
    ],
  });

  console.log('Seed complete.');
  console.log(`Demo logins (password for all: ${DEMO_PASSWORD}):`);
  console.log(`  Landlord:   ${landlord.email}`);
  console.log(`  Caretaker:  ${caretaker.email}`);
  console.log(`  Accountant: ${accountant.email}`);
  console.log(`  Tenant:     ${tenantUser1.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
