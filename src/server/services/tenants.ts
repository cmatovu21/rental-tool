import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';
import type { CreateTenantInput, UpdateTenantInput } from '@/lib/validators/tenant';

export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      leases: { where: { status: 'ACTIVE' }, include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } }, take: 1 },
    },
  });
  return tenants.map((t) => ({
    id: t.id,
    fullName: t.fullName,
    phone: t.phone,
    email: t.email,
    status: t.status,
    currentUnit: t.leases[0] ? `${t.leases[0].unit.property.name} · ${t.leases[0].unit.unitNumber}` : null,
  }));
}

export async function createTenant(input: CreateTenantInput) {
  return prisma.tenant.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || undefined,
      nationalId: input.nationalId || undefined,
      emergencyContactName: input.emergencyContactName || undefined,
      emergencyContactPhone: input.emergencyContactPhone || undefined,
      status: 'PROSPECTIVE',
    },
  });
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.nationalId !== undefined && { nationalId: input.nationalId || null }),
      ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName || null }),
      ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone || null }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });
}

export async function getTenantProfile(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      documents: { orderBy: { uploadedAt: 'desc' } },
      leases: {
        orderBy: { createdAt: 'desc' },
        include: {
          unit: { select: { id: true, unitNumber: true, property: { select: { name: true } } } },
          deposit: true,
        },
      },
    },
  });
  if (!tenant) return null;

  const leaseIds = tenant.leases.map((l) => l.id);
  const payments = leaseIds.length
    ? await prisma.payment.findMany({
        where: { leaseId: { in: leaseIds } },
        orderBy: { createdAt: 'desc' },
        include: { lease: { select: { unit: { select: { unitNumber: true } } } } },
      })
    : [];
  const inspections = leaseIds.length
    ? await prisma.inspection.findMany({ where: { leaseId: { in: leaseIds } }, orderBy: { createdAt: 'desc' } })
    : [];

  return {
    tenant,
    payments: payments.map((p) => ({
      id: p.id,
      amount: toDisplayNumber(p.amount),
      method: p.method,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      unitNumber: p.lease.unit.unitNumber,
    })),
    inspections,
  };
}
