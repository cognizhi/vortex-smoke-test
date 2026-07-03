/**
 * Email template: Booking Rescheduled → sent to the customer.
 *
 * Sent when an admin reschedules a booking. No cancel link is included
 * (per design spec D-05).
 */
import { escHtml } from '../escape-html';

export interface BookingRescheduledData {
  customer: { firstName: string; email: string };
  booking: {
    confirmationNumber: string;
    newStartTime: Date;
    newEndTime: Date;
  };
  oldStartTime: Date;
  staff: { name: string };
  service: { name: string };
  merchant: { businessName: string };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function buildBookingRescheduledEmail(data: BookingRescheduledData): {
  subject: string;
  html: string;
  text: string;
} {
  const { customer, booking, oldStartTime, staff, service, merchant } = data;

  const oldDateStr = formatDate(oldStartTime);
  const oldTimeStr = formatTime(oldStartTime);
  const newDateStr = formatDate(booking.newStartTime);
  const newStartStr = formatTime(booking.newStartTime);
  const newEndStr = formatTime(booking.newEndTime);

  // HTML-escape all user-/merchant-supplied fields before interpolating into
  // the HTML body.  Plain-text and subject strings are NOT escaped.
  const eBusiness = escHtml(merchant.businessName);
  const eFirstName = escHtml(customer.firstName);
  const eServiceName = escHtml(service.name);
  const eStaffName = escHtml(staff.name);

  const subject = `Appointment rescheduled — ${booking.confirmationNumber} · ${merchant.businessName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px">
        <tr>
          <td style="background:#0f172a;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold">${eBusiness}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Appointment rescheduled</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 24px;font-size:15px;color:#334155">
              Hi ${eFirstName}, your appointment has been rescheduled. Here are your updated details:
            </p>

            <!-- Old time (struck through) -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:6px;margin-bottom:16px">
              <tr>
                <td style="padding:16px 24px">
                  <p style="margin:0 0 4px;font-size:12px;color:#ef4444;text-transform:uppercase;letter-spacing:.5px">Previous time</p>
                  <p style="margin:0;font-size:14px;color:#7f1d1d;text-decoration:line-through">${oldDateStr} at ${oldTimeStr}</p>
                </td>
              </tr>
            </table>

            <!-- New time -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:12px;color:#16a34a;text-transform:uppercase;letter-spacing:.5px">New time</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:110px">Date</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${newDateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Time</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${newStartStr} – ${newEndStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Service</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eServiceName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Staff</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eStaffName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Ref</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${booking.confirmationNumber}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8">
              If you have any questions, please contact ${eBusiness} directly.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              You received this because you have an appointment with ${eBusiness}.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Appointment Rescheduled — ${merchant.businessName}

Hi ${customer.firstName},

Your appointment has been rescheduled.

Previous time: ${oldDateStr} at ${oldTimeStr}

New details:
  Ref:      ${booking.confirmationNumber}
  Date:     ${newDateStr}
  Time:     ${newStartStr} – ${newEndStr}
  Service:  ${service.name}
  Staff:    ${staff.name}

If you have any questions, please contact ${merchant.businessName} directly.
`;

  return { subject, html, text };
}
