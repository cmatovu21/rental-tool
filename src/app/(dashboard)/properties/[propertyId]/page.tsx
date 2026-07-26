import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getPropertyDetail } from '@/server/services/properties';
import { serializeUnit } from '@/server/services/units';
import { listPhotos } from '@/server/services/photos';
import { formatUgx } from '@/lib/money';
import { PropertyForm } from '@/components/properties/property-form';
import { UnitForm } from '@/components/properties/unit-form';
import { PhotoGallery } from '@/components/properties/photo-gallery';
import { MapPreview } from '@/components/properties/map-preview';
import { DeletePropertyButton } from '@/components/properties/delete-property-button';

const STATUS_COLORS: Record<string, string> = {
  OCCUPIED: 'bg-forest-50 text-forest',
  VACANT: 'bg-ochre/10 text-ochre',
  MAINTENANCE: 'bg-ink/10 text-ink/70',
};

export default async function PropertyDetailPage({ params }: { params: { propertyId: string } }) {
  const [session, property, photos] = await Promise.all([
    getCurrentUser(),
    getPropertyDetail(params.propertyId),
    listPhotos('property', params.propertyId),
  ]);

  if (!property) notFound();

  const units = property.units.map(serializeUnit);
  const lat = property.gpsLat ? Number(property.gpsLat) : null;
  const lng = property.gpsLng ? Number(property.gpsLng) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/properties" className="text-sm text-forest hover:underline">
            ← All properties
          </Link>
          <h1 className="font-display text-2xl font-semibold text-ink mt-1">{property.name}</h1>
          <p className="text-ink/60">{property.address}</p>
          {property.description && <p className="text-sm text-ink/50 mt-2 max-w-xl">{property.description}</p>}
        </div>
        {session?.role === 'LANDLORD' && <DeletePropertyButton propertyId={property.id} unitCount={units.length} />}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {lat !== null && lng !== null && <MapPreview lat={lat} lng={lng} />}
        <details className="bg-white border border-rule rounded-lg p-5 open:pb-5">
          <summary className="font-display text-base font-semibold text-ink cursor-pointer">Edit details</summary>
          <div className="mt-4">
            <PropertyForm
              mode="edit"
              propertyId={property.id}
              initial={{
                name: property.name,
                address: property.address,
                gpsLat: property.gpsLat?.toString() ?? '',
                gpsLng: property.gpsLng?.toString() ?? '',
                description: property.description ?? '',
              }}
            />
          </div>
        </details>
      </div>

      <PhotoGallery uploadUrl={`/api/properties/${property.id}/photos`} initialPhotos={photos} />

      <div className="bg-white border border-rule rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-ink">
            Units <span className="text-ink/40 font-normal">({units.length})</span>
          </h3>
        </div>
        {units.length === 0 ? (
          <p className="text-sm text-ink/50 mb-4">No units yet.</p>
        ) : (
          <ul className="divide-y divide-rule mb-4">
            {units.map((u) => (
              <li key={u.id}>
                <Link href={`/units/${u.id}`} className="py-3 flex items-center justify-between gap-4 hover:bg-paper -mx-2 px-2 rounded">
                  <div>
                    <p className="text-sm font-medium text-ink">{u.unitNumber}</p>
                    <p className="text-xs text-ink/50">
                      {u.bedrooms} bed · {u.bathrooms} bath{u.sizeSqm ? ` · ${u.sizeSqm} sqm` : ''}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono text-sm text-ink">{formatUgx(u.rentAmount)}/mo</span>
                    <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${STATUS_COLORS[u.status]}`}>
                      {u.status.toLowerCase()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <details>
          <summary className="text-sm text-forest hover:underline cursor-pointer">+ Add unit</summary>
          <div className="mt-4">
            <UnitForm mode="create" propertyId={property.id} />
          </div>
        </details>
      </div>
    </div>
  );
}
