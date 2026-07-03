/**
 * Discount types and utilities for admin discount management
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export type DiscountStatus = 'active' | 'expired' | 'inactive';

export interface Discount {
  id: string;
  code: string;
  discountPercentage: number;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountResponse {
  data?: Discount | Discount[];
  error?: string | null;
}

export interface DiscountListResponse {
  data: {
    discounts: Discount[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string | null;
}

/**
 * Determine discount status based on end date and active flag
 */
export function getDiscountStatus(discount: Discount): DiscountStatus {
  if (!discount.isActive) {
    return 'inactive';
  }

  if (discount.endsAt && new Date(discount.endsAt) < new Date()) {
    return 'expired';
  }

  return 'active';
}

/**
 * Format discount value (percentage-only)
 */
export function formatDiscountValue(percentage: number): string {
  return `${percentage}%`;
}
