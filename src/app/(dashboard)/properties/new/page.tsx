import { PropertyForm } from '@/components/properties/property-form';

export default function NewPropertyPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Add a property</h1>
      <PropertyForm mode="create" />
    </div>
  );
}
