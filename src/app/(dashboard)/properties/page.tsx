import Link from 'next/link';
import { listProperties } from '@/server/services/properties';
import { Button } from '@/components/ui/button';

export default async function PropertiesPage() {
  const properties = await listProperties();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Properties</h1>
          <p className="text-ink/60 text-sm">{properties.length} propert{properties.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <Link href="/properties/new">
          <Button type="button" fullWidth={false} className="px-5">
            + Add property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white border border-rule rounded-lg p-10 text-center">
          <p className="text-ink/60 mb-4">No properties yet. Add your first one to get started.</p>
          <Link href="/properties/new" className="text-forest hover:underline">
            + Add property
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="bg-white border border-rule rounded-lg p-5 hover:border-forest transition-colors"
            >
              <h2 className="font-display text-lg font-semibold text-ink mb-1">{p.name}</h2>
              <p className="text-sm text-ink/50 mb-4">{p.address}</p>
              <div className="flex items-center gap-4 text-xs font-mono uppercase">
                <span className="text-ink/70">{p.unitCount} unit{p.unitCount === 1 ? '' : 's'}</span>
                <span className="text-forest">{p.occupied} occupied</span>
                <span className="text-ochre">{p.vacant} vacant</span>
                {p.maintenance > 0 && <span className="text-ink/50">{p.maintenance} maintenance</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
