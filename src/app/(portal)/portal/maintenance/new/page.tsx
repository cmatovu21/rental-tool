import { NewTicketForm } from '@/components/maintenance/new-ticket-form';

export default function NewTenantTicketPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">New maintenance request</h1>
      <NewTicketForm />
    </div>
  );
}
