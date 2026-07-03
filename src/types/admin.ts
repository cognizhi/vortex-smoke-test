export interface Booking {
  id: string
  confirmationNumber: string
  status: 'confirmed' | 'cancelled_customer' | 'cancelled_admin' | 'rescheduled'
  startTime: string
  endTime: string
  staffId: string
  serviceId: string
  customerId: string
  cancelToken: string
  cancelledAt: string | null
  createdAt: string
  // populated joins (optional, only in detail view)
  customer?: { id: string; firstName: string; email: string; contactNumber: string }
  staff?: { id: string; name: string }
  service?: { id: string; name: string; durationMinutes: number; priceCents: number | null }
}

export interface Staff {
  id: string
  name: string
  photoUrl: string | null
  contactNumber: string | null
  email: string | null
  isVisible: boolean
  createdAt: string
  availability?: StaffAvailability[]
}

export interface StaffAvailability {
  id: string
  staffId: string
  dayOfWeek: number  // 0=Sunday..6=Saturday
  startTime: string  // HH:MM
  endTime: string    // HH:MM
  maxConcurrent: number
}

export interface StaffBlockedDate {
  id: string
  staffId: string
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  reason: string | null
  createdAt: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  priceCents: number | null
  isEnabled: boolean
  createdAt: string
}

export interface Customer {
  id: string
  email: string
  firstName: string
  contactNumber: string
  isVerified: boolean
  createdAt: string
}

export interface MerchantSettings {
  slotDurationMinutes: number
  bookingExpiryMinutes: number
  displayLanguage: string
}

export interface MerchantDesign {
  pageHeadline: string | null
  pageSubheadline: string | null
  slotAvailableBg: string
  slotAvailableText: string
  slotUnavailableBg: string
  slotUnavailableText: string
  calendarBorderWidth: number
  calendarBorderColor: string
  calendarBorderRadius: number
  calendarFontSize: number
}

export type BookingStatus = Booking['status']

export interface Discount {
  id: string
  code: string
  type: 'percentage' | 'fixed_amount'
  value: string
  description: string | null
  expirationDate: string
  isActive: boolean
  timesUsed: number
  createdAt: string
  updatedAt: string
}
