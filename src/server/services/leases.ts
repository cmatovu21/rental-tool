import { prisma } from '@/lib/db';
import { syncUnitStatus } from '@/server/services/units';
import type { CreateLeaseInput } from '@/lib/validators/tenant';

export async function createLease(input: CreateLeaseInput) {
  const existingActive = await prisma.lease.findFirst({ where: { unitId: input.unitId, status: 'ACTIVE' } });
  if (existingActive) {
    throw new Error('This unit already has an active lease.');
  }

  const lease = await prisma.$transaction(async (tx) => {
    const createdLease = await tx.lease.create({
      data: {
        tenantId: input.tenantId,
        unitId: input.unitId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        rentAmount: BigInt(input.rentAmount),
        depositAmount: BigInt(input.depositAmount),
        billingDay: input.billingDay,
        status: 'ACTIVE',
      },
    });
    await tx.deposit.create({
      data: { leaseId: createdLease.id, amountCollected: BigInt(input.depositAmount) },
    });
    await tx.tenant.update({ where: { id: input.tenantId }, data: { status: 'ACTIVE' } });
    return createdLease;
  });

  await syncUnitStatus(input.unitId);
  return lease;
}

export async function terminateLease(leaseId: string, reason?: string) {
  const lease = await prisma.lease.update({
    where: { id: leaseId },
    data: { status: 'TERMINATED' },
  });

  const stillActiveTenantLeases = await prisma.lease.count({ where: { tenantId: lease.tenantId, status: 'ACTIVE' } });
  if (stillActiveTenantLeases === 0) {
    await prisma.tenant.update({ where: { id: lease.tenantId }, data: { status: 'FORMER' } });
  }

  if (reason) {
    await prisma.deposit
      .update({ where: { leaseId }, data: { reconciliationNotes: reason } })
      .catch(() => {
        // Deposit might not exist in edge cases; don't let that block termination itself.
      });
  }

  await syncUnitStatus(lease.unitId);
  return lease;
}
