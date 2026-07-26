import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validators/auth';
import { generateNumericOtp, generateUrlSafeToken, hashSecret } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/notifications/email';
import { sendSms } from '@/lib/notifications/sms';

const EMAIL_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const SMS_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Always the same response body, whether or not we found a matching account —
// this is what prevents the endpoint from being used to check which emails
// or phone numbers have accounts (user enumeration). Built fresh per request
// rather than shared/cloned, since a Response body stream is single-use.
function genericResponse() {
  return NextResponse.json({
    message: "If an account matches that email or phone number, we've sent instructions.",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { identifier, channel } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });
  if (!user) return genericResponse();

  if (channel === 'EMAIL') {
    const token = generateUrlSafeToken();
    const secretHash = await hashSecret(token);
    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        channel: 'EMAIL',
        secretHash,
        expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
      },
    });
    const resetUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?identifier=${encodeURIComponent(
      user.email
    )}&token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      body: `Hi ${user.fullName},\n\nClick the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
  } else {
    const otp = generateNumericOtp(6);
    const secretHash = await hashSecret(otp);
    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        channel: 'SMS',
        secretHash,
        expiresAt: new Date(Date.now() + SMS_OTP_TTL_MS),
      },
    });
    await sendSms({
      to: user.phone,
      body: `Your password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    });
  }

  return genericResponse();
}
