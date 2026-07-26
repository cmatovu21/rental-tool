import { prisma } from '@/lib/db';
import type { CreateInspectionInput } from '@/lib/validators/tenant';

export async function createInspection(input: CreateInspectionInput, inspectorId: string) {
  return prisma.inspection.create({
    data: {
      leaseId: input.leaseId,
      type: input.type,
      inspectorId,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      conditionNotes: input.conditionNotes || undefined,
      status: 'SCHEDULED',
    },
  });
}

export async function completeInspection(inspectionId: string, conditionNotes: string) {
  return prisma.inspection.update({
    where: { id: inspectionId },
    data: { status: 'COMPLETED', completedAt: new Date(), conditionNotes },
  });
}
