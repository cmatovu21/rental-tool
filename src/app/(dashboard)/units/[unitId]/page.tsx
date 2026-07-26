import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getUnitDetail, serializeUnit } from '@/server/services/units';
import { listPhotos } from '@/server/services/photos';
import { formatUgx } from '@/lib/money';
import { UnitForm } from '@/components/properties/unit-form';
import { UnitStatusToggle } from '@/components/properties/unit-status-toggle';
import { PhotoGallery } from '@/components/properties/photo-gallery';
import { DeleteUnitButton } from '@/components/properties/delete-unit-button';

export default async function UnitDetailPage({ params }: { params: { unitId: string } }) {
  const [unitRaw, photos] = await Promise.all([getUnitDetail(params.unitId), listPhotos('unit', params.unitId)]);
  if (!unitRaw) notFound();

  const unit = serializeUnit(unitRaw);
  const activeLease = unitRaw.leases[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/properties/${unit.property.id}`} className="text-sm text-forest hover:underline">
            ← {unit.property.name}
          </Link>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">Unit {unit.unitNumber}</h1>
          <p className="text-ink/60">
            {unit.bedrooms} bed · {unit.bathrooms} bath{unit.sizeSqm ? ` · ${unit.sizeSqm} sqm` : ''} ·{' '}
            <span className="font-mono">{formatUgx(unit.rentAmount)}/mo</span>
          </p>
          {activeLease && <p className="text-sm text-forest mt-1">Currently leased to {activeLease.tenant.fullName}</p>}
        </div>
        {!activeLease && <DeleteUnitButton unitId={unit.id} propertyId={unit.property.id} />}
      </div>

      <div className="bg-white border border-rule rounded-lg p-5">
        <h3 className="font-display text-base font-semibold text-ink mb-3">Status</h3>
        <UnitStatusToggle unitId={unit.id} status={unit.status} />
      </div>

      <details className="bg-white border border-rule rounded-lg p-5 open:pb-5">
        <summary className="font-display text-base font-semibold text-ink cursor-pointer">Edit unit details</summary>
        <div className="mt-4">
          <UnitForm
            mode="edit"
            unitId={unit.id}
            initial={{
              unitNumber: unit.unitNumber,
              bedrooms: String(unit.bedrooms),
              bathrooms: String(unit.bathrooms),
              sizeSqm: unit.sizeSqm?.toString() ?? '',
              rentAmount: String(unit.rentAmount),
            }}
          />
        </div>
      </details>

      <PhotoGallery uploadUrl={`/api/units/${unit.id}/photos`} initialPhotos={photos} />
    </div>
  );
}
