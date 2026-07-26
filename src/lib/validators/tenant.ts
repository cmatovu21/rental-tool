import { z } from 'zod';

export const createTenantSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the tenant\'s full name'),
  phone: z.string().trim().min(9, 'Enter a valid phone number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  nationalId: z.string().trim().optional().or(z.literal('')),
  emergencyContactName: z.string().trim().optional().or(z.literal('')),
  emergencyContactPhone: z.string().trim().optional().or(z.literal('')),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = createTenantSchema.partial().extend({
  status: z.enum(['PROSPECTIVE', 'ACTIVE', 'FORMER']).optional(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const createLeaseSchema = z.object({
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().min(1, 'Enter a start date'),
  endDate: z.string().min(1, 'Enter an end date'),
  rentAmount: z.coerce.number().int().positive(),
  depositAmount: z.coerce.number().int().min(0),
  billingDay: z.coerce.number().int().min(1).max(28),
});
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;

export const terminateLeaseSchema = z.object({
  reason: z.string().trim().optional(),
});

export const createInspectionSchema = z.object({
  leaseId: z.string().uuid(),
  type: z.enum(['MOVE_IN', 'MOVE_OUT', 'ROUTINE']),
  scheduledAt: z.string().optional(),
  conditionNotes: z.string().trim().optional(),
});
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;

export const completeInspectionSchema = z.object({
  conditionNotes: z.string().trim().min(1, 'Add condition notes'),
});
