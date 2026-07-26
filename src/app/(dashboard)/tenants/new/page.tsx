import { TenantForm } from '@/components/tenants/tenant-form';

export default function NewTenantPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Add a tenant</h1>
      <TenantForm mode="create" />
    </div>
  );
}
