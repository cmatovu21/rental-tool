import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'Give the issue a short title'),
  description: z.string().trim().min(5, 'Describe the issue'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CLOSED']),
});

export const createExpenseSchema = z.object({
  amount: z.coerce.number().int().positive('Enter an amount greater than zero'),
  description: z.string().trim().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const decideExpenseSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
});
