import productionData from '../../data/production.json';
import type { ProductionConfig } from '../../types/Production';

/**
 * Loads the production configuration from the JSON data file.
 * @returns The production configuration with base rates and town multipliers
 */
export function loadProductionConfig(): ProductionConfig {
  return productionData as ProductionConfig;
}
