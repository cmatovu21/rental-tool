/**
 * WhatsApp sending, same pattern as email.ts/sms.ts. The WhatsApp Business
 * API can be reached through Africa's Talking or Twilio — not wired up here
 * for the same reason as the other two channels (no network in this
 * sandbox to test a real integration against).
 */
export interface SendWhatsAppInput {
  to: string;
  body: string;
}

export async function sendWhatsApp({ to, body }: SendWhatsAppInput): Promise<void> {
  if (process.env.WHATSAPP_API_KEY) {
    // TODO (post-sandbox): call the real WhatsApp Business API here.
  }
  console.log(`[whatsapp:dev] to=${to}\n${body}`);
}
