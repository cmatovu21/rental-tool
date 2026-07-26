import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().trim().min(2, 'Enter a property name'),
  address: z.string().trim().min(5, 'Enter an address'),
  gpsLat: z.coerce.number().min(-90).max(90).optional().nullable(),
  gpsLng: z.coerce.number().min(-180).max(180).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial();
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const createUnitSchema = z.object({
  propertyId: z.string().uuid('Invalid property'),
  unitNumber: z.string().trim().min(1, 'Enter a unit number/name'),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  sizeSqm: z.coerce.number().positive().optional().nullable(),
  rentAmount: z.coerce.number().int().positive('Rent must be greater than zero'),
});
export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = createUnitSchema.omit({ propertyId: true }).partial();
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

export const unitStatusSchema = z.object({
  status: z.enum(['VACANT', 'MAINTENANCE']), // OCCUPIED is only ever set by lease creation (Milestone 6)
});
export type UnitStatusInput = z.infer<typeof unitStatusSchema>;
