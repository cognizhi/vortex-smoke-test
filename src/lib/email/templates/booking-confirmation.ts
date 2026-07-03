/**
 * Email template: Booking Confirmation → sent to the customer.
 *
 * Sent immediately after a booking is created (customer self-service or admin).
 * Contains the cancel link so the customer can self-cancel before the
 * appointment time.
 */
import { escHtml } from '../escape-html';

export interface BookingConfirmationData {
  customer: {
    firstName: string;
    email: string;
  };
  booking: {
    confirmationNumber: string;
    startTime: Date;
    endTime: Date;
  };
  staff: { name: string };
  service: { name: string; durationMinutes: number; priceCents: number | null };
  merchant: {
    businessName: string;
    slug: string;
    customSiteName?: string | null;
    customAvatarUrl?: string | null;
  };
  cancelUrl: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatPrice(priceCents: number | null): string {
  if (priceCents === null) return '';
  return ` · $${(priceCents / 100).toFixed(2)}`;
}

// Constants for defaults
const DEFAULT_SITE_NAME = 'SimplyBook';
const DEFAULT_LOGO_URL = '/logo.svg';

export function buildBookingConfirmationEmail(data: BookingConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { customer, booking, staff, service, merchant, cancelUrl } = data;
  const dateStr = formatDate(booking.startTime);
  const startStr = formatTime(booking.startTime);
  const endStr = formatTime(booking.endTime);
  const priceStr = formatPrice(service.priceCents);

  // Custom branding with fallbacks
  const siteName = merchant.customSiteName || DEFAULT_SITE_NAME;
  const avatarUrl = merchant.customAvatarUrl || DEFAULT_LOGO_URL;

  // HTML-escape all user-/merchant-supplied fields before interpolating into
  // the HTML body.  Plain-text and subject strings are NOT escaped (they are
  // transmitted as-is and must not contain HTML entities).
  const eBusiness = escHtml(merchant.businessName);
  const eSiteName = escHtml(siteName);
  const eAvatarUrl = escHtml(avatarUrl);
  const eFirstName = escHtml(customer.firstName);
  const eServiceName = escHtml(service.name);
  const eStaffName = escHtml(staff.name);
  // cancelUrl is server-generated, but escape for defence-in-depth so a stray
  // " or < in a future code path cannot break out of the href attribute.
  const eCancelUrl = escHtml(cancelUrl);

  const subject = `Booking confirmed — ${booking.confirmationNumber} · ${siteName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px">
        <!-- Header with custom branding -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="100" style="vertical-align:middle;padding-right:16px">
                  <img src="${eAvatarUrl}" alt="${eSiteName}" style="width:80px;height:80px;border-radius:8px;display:block;background:#ffffff" />
                </td>
                <td style="vertical-align:middle">
                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold">${eSiteName}</p>
                  <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Booking confirmation</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:15px;color:#334155">Hi ${eFirstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#334155">Thank you for booking with ${eSiteName}. Your appointment is confirmed. Here are your details:</p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f1f5f9;border-radius:6px;padding:0;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Confirmation</p>
                  <p style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#0f172a">${booking.confirmationNumber}</p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:110px">Date</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Time</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${startStr} – ${endStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Service</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eServiceName}${priceStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Staff</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eStaffName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Cancel CTA -->
            <p style="margin:0 0 8px;font-size:14px;color:#64748b">
              Need to cancel? You can cancel this appointment before it starts:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr>
                <td style="background:#ef4444;border-radius:5px">
                  <a href="${eCancelUrl}"
                     style="display:inline-block;padding:10px 20px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">
                    Cancel appointment
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8">
              This cancel link expires when your appointment starts. After that, please contact ${eBusiness} directly.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              You received this because you booked an appointment with ${eBusiness}.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Booking Confirmed — ${merchant.businessName}

Hi ${customer.firstName},

Your appointment is confirmed.

Confirmation: ${booking.confirmationNumber}
Date: ${dateStr}
Time: ${startStr} – ${endStr}
Service: ${service.name}${priceStr}
Staff: ${staff.name}

To cancel this appointment, visit:
${cancelUrl}

This cancel link expires when your appointment starts.
`;

  return { subject, html, text };
}
