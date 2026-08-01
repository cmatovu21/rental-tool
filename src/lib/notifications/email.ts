/**
 * Email sending, abstracted behind one function so the rest of the app never
 * talks to a specific provider directly. Backed by Resend when
 * RESEND_API_KEY is set — falls back to a console log when it isn't, so the
 * app stays fully testable without any external service configured.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback: log instead of sending, so the flow is fully testable
    // without any external service configured.
    console.log(`[email:dev] to=${to} subject="${subject}"\n${body}`);
    return;
  }

  // RESEND_FROM_EMAIL lets you use your own verified domain once you have
  // one (e.g. "RentLedger <alerts@yourdomain.com>"). Until then,
  // "onboarding@resend.dev" is Resend's own sandbox sender — it works with
  // zero setup and can send to any real inbox, which is exactly what you
  // want while getting this running for the first time.
  const from = process.env.RESEND_FROM_EMAIL || 'RentLedger <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      // Resend accepts either `text` or `html` — plain text is simplest and
      // matches every other message this app sends.
      text: body,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.error(`[email] Resend request failed (${res.status}): ${errorText}`);
  }
}
