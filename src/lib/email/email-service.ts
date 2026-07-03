/**
 * High-level email service — the single entry point for all transactional emails.
 *
 * Each function is fire-and-forget safe: call with `sendXxx(...).catch(() => {})` from
 * route handlers to avoid blocking the HTTP response on email delivery.
 *
 * All failures are logged inside `sendEmail()` and never re-thrown.
 */
import { sendEmail } from './sendgrid';
import { buildBookingConfirmationEmail, type BookingConfirmationData } from './templates/booking-confirmation';
import { buildBookingRescheduledEmail, type BookingRescheduledData } from './templates/booking-rescheduled';
import {
  buildBookingCancelledCustomerEmail,
  buildBookingCancelledMerchantEmail,
  type BookingCancelledCustomerData,
  type BookingCancelledMerchantData,
} from './templates/booking-cancelled';
import { buildMerchantNewBookingEmail, type MerchantNewBookingData } from './templates/merchant-new-booking';

// ---------------------------------------------------------------------------
// Re-export data types so callers only need to import from this module
// ---------------------------------------------------------------------------
export type {
  BookingConfirmationData,
  BookingRescheduledData,
  BookingCancelledCustomerData,
  BookingCancelledMerchantData,
  MerchantNewBookingData,
};

// ---------------------------------------------------------------------------
// 1. Booking confirmation → customer
// ---------------------------------------------------------------------------

/**
 * Send booking confirmation email to the customer.
 * Includes a cancel link valid until the appointment start time.
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationData
): Promise<void> {
  const { subject, html, text } = buildBookingConfirmationEmail(data);
  await sendEmail({ to: data.customer.email, subject, html, text });
}

// ---------------------------------------------------------------------------
// 2. New booking alert → merchant owner
// ---------------------------------------------------------------------------

/**
 * Notify the merchant owner of a new booking.
 * Contains customer contact details so they can reach out if needed.
 */
export async function sendNewBookingAlert(
  data: MerchantNewBookingData
): Promise<void> {
  const { subject, html, text } = buildMerchantNewBookingEmail(data);
  await sendEmail({ to: data.merchant.ownerEmail, subject, html, text });
}

// ---------------------------------------------------------------------------
// 3. Reschedule notification → customer
// ---------------------------------------------------------------------------

/**
 * Notify the customer that their appointment has been rescheduled by an admin.
 * Does NOT include a new cancel link (per design spec D-05).
 */
export async function sendReschedulingNotification(
  data: BookingRescheduledData
): Promise<void> {
  const { subject, html, text } = buildBookingRescheduledEmail(data);
  await sendEmail({ to: data.customer.email, subject, html, text });
}

// ---------------------------------------------------------------------------
// 4. Cancellation receipt → customer
// ---------------------------------------------------------------------------

/**
 * Send a cancellation receipt to the customer.
 * No cancel link — informational only.
 */
export async function sendCancellationToCustomer(
  data: BookingCancelledCustomerData
): Promise<void> {
  const { subject, html, text } = buildBookingCancelledCustomerEmail(data);
  await sendEmail({ to: data.customer.email, subject, html, text });
}

// ---------------------------------------------------------------------------
// 5. Cancellation alert → merchant owner
// ---------------------------------------------------------------------------

/**
 * Notify the merchant owner that a booking was cancelled (by customer or admin).
 */
export async function sendCancellationAlertToMerchant(
  data: BookingCancelledMerchantData
): Promise<void> {
  const { subject, html, text } = buildBookingCancelledMerchantEmail(data);
  await sendEmail({ to: data.merchant.ownerEmail, subject, html, text });
}
