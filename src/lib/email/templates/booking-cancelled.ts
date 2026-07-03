/**
 * Email templates for booking cancellations.
 *
 * Two variants:
 *  1. Customer receipt — sent when a customer self-cancels or admin cancels
 *  2. Merchant alert   — sent to the business owner when any cancellation occurs
 *
 * No cancel link is included in these emails (per design spec D-05).
 */
import { escHtml } from '../escape-html';

export type CancelledBy = 'customer' | 'admin';

export interface BookingCancelledCustomerData {
  customer: { firstName: string; email: string };
  booking: {
    confirmationNumber: string;
    startTime: Date;
    endTime: Date;
  };
  staff: { name: string };
  service: { name: string };
  merchant: { businessName: string };
  cancelledBy: CancelledBy;
}

export interface BookingCancelledMerchantData {
  customer: { firstName: string; email: string };
  booking: {
    confirmationNumber: string;
    startTime: Date;
    endTime: Date;
  };
  staff: { name: string };
  service: { name: string };
  merchant: { businessName: string; ownerEmail: string };
  cancelledBy: CancelledBy;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ---------------------------------------------------------------------------
// 1. Customer receipt
// ---------------------------------------------------------------------------

export function buildBookingCancelledCustomerEmail(data: BookingCancelledCustomerData): {
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
  const eServiceName = escHtml(service.name);
  const eStaffName = escHtml(staff.name);

  const subject = `Booking cancelled — ${booking.confirmationNumber} · ${merchant.businessName}`;

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
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Booking cancelled</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 24px;font-size:15px;color:#334155">
              Hi ${eFirstName}, your appointment has been cancelled. Here is a summary:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#fef2f2;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0 0 12px;font-size:13px;color:#ef4444;text-transform:uppercase;letter-spacing:.5px">Cancelled appointment</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:110px">Ref</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${booking.confirmationNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Date</td>
                      <td style="padding:4px 0;font-size:14px;color:#7f1d1d;font-weight:600;text-decoration:line-through">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Time</td>
                      <td style="padding:4px 0;font-size:14px;color:#7f1d1d;text-decoration:line-through">${startStr} – ${endStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Service</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eServiceName}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Staff</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eStaffName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8">
              If you'd like to rebook, visit ${eBusiness}&#39;s booking page.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              You received this because you had an appointment with ${eBusiness}.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Booking Cancelled — ${merchant.businessName}

Hi ${customer.firstName},

Your appointment has been cancelled.

  Ref:      ${booking.confirmationNumber}
  Date:     ${dateStr}
  Time:     ${startStr} – ${endStr}
  Service:  ${service.name}
  Staff:    ${staff.name}

If you'd like to rebook, please visit ${merchant.businessName}'s booking page.
`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 2. Merchant alert
// ---------------------------------------------------------------------------

export function buildBookingCancelledMerchantEmail(data: BookingCancelledMerchantData): {
  subject: string;
  html: string;
  text: string;
} {
  const { customer, booking, staff, service, merchant, cancelledBy } = data;
  const dateStr = formatDate(booking.startTime);
  const startStr = formatTime(booking.startTime);
  const endStr = formatTime(booking.endTime);
  const initiator = cancelledBy === 'customer' ? 'the customer' : 'an admin';

  // HTML-escape all user-/merchant-supplied fields before interpolating into
  // the HTML body.  Plain-text and subject strings are NOT escaped.
  const eBusiness2 = escHtml(merchant.businessName);
  const eFirstName2 = escHtml(customer.firstName);
  const eEmail2 = escHtml(customer.email);
  const eServiceName2 = escHtml(service.name);
  const eStaffName2 = escHtml(staff.name);

  const subject = `Booking cancelled by ${initiator} — ${booking.confirmationNumber}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px">
        <tr>
          <td style="background:#0f172a;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold">${eBusiness2}</p>
            <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Booking cancellation alert</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 24px;font-size:15px;color:#334155">
              A booking has been cancelled by ${initiator}:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#fef2f2;border-radius:6px;margin-bottom:24px">
              <tr>
                <td style="padding:20px 24px">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b;width:130px">Ref</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;font-weight:600">${booking.confirmationNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Customer</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eFirstName2} (${eEmail2})</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Date</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${dateStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Time</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${startStr} – ${endStr}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Service</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eServiceName2}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Staff</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a">${eStaffName2}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;font-size:14px;color:#64748b">Cancelled by</td>
                      <td style="padding:4px 0;font-size:14px;color:#0f172a;text-transform:capitalize">${cancelledBy === 'customer' ? 'Customer' : 'Admin'}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#94a3b8">
              The slot is now free. No action required unless you wish to follow up.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
              ${eBusiness2} booking management
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Booking Cancellation Alert — ${merchant.businessName}

A booking has been cancelled by ${initiator}:

  Ref:          ${booking.confirmationNumber}
  Customer:     ${customer.firstName} (${customer.email})
  Date:         ${dateStr}
  Time:         ${startStr} – ${endStr}
  Service:      ${service.name}
  Staff:        ${staff.name}
  Cancelled by: ${cancelledBy === 'customer' ? 'Customer' : 'Admin'}

The slot is now free.
`;

  return { subject, html, text };
}
