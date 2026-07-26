import { PaymentForm } from '@/components/payments/payment-form';

export default function NewPaymentPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-6">Record a payment</h1>
      <PaymentForm />
    </div>
  );
}
