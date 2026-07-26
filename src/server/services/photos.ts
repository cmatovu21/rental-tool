import { prisma } from '@/lib/db';

export type PhotoEntityType = 'property' | 'unit' | 'maintenance_ticket' | 'inspection';

export async function listPhotos(entityType: PhotoEntityType, entityId: string) {
  return prisma.photo.findMany({ where: { entityType, entityId }, orderBy: { createdAt: 'desc' } });
}

export async function attachPhoto(entityType: PhotoEntityType, entityId: string, url: string, caption?: string) {
  return prisma.photo.create({ data: { entityType, entityId, url, caption } });
}

export async function deletePhoto(photoId: string) {
  await prisma.photo.delete({ where: { id: photoId } });
}
