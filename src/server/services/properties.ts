import { prisma } from '@/lib/db';
import type { CreatePropertyInput, UpdatePropertyInput } from '@/lib/validators/property';

export async function createProperty(input: CreatePropertyInput) {
  return prisma.property.create({
    data: {
      name: input.name,
      address: input.address,
      gpsLat: input.gpsLat ?? undefined,
      gpsLng: input.gpsLng ?? undefined,
      description: input.description ?? undefined,
    },
  });
}

export async function updateProperty(propertyId: string, input: UpdatePropertyInput) {
  return prisma.property.update({
    where: { id: propertyId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.gpsLat !== undefined && { gpsLat: input.gpsLat }),
      ...(input.gpsLng !== undefined && { gpsLng: input.gpsLng }),
      ...(input.description !== undefined && { description: input.description }),
    },
  });
}

export async function deleteProperty(propertyId: string) {
  // Fails at the database level (foreign key constraint) if any unit under
  // this property still has leases, maintenance tickets, etc. referencing
  // it — see the friendly error mapping in the API route. That's
  // intentional: never silently cascade-delete financial/lease history.
  await prisma.property.delete({ where: { id: propertyId } });
}
export { listProperties, getPropertyDetail } from './units';
