/**
 * SendGrid client initialisation and low-level send wrapper.
 *
 * Design:
 *  - If SENDGRID_API_KEY is not set (local dev / test), send() is a no-op
 *    that logs the outbound message.  This ensures the booking flow works
 *    without credentials in non-production environments.
 *  - Failures never throw — they are logged with enough context for manual retry.
 *  - The send call is wrapped in a 10-second race-timeout so a slow SendGrid
 *    response never stalls the API route.
 */
import sgMail from '@sendgrid/mail';
import { env } from '../env';

/** Shape of an outbound email message. */
export interface EmailMessage {
  to: string;
  subject: string;
  /** Full HTML body (inline-CSS only for mail client compatibility). */
  html: string;
  /** Plain-text fallback — required for deliverability. */
  text: string;
}

let _initialized = false;

function getClient(): typeof sgMail | null {
  if (!env.SENDGRID_API_KEY || !env.SENDGRID_FROM_EMAIL) {
    return null; // graceful no-op in dev
  }
  if (!_initialized) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
    _initialized = true;
  }
  return sgMail;
}

/**
 * Send a transactional email.
 *
 * @returns `true` if the email was dispatched, `false` if skipped (no credentials).
 * Never throws.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const client = getClient();

  if (!client) {
    if (env.NODE_ENV !== 'test') {
      console.log('[email] SendGrid not configured — skipping send', {
        to: message.to,
        subject: message.subject,
      });
    }
    return false;
  }

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('SendGrid send timed out after 10s')), 10_000)
  );

  try {
    await Promise.race([
      client.send({
        to: message.to,
        from: {
          email: env.SENDGRID_FROM_EMAIL!,
          name: env.SENDGRID_FROM_NAME,
        },
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      timeout,
    ]);
    return true;
  } catch (err) {
    console.error('[email] SendGrid error', {
      to: message.to,
      subject: message.subject,
      error: err instanceof Error ? err.message : err,
    });
    return false;
  }
}

/** Reset the initialisation flag — for use in tests only. */
export function _resetForTesting(): void {
  _initialized = false;
}
