/**
 * Discount types and utilities for admin discount management
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export type DiscountStatus = 'active' | 'expired' | 'inactive';

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
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
 * Determine discount status based on expiration date and active flag
 */
export function getDiscountStatus(discount: Discount): DiscountStatus {
  if (!discount.isActive) {
    return 'inactive';
  }

  if (discount.expirationDate && new Date(discount.expirationDate) < new Date()) {
    return 'expired';
  }

  return 'active';
}

/**
 * Format discount value based on type
 */
export function formatDiscountValue(value: number, type: DiscountType): string {
  switch (type) {
    case 'percentage':
      return `${value}%`;
    case 'fixed_amount':
      return `$${value.toFixed(2)}`;
    case 'free_shipping':
      return 'Free Shipping';
    default:
      return value.toString();
  }
}
