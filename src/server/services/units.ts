import { prisma } from '@/lib/db';
import type { CreateUnitInput, UpdateUnitInput } from '@/lib/validators/property';

/**
 * `rentAmount` is a Postgres BIGINT → JS `bigint` via Prisma. Neither
 * `JSON.stringify` (API responses) nor the React Server Components
 * serialization boundary (props passed to Client Components) can handle a
 * raw `bigint` — both throw. Every unit that leaves this service layer for
 * an API response or a Client Component prop goes through this first.
 */
export function serializeUnit<T extends { rentAmount: bigint }>(unit: T) {
  return { ...unit, rentAmount: Number(unit.rentAmount) };
}

/**
 * Recomputes and persists a unit's `status` column from what's actually
 * true: OCCUPIED if it has an active lease, otherwise whatever it was
 * explicitly set to (VACANT/MAINTENANCE) — never silently overwriting a
 * manual MAINTENANCE flag just because there's no active lease.
 *
 * This is the fix promised in the Milestone 4 dashboard README: the
 * dashboard already derives occupancy live and ignores drift, but the
 * stored column matters too (it's what a plain unit list displays without
 * a lease join). Call this after any lease status change — Milestone 6
 * (Tenant Module) will wire that up when lease creation/termination exists;
 * for now it's also called after every unit write in this module so the
 * column is never stale for the actions Property Module can itself take.
 */
export async function syncUnitStatus(unitId: string) {
  const activeLease = await prisma.lease.findFirst({ where: { unitId, status: 'ACTIVE' } });
  const unit = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });

  const nextStatus = activeLease ? 'OCCUPIED' : unit.status === 'OCCUPIED' ? 'VACANT' : unit.status;

  if (nextStatus !== unit.status) {
    await prisma.unit.update({ where: { id: unitId }, data: { status: nextStatus } });
  }
}

export async function listProperties() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      units: { select: { id: true, status: true, rentAmount: true } },
    },
  });
  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    unitCount: p.units.length,
    occupied: p.units.filter((u) => u.status === 'OCCUPIED').length,
    vacant: p.units.filter((u) => u.status === 'VACANT').length,
    maintenance: p.units.filter((u) => u.status === 'MAINTENANCE').length,
  }));
}

export async function getPropertyDetail(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      units: { orderBy: { unitNumber: 'asc' } },
    },
  });
}

export async function getUnitDetail(unitId: string) {
  return prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      property: { select: { id: true, name: true, address: true } },
      leases: { where: { status: 'ACTIVE' }, include: { tenant: { select: { fullName: true } } }, take: 1 },
    },
  });
}

export async function createUnit(input: CreateUnitInput) {
  const { propertyId, ...rest } = input;
  const unit = await prisma.unit.create({
    data: {
      propertyId,
      unitNumber: rest.unitNumber,
      bedrooms: rest.bedrooms,
      bathrooms: rest.bathrooms,
      sizeSqm: rest.sizeSqm ?? undefined,
      rentAmount: BigInt(rest.rentAmount),
    },
  });
  return unit;
}

export async function updateUnit(unitId: string, input: UpdateUnitInput) {
  const data: Record<string, unknown> = { ...input };
  if (input.rentAmount !== undefined) data.rentAmount = BigInt(input.rentAmount);
  const unit = await prisma.unit.update({ where: { id: unitId }, data });
  return unit;
}

export async function setUnitStatus(unitId: string, status: 'VACANT' | 'MAINTENANCE') {
  const activeLease = await prisma.lease.findFirst({ where: { unitId, status: 'ACTIVE' } });
  if (activeLease) {
    throw new Error('This unit has an active lease and cannot be manually marked vacant or under maintenance.');
  }
  return prisma.unit.update({ where: { id: unitId }, data: { status } });
}
