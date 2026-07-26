/**
 * Email sending, abstracted behind one function so the rest of the app never
 * talks to a specific provider directly. Milestone 8 (Reminder Engine) will
 * expand this into a full multi-channel system with templates and delivery
 * logging — this is the minimal version auth needs for invite emails and
 * password reset links.
 *
 * No provider is wired up yet (this sandbox has no network access to test
 * one against). Set RESEND_API_KEY in .env and swap the body of `sendEmail`
 * for a real Resend call when you're ready to send real email — everything
 * that calls sendEmail() stays the same.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: SendEmailInput): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    // TODO (post-sandbox): call the real Resend API here, e.g.
    // await fetch('https://api.resend.com/emails', { ... })
    // Left unimplemented because this environment has no network access to
    // verify it against — swap this block in once you're running locally.
  }

  // Dev fallback: log instead of sending, so the flow is fully testable
  // without any external service configured.
  console.log(`[email:dev] to=${to} subject="${subject}"\n${body}`);
}
