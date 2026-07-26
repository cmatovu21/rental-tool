import { prisma } from '@/lib/db';
import { toDisplayNumber } from '@/lib/money';
import type { CreateExpenseInput, CreateTicketInput } from '@/lib/validators/maintenance';

/** For the tenant portal: which unit (if any) can this tenant raise a ticket against? */
export async function getTenantActiveUnit(tenantUserId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { userId: tenantUserId } });
  if (!tenant) return null;
  const lease = await prisma.lease.findFirst({
    where: { tenantId: tenant.id, status: 'ACTIVE' },
    include: { unit: { select: { id: true, unitNumber: true, property: { select: { name: true } } } } },
  });
  return lease ? { tenantId: tenant.id, unit: lease.unit } : null;
}

export async function createTicketAsTenant(tenantUserId: string, unitId: string, input: CreateTicketInput) {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { userId: tenantUserId } });
  return prisma.maintenanceTicket.create({
    data: { unitId, tenantId: tenant.id, title: input.title, description: input.description, priority: input.priority },
  });
}

export async function listTicketsForTenant(tenantUserId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { userId: tenantUserId } });
  if (!tenant) return [];
  return prisma.maintenanceTicket.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' } });
}

export async function listTicketsForStaff() {
  const tickets = await prisma.maintenanceTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      tenant: { select: { fullName: true } },
      expenses: true,
    },
  });
  return tickets.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    unitLabel: `${t.unit.property.name} · ${t.unit.unitNumber}`,
    tenantName: t.tenant?.fullName ?? null,
    createdAt: t.createdAt.toISOString(),
    pendingExpenseTotal: t.expenses.filter((e) => e.status === 'PENDING').reduce((sum, e) => sum + toDisplayNumber(e.amount), 0),
  }));
}

export async function getTicketDetail(ticketId: string) {
  return prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    include: {
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      tenant: { select: { fullName: true } },
      expenses: { orderBy: { createdAt: 'desc' } },
    },
  });
}

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'CLOSED';

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  return prisma.maintenanceTicket.update({ where: { id: ticketId }, data: { status } });
}

export async function addExpense(ticketId: string, input: CreateExpenseInput) {
  const expense = await prisma.maintenanceExpense.create({
    data: { ticketId, amount: BigInt(input.amount), description: input.description || undefined },
  });
  // Logging an expense estimate/actual naturally means the ticket is
  // waiting on the owner's sign-off before it can be marked complete.
  await prisma.maintenanceTicket.update({ where: { id: ticketId }, data: { status: 'AWAITING_APPROVAL' } });
  return expense;
}

export async function decideExpense(expenseId: string, decision: 'APPROVED' | 'REJECTED', approvedById: string) {
  return prisma.maintenanceExpense.update({
    where: { id: expenseId },
    data: { status: decision, approvedById, approvedAt: new Date() },
  });
}
