/**
 * Email template: New Booking Alert → sent to the merchant (business owner).
 *
 * Sent immediately after a new booking is confirmed.
 */
import { escHtml } from '../escape-html';

export interface MerchantNewBookingData {
  customer: { firstName: string; email: string; contactNumber: string };
  booking: {
    confirmationNumber: string;
    startTime: Date;
    endTime: Date;
  };
  staff: { name: string };
  service: { name: string };
  merchant: { businessName: string; ownerEmail: string };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function buildMerchantNewBookingEmail(data: MerchantNewBookingData): {
  subject: string;
  html: string;
  text: string;
} {
  const { customer, booking, staff, service, merchant } = data;
  const dateStr = formatDate(booking.startTime);
  const startStr = formatTime(booking.startTime);
  const endStr = formatTime(booking.endTime);

  // HTML-escape all user-/merchant-supplied fields before interpolating into
  // the HTML body.  Plain-text and subject strings are NOT escaped.
  const eBusiness = escHtml(merchant.businessName);
  const eFirstName = escHtml(customer.firstName);
  const eEmail = escHtml(customer.email);
  const eContactNumber = escHtml(customer.contactNumber);
  const eServiceName = escHtml(service.name);
  const eStaffName = escHtml(staff.name);

  const subject = `New booking — ${booking.confirmationNumber} · ${customer.firstName}`;

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
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">New booking received</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 24px;font-size:15px;color:#334155">
              You have a new booking. Here are the details:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f0fdf4;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:13px;color:#16a34a;text-transform:uppercase;letter-spacing:.5px">Booking details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:130px">Ref</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${booking.confirmationNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Date</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Time</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${startStr} – ${endStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Service</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eServiceName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Staff</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${eStaffName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f1f5f9;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Customer</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:130px">Name</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eFirstName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Email</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Phone</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eContactNumber}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              ${eBusiness} booking management
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `New Booking — ${merchant.businessName}

You have a new booking:

  Ref:      ${booking.confirmationNumber}
  Date:     ${dateStr}
  Time:     ${startStr} – ${endStr}
  Service:  ${service.name}
  Staff:    ${staff.name}

Customer:
  Name:     ${customer.firstName}
  Email:    ${customer.email}
  Phone:    ${customer.contactNumber}
`;

  return { subject, html, text };
}
