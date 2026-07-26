/**
 * SMS sending, abstracted the same way as email.ts. Africa's Talking is the
 * planned provider (see tech stack doc) given its Uganda coverage — not
 * wired up here since this sandbox has no network access to test it against.
 */
export interface SendSmsInput {
  to: string;
  body: string;
}

export async function sendSms({ to, body }: SendSmsInput): Promise<void> {
  if (process.env.AFRICASTALKING_API_KEY) {
    // TODO (post-sandbox): call the real Africa's Talking API here.
    // Left unimplemented for the same reason as email.ts.
  }

  console.log(`[sms:dev] to=${to}\n${body}`);
}
