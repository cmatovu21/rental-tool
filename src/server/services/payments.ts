import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';
import { generateReceiptPdf } from '@/server/services/receipt-pdf';
import type { RecordPaymentInput } from '@/lib/validators/payment';

export async function listActiveLeasesForPaymentEntry() {
  const leases = await prisma.lease.findMany({
    where: { status: 'ACTIVE' },
    include: {
      tenant: { select: { fullName: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return leases.map((l) => ({
    id: l.id,
    label: `${l.tenant.fullName} — ${l.unit.property.name} · ${l.unit.unitNumber}`,
    rentAmount: toDisplayNumber(l.rentAmount),
  }));
}

export async function recordPayment(input: RecordPaymentInput, recordedById: string) {
  const lease = await prisma.lease.findUniqueOrThrow({
    where: { id: input.leaseId },
    include: {
      tenant: { select: { fullName: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      leaseId: input.leaseId,
      amount: BigInt(input.amount),
      method: input.method,
      referenceNumber: input.referenceNumber || undefined,
      receiptUploadUrl: input.receiptUploadUrl || undefined,
      paymentType: input.paymentType,
      paidForPeriod: input.paidForPeriod ? new Date(input.paidForPeriod) : undefined,
      status: 'CONFIRMED',
      recordedById,
    },
  });

  const receiptNumber = `RCPT-${new Date().getFullYear()}-${payment.id.slice(0, 8).toUpperCase()}`;
  const pdfUrl = await generateReceiptPdf({
    receiptNumber,
    issuedAt: payment.createdAt,
    tenantName: lease.tenant.fullName,
    propertyName: lease.unit.property.name,
    unitNumber: lease.unit.unitNumber,
    amount: toDisplayNumber(payment.amount),
    method: payment.method,
    referenceNumber: payment.referenceNumber,
    paymentType: payment.paymentType,
    paidForPeriod: payment.paidForPeriod,
  });

  const receipt = await prisma.receipt.create({
    data: { paymentId: payment.id, receiptNumber, pdfUrl },
  });

  await prisma.auditLog.create({
    data: { userId: recordedById, action: 'RECORD_PAYMENT', entityType: 'payment', entityId: payment.id },
  });

  return { payment, receipt };
}

export async function getPaymentDetail(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      lease: {
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        },
      },
      receipt: true,
      refunds: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function listPayments(limit = 50) {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      lease: {
        include: {
          tenant: { select: { fullName: true } },
          unit: { select: { unitNumber: true, property: { select: { name: true } } } },
        },
      },
      refunds: true,
    },
  });
  return payments.map((p) => ({
    id: p.id,
    amount: toDisplayNumber(p.amount),
    refundedAmount: p.refunds.reduce((sum, r) => sum + toDisplayNumber(r.amount), 0),
    method: p.method,
    status: p.status,
    paymentType: p.paymentType,
    createdAt: p.createdAt.toISOString(),
    tenantName: p.lease.tenant.fullName,
    unitLabel: `${p.lease.unit.property.name} · ${p.lease.unit.unitNumber}`,
  }));
}

export async function issueRefund(paymentId: string, amount: number, reason: string, processedById: string) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { refunds: true } });
  const alreadyRefunded = payment.refunds.reduce((sum, r) => sum + toDisplayNumber(r.amount), 0);
  const remaining = toDisplayNumber(payment.amount) - alreadyRefunded;
  if (amount > remaining) {
    throw new Error(`Refund amount can't exceed the remaining refundable balance (${remaining}).`);
  }

  const refund = await prisma.$transaction(async (tx) => {
    const createdRefund = await tx.refund.create({
      data: { paymentId, amount: BigInt(amount), reason, processedById },
    });
    const newTotal = alreadyRefunded + amount;
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: newTotal >= toDisplayNumber(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });
    await tx.auditLog.create({
      data: { userId: processedById, action: 'ISSUE_REFUND', entityType: 'payment', entityId: paymentId },
    });
    return createdRefund;
  });

  return refund;
}
