import type { MilitaryTier, ProsperityTier } from '../../types/Tiers';
import type { Town } from '../../types/Town';

/**
 * Formats a number as currency with the specified symbol.
 * Always returns integers without decimal places.
 *
 * @param n - The number to format
 * @param symbol - The currency symbol (defaults to '₲')
 * @returns Formatted currency string
 */
export function formatCurrency(n: number, symbol = '₲'): string {
  return `${symbol}${Math.floor(n)}`;
}

/**
 * Returns the human-readable label for a prosperity tier.
 *
 * @param tier - The prosperity tier
 * @returns The display label for the tier
 */
export function labelProsperity(tier: ProsperityTier): string {
  switch (tier) {
    case 'struggling':
      return 'Struggling';
    case 'modest':
      return 'Modest';
    case 'prosperous':
      return 'Prosperous';
    case 'opulent':
      return 'Opulent';
  }
}

/**
 * Returns the human-readable label for a military tier.
 *
 * @param tier - The military tier
 * @returns The display label for the tier
 */
export function labelMilitary(tier: MilitaryTier): string {
  switch (tier) {
    case 'militia':
      return 'Small militia';
    case 'garrison':
      return 'Garrison';
    case 'formidable':
      return 'Formidable';
    case 'host':
      return 'Host';
  }
}

/**
 * Generates ARIA-friendly summary text for a town.
 *
 * @param town - The town to generate summary for
 * @returns Accessible summary text including name and tier information
 */
export function ariaTownSummary(town: Town): string {
  const prosperityLabel = labelProsperity(town.revealed.prosperityTier);
  const militaryLabel = labelMilitary(town.revealed.militaryTier);

  return `${town.name}. Prosperity: ${prosperityLabel}. Military: ${militaryLabel}.`;
}
