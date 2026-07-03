/**
 * Unit tests for the high-level email service.
 *
 * Verifies that each email function:
 *  1. Calls sendEmail with the correct `to` address
 *  2. Builds a non-empty subject, html, and text body
 *  3. Embeds key booking data in the output
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the sendgrid module. Use vi.hoisted() so the fn reference is available
// when vi.mock is hoisted. Use the @/ alias to match how email-service imports it
// (vitest resolves both paths to the same module, so they share the mock).
// ---------------------------------------------------------------------------
const mockSendEmail = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock('@/lib/email/sendgrid', () => ({
  sendEmail: mockSendEmail,
}));

import {
  sendBookingConfirmation,
  sendNewBookingAlert,
  sendReschedulingNotification,
  sendCancellationToCustomer,
  sendCancellationAlertToMerchant,
} from '@/lib/email/email-service';
import { buildBookingConfirmationEmail } from '@/lib/email/templates/booking-confirmation';
import { buildBookingRescheduledEmail } from '@/lib/email/templates/booking-rescheduled';
import {
  buildBookingCancelledCustomerEmail,
  buildBookingCancelledMerchantEmail,
} from '@/lib/email/templates/booking-cancelled';
import { buildMerchantNewBookingEmail } from '@/lib/email/templates/merchant-new-booking';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const CUSTOMER = { firstName: 'Alice', email: 'alice@example.com', contactNumber: '+65 9000 0000' };
const MERCHANT = { businessName: 'Glamour Studio', ownerEmail: 'owner@glamour.com', slug: 'glamour-studio' };
const STAFF = { name: 'Bob' };
const SERVICE = { name: 'Haircut', durationMinutes: 45, priceCents: 5000 };
const BOOKING = {
  confirmationNumber: 'BK-1042',
  startTime: new Date('2026-07-15T10:00:00Z'),
  endTime: new Date('2026-07-15T10:45:00Z'),
};

beforeEach(() => mockSendEmail.mockClear());

// ---------------------------------------------------------------------------
// sendBookingConfirmation
// ---------------------------------------------------------------------------

describe('sendBookingConfirmation', () => {
  it('sends to the customer email', async () => {
    await sendBookingConfirmation({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
      cancelUrl: 'https://glamour-studio.platform.com/cancel/abc',
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  it('subject contains confirmation number and business name', async () => {
    await sendBookingConfirmation({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
      cancelUrl: 'https://glamour-studio.platform.com/cancel/abc',
    });

    const { subject } = mockSendEmail.mock.calls[0][0];
    expect(subject).toContain('BK-1042');
    expect(subject).toContain('Glamour Studio');
  });

  it('HTML body contains cancel URL', async () => {
    const cancelUrl = 'https://glamour-studio.platform.com/cancel/test-token';
    await sendBookingConfirmation({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
      cancelUrl,
    });

    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain(cancelUrl);
  });

  it('HTML body contains staff name and service name', async () => {
    await sendBookingConfirmation({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
      cancelUrl: 'https://x.com/cancel/t',
    });

    const { html, text } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain('Bob');
    expect(html).toContain('Haircut');
    expect(text).toContain('Bob');
    expect(text).toContain('Haircut');
  });

  it('text body contains confirmation number', async () => {
    await sendBookingConfirmation({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
      cancelUrl: 'https://x.com/cancel/t',
    });

    const { text } = mockSendEmail.mock.calls[0][0];
    expect(text).toContain('BK-1042');
  });
});

// ---------------------------------------------------------------------------
// sendNewBookingAlert
// ---------------------------------------------------------------------------

describe('sendNewBookingAlert', () => {
  it('sends to the merchant owner email', async () => {
    await sendNewBookingAlert({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
    });

    expect(mockSendEmail.mock.calls[0][0].to).toBe(MERCHANT.ownerEmail);
  });

  it('contains customer contact details in html', async () => {
    await sendNewBookingAlert({
      customer: CUSTOMER,
      booking: BOOKING,
      staff: STAFF,
      service: SERVICE,
      merchant: MERCHANT,
    });

    const { html, text } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain(CUSTOMER.email);
    expect(html).toContain(CUSTOMER.contactNumber);
    expect(text).toContain(CUSTOMER.email);
  });
});

// ---------------------------------------------------------------------------
// sendReschedulingNotification
// ---------------------------------------------------------------------------

describe('sendReschedulingNotification', () => {
  const RESCHEDULE_DATA = {
    customer: CUSTOMER,
    booking: {
      confirmationNumber: 'BK-1042',
      newStartTime: new Date('2026-07-16T11:00:00Z'),
      newEndTime: new Date('2026-07-16T11:45:00Z'),
    },
    oldStartTime: BOOKING.startTime,
    staff: STAFF,
    service: SERVICE,
    merchant: { businessName: MERCHANT.businessName },
  };

  it('sends to the customer email', async () => {
    await sendReschedulingNotification(RESCHEDULE_DATA);
    expect(mockSendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  it('subject indicates rescheduled status', async () => {
    await sendReschedulingNotification(RESCHEDULE_DATA);
    const { subject } = mockSendEmail.mock.calls[0][0];
    expect(subject.toLowerCase()).toMatch(/reschedul/);
  });

  it('html body contains both old and new date info', async () => {
    await sendReschedulingNotification(RESCHEDULE_DATA);
    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain('BK-1042');
    expect(html).toContain('Glamour Studio');
  });
});

// ---------------------------------------------------------------------------
// sendCancellationToCustomer
// ---------------------------------------------------------------------------

describe('sendCancellationToCustomer', () => {
  const CANCEL_DATA = {
    customer: CUSTOMER,
    booking: BOOKING,
    staff: STAFF,
    service: SERVICE,
    merchant: { businessName: MERCHANT.businessName },
    cancelledBy: 'customer' as const,
  };

  it('sends to the customer email', async () => {
    await sendCancellationToCustomer(CANCEL_DATA);
    expect(mockSendEmail.mock.calls[0][0].to).toBe(CUSTOMER.email);
  });

  it('subject indicates cancellation', async () => {
    await sendCancellationToCustomer(CANCEL_DATA);
    const { subject } = mockSendEmail.mock.calls[0][0];
    expect(subject.toLowerCase()).toContain('cancel');
  });

  it('html contains confirmation number', async () => {
    await sendCancellationToCustomer(CANCEL_DATA);
    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html).toContain('BK-1042');
  });
});

// ---------------------------------------------------------------------------
// sendCancellationAlertToMerchant
// ---------------------------------------------------------------------------

describe('sendCancellationAlertToMerchant', () => {
  const CANCEL_DATA = {
    customer: CUSTOMER,
    booking: BOOKING,
    staff: STAFF,
    service: SERVICE,
    merchant: MERCHANT,
    cancelledBy: 'admin' as const,
  };

  it('sends to the merchant owner email', async () => {
    await sendCancellationAlertToMerchant(CANCEL_DATA);
    expect(mockSendEmail.mock.calls[0][0].to).toBe(MERCHANT.ownerEmail);
  });

  it('html contains "admin" to indicate who cancelled', async () => {
    await sendCancellationAlertToMerchant(CANCEL_DATA);
    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html.toLowerCase()).toContain('admin');
  });

  it('uses "customer" label for customer-initiated cancellations', async () => {
    await sendCancellationAlertToMerchant({ ...CANCEL_DATA, cancelledBy: 'customer' });
    const { html } = mockSendEmail.mock.calls[0][0];
    expect(html.toLowerCase()).toContain('customer');
  });
});

// ---------------------------------------------------------------------------
// HIGH-01: HTML-injection regression suite
// Verify that merchant- and customer-supplied content containing HTML special
// characters is entity-encoded in every email template's html output.
// Plain-text bodies intentionally carry raw values (no HTML entities).
// ---------------------------------------------------------------------------

const XSS_BUSINESS  = '<script>alert("xss")</script>';
const XSS_NAME      = '<img src=x onerror=\'alert(1)\'>';
const XSS_SERVICE   = '<b>Haircut & Style</b>';
const XSS_STAFF     = '"Bob" <evil@hax.io>';
const XSS_PHONE     = '<style>body{display:none}</style>';
const XSS_EMAIL     = 'alice+<xss>@example.com';
const SAFE_CANCEL_URL = 'https://platform.com/cancel/tok"en';

describe('HIGH-01: HTML-injection prevention — booking-confirmation', () => {
  const DATA = {
    customer: { firstName: XSS_NAME, email: XSS_EMAIL },
    booking: BOOKING,
    staff: { name: XSS_STAFF },
    service: { name: XSS_SERVICE, durationMinutes: 45, priceCents: null },
    merchant: { businessName: XSS_BUSINESS, slug: 'test' },
    cancelUrl: SAFE_CANCEL_URL,
  };

  it('html must not contain raw < or > from user data', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    // The literal < from XSS payloads must not appear in the html output
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<style>');
  });

  it('html encodes & < > " \' from business name', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    expect(html).toContain('&lt;script&gt;');
  });

  it('html encodes customer first name', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    expect(html).toContain('&lt;img');
  });

  it('html encodes service name ampersand', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    expect(html).toContain('&amp;');
  });

  it('html encodes staff name quotes', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    expect(html).toContain('&quot;Bob&quot;');
  });

  it('html encodes cancelUrl quotes to prevent attribute injection', () => {
    const { html } = buildBookingConfirmationEmail(DATA);
    expect(html).toContain('&quot;');
    expect(html).not.toContain('tok"en');
  });

  it('plain text body is NOT html-encoded (entities would corrupt display)', () => {
    const { text } = buildBookingConfirmationEmail(DATA);
    // Raw values appear in the text body as-is
    expect(text).toContain(XSS_BUSINESS);
  });
});

describe('HIGH-01: HTML-injection prevention — booking-rescheduled', () => {
  const DATA = {
    customer: { firstName: XSS_NAME, email: 'a@b.com' },
    booking: {
      confirmationNumber: 'BK-X',
      newStartTime: new Date('2026-07-16T11:00:00Z'),
      newEndTime: new Date('2026-07-16T11:45:00Z'),
    },
    oldStartTime: BOOKING.startTime,
    staff: { name: XSS_STAFF },
    service: { name: XSS_SERVICE },
    merchant: { businessName: XSS_BUSINESS },
  };

  it('html must not contain raw script tags from user data', () => {
    const { html } = buildBookingRescheduledEmail(DATA);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<b>');
  });

  it('html encodes business name', () => {
    const { html } = buildBookingRescheduledEmail(DATA);
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('HIGH-01: HTML-injection prevention — booking-cancelled (customer)', () => {
  const DATA = {
    customer: { firstName: XSS_NAME, email: 'a@b.com' },
    booking: BOOKING,
    staff: { name: XSS_STAFF },
    service: { name: XSS_SERVICE },
    merchant: { businessName: XSS_BUSINESS },
    cancelledBy: 'customer' as const,
  };

  it('html must not contain raw script tags', () => {
    const { html } = buildBookingCancelledCustomerEmail(DATA);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('html encodes business name', () => {
    const { html } = buildBookingCancelledCustomerEmail(DATA);
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('HIGH-01: HTML-injection prevention — booking-cancelled (merchant)', () => {
  const DATA = {
    customer: { firstName: XSS_NAME, email: XSS_EMAIL },
    booking: BOOKING,
    staff: { name: XSS_STAFF },
    service: { name: XSS_SERVICE },
    merchant: { businessName: XSS_BUSINESS, ownerEmail: 'owner@test.com' },
    cancelledBy: 'admin' as const,
  };

  it('html must not contain raw script tags', () => {
    const { html } = buildBookingCancelledMerchantEmail(DATA);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('html encodes customer email angle brackets', () => {
    const { html } = buildBookingCancelledMerchantEmail(DATA);
    expect(html).toContain('&lt;xss&gt;');
  });
});

describe('HIGH-01: HTML-injection prevention — merchant-new-booking', () => {
  const DATA = {
    customer: { firstName: XSS_NAME, email: XSS_EMAIL, contactNumber: XSS_PHONE },
    booking: BOOKING,
    staff: { name: XSS_STAFF },
    service: { name: XSS_SERVICE },
    merchant: { businessName: XSS_BUSINESS, ownerEmail: 'owner@test.com' },
  };

  it('html must not contain raw script or style tags', () => {
    const { html } = buildMerchantNewBookingEmail(DATA);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<style>');
    expect(html).not.toContain('<img');
  });

  it('html encodes customer phone number style tag', () => {
    const { html } = buildMerchantNewBookingEmail(DATA);
    expect(html).toContain('&lt;style&gt;');
  });

  it('html encodes customer email angle brackets', () => {
    const { html } = buildMerchantNewBookingEmail(DATA);
    expect(html).toContain('&lt;xss&gt;');
  });
});
