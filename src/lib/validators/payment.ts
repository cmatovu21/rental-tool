import { z } from 'zod';

export const recordPaymentSchema = z
  .object({
    leaseId: z.string().uuid(),
    amount: z.coerce.number().int().positive('Enter an amount greater than zero'),
    method: z.enum(['MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'BANK_TRANSFER', 'CASH']),
    referenceNumber: z.string().trim().optional(),
    receiptUploadUrl: z.string().trim().optional(),
    paymentType: z.enum(['RENT', 'DEPOSIT', 'ADVANCE', 'OTHER']).default('RENT'),
    paidForPeriod: z.string().optional(),
  })
  .refine((data) => data.method === 'CASH' || (data.referenceNumber && data.referenceNumber.length > 0), {
    message: 'A reference number is required for MTN, Airtel, and bank payments.',
    path: ['referenceNumber'],
  });
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const issueRefundSchema = z.object({
  amount: z.coerce.number().int().positive('Enter a refund amount greater than zero'),
  reason: z.string().trim().min(3, 'Explain the reason for this refund'),
});
export type IssueRefundInput = z.infer<typeof issueRefundSchema>;
