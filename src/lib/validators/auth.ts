import { z } from 'zod';

// Uganda numbers: accept +2567XXXXXXXX or 07XXXXXXXX loosely — kept permissive
// since strict carrier validation isn't a v1 requirement.
const phoneSchema = z
  .string()
  .trim()
  .min(9, 'Enter a valid phone number')
  .regex(/^(\+?256|0)7\d{8}$/, 'Enter a valid Uganda phone number, e.g. 0701234567');

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: phoneSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  channel: z.enum(['EMAIL', 'SMS']),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  secret: z.string().trim().min(4, 'Enter the code or link token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const createInviteSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter their full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: phoneSchema,
  role: z.enum(['LANDLORD', 'CARETAKER', 'ACCOUNTANT']),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(10, 'Invalid invite link'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
