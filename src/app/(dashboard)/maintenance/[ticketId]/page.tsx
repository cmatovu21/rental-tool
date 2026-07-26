import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getTicketDetail } from '@/server/services/maintenance';
import { listPhotos } from '@/server/services/photos';
import { TicketStatusControl } from '@/components/maintenance/ticket-status-control';
import { ExpensePanel } from '@/components/maintenance/expense-panel';
import { PhotoGallery } from '@/components/properties/photo-gallery';

export default async function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  const [session, ticketRaw, photos] = await Promise.all([
    getCurrentUser(),
    getTicketDetail(params.ticketId),
    listPhotos('maintenance_ticket', params.ticketId),
  ]);
  if (!ticketRaw) notFound();

  const expenses = ticketRaw.expenses.map((e) => ({ ...e, amount: Number(e.amount) }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{ticketRaw.title}</h1>
          <p className="text-ink/60">
            {ticketRaw.unit.property.name} · {ticketRaw.unit.unitNumber}
            {ticketRaw.tenant ? ` · ${ticketRaw.tenant.fullName}` : ''}
          </p>
        </div>
        <TicketStatusControl ticketId={ticketRaw.id} status={ticketRaw.status} />
      </div>

      <div className="bg-white border border-rule rounded-lg p-5">
        <p className="text-sm text-ink/70">{ticketRaw.description}</p>
      </div>

      <ExpensePanel ticketId={ticketRaw.id} expenses={expenses} canApprove={session?.role === 'LANDLORD'} />

      <PhotoGallery uploadUrl={`/api/maintenance/tickets/${ticketRaw.id}/photos`} initialPhotos={photos} />
    </div>
  );
}
