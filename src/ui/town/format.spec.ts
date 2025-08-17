import { describe, it, expect } from 'vitest';

import type { Town } from '../../types/Town';

import { formatCurrency, labelProsperity, labelMilitary, ariaTownSummary } from './format';

describe('format', () => {
  describe('formatCurrency', () => {
    it('formats positive integers correctly', () => {
      expect(formatCurrency(12)).toBe('₲12');
      expect(formatCurrency(0)).toBe('₲0');
      expect(formatCurrency(999)).toBe('₲999');
    });

    it('handles decimal numbers by truncating to integers', () => {
      expect(formatCurrency(12.7)).toBe('₲12');
      expect(formatCurrency(12.1)).toBe('₲12');
      expect(formatCurrency(12.9)).toBe('₲12');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-5)).toBe('₲-5');
      expect(formatCurrency(-5.7)).toBe('₲-6');
    });

    it('allows custom currency symbols', () => {
      expect(formatCurrency(12, '$')).toBe('$12');
      expect(formatCurrency(12, '€')).toBe('€12');
    });
  });

  describe('labelProsperity', () => {
    it('returns correct labels for all prosperity tiers', () => {
      expect(labelProsperity('struggling')).toBe('Struggling');
      expect(labelProsperity('modest')).toBe('Modest');
      expect(labelProsperity('prosperous')).toBe('Prosperous');
      expect(labelProsperity('opulent')).toBe('Opulent');
    });
  });

  describe('labelMilitary', () => {
    it('returns correct labels for all military tiers', () => {
      expect(labelMilitary('militia')).toBe('Small militia');
      expect(labelMilitary('garrison')).toBe('Garrison');
      expect(labelMilitary('formidable')).toBe('Formidable');
      expect(labelMilitary('host')).toBe('Host');
    });
  });

  describe('ariaTownSummary', () => {
    it('generates correct ARIA summary with name and both tiers', () => {
      const mockTown: Town = {
        id: 'test-town',
        name: 'Test Town',
        resources: { fish: 0, wood: 0, ore: 0 },
        prices: { fish: 10, wood: 15, ore: 20 },
        militaryRaw: 50,
        prosperityRaw: 75,
        treasury: 100,
        revealed: {
          militaryTier: 'garrison',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      };

      const result = ariaTownSummary(mockTown);
      expect(result).toBe('Test Town. Prosperity: Prosperous. Military: Garrison.');
    });

    it('handles different tier combinations', () => {
      const mockTown: Town = {
        id: 'test-town',
        name: 'Another Town',
        resources: { fish: 0, wood: 0, ore: 0 },
        prices: { fish: 5, wood: 8, ore: 12 },
        militaryRaw: -10,
        prosperityRaw: -20,
        treasury: 50,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 1,
        },
      };

      const result = ariaTownSummary(mockTown);
      expect(result).toBe('Another Town. Prosperity: Struggling. Military: Small militia.');
    });
  });
});
