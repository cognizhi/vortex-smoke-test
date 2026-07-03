import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles conditional classes', () => {
      expect(cn('px-2', false && 'px-4')).toBe('px-2');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2026-05-30');
      const formatted = formatDate(date);
      expect(formatted).toContain('May');
      expect(formatted).toContain('30');
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const date = new Date('2026-05-30T14:30:00');
      const formatted = formatTime(date);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
