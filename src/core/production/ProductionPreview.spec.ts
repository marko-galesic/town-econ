import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

import { applyProductionTurn, previewProduction } from './ProductionSystem';

describe('ProductionPreview', () => {
  it('should have previewProduction function available', () => {
    expect(typeof previewProduction).toBe('function');
  });

  // Helper function to create a minimal test game state
  function createTestGameState(
    towns: Array<{ id: string; name: string; resources: Partial<Record<GoodId, number>> }>,
    turn = 0,
    rngSeed = 'test-seed',
  ): GameState {
    return {
      turn,
      version: 1,
      rngSeed,
      towns: towns.map(town => ({
        id: town.id,
        name: town.name,
        resources: {
          fish: town.resources.fish ?? 0,
          wood: town.resources.wood ?? 0,
          ore: town.resources.ore ?? 0,
        },
        prices: { fish: 10, wood: 10, ore: 10 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 100,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      })),
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 2 } },
      },
    };
  }

  // Helper function to create a test production config
  function createTestProductionConfig(
    base: Record<GoodId, number>,
    townMultipliers?: Record<string, Partial<Record<GoodId, number>>>,
    variance?: { enabled: boolean; magnitude?: 1 | 2 },
    maxPerGood?: Partial<Record<GoodId, number>>,
    globalMaxResource?: number,
  ): ProductionConfig {
    const config: ProductionConfig = {
      base,
    };

    if (townMultipliers) config.townMultipliers = townMultipliers;
    if (variance) config.variance = variance;
    if (maxPerGood) config.maxPerGood = maxPerGood;
    if (globalMaxResource !== undefined) config.globalMaxResource = globalMaxResource;

    return config;
  }

  describe('previewProduction matches applyProductionTurn', () => {
    it('should return same deltas and next values as actual production', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 5, wood: 3, ore: 1 },
        },
        {
          id: 'town2',
          name: 'Town 2',
          resources: { fish: 2, wood: 8, ore: 0 },
        },
      ]);

      const config = createTestProductionConfig(
        { fish: 2, wood: 1, ore: 3 },
        {
          town1: { fish: 1.5, wood: 2.0, ore: 1.0 },
          town2: { fish: 0.5, wood: 1.5, ore: 2.0 },
        },
      );

      const preview = previewProduction(state, config);
      const actualState = applyProductionTurn(state, config);

      // Verify preview deltas match actual deltas
      for (const town of state.towns) {
        for (const good of Object.keys(config.base) as GoodId[]) {
          const previewData = preview[town.id]?.[good];
          const actualTown = actualState.towns.find(t => t.id === town.id);
          if (!actualTown) continue;

          const actualDelta = (actualTown.resources[good] ?? 0) - (town.resources[good] ?? 0);
          const actualNext = actualTown.resources[good] ?? 0;

          expect(previewData).toBeDefined();
          expect(previewData!.delta).toBe(actualDelta);
          expect(previewData!.next).toBe(actualNext);
        }
      }
    });

    it('should handle variance correctly', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10, wood: 10, ore: 10 },
        },
      ]);

      const config = createTestProductionConfig({ fish: 5, wood: 5, ore: 5 }, undefined, {
        enabled: true,
        magnitude: 1,
      });

      const preview = previewProduction(state, config);
      const actualState = applyProductionTurn(state, config);

      // With variance enabled, deltas should match exactly
      for (const good of Object.keys(config.base) as GoodId[]) {
        const previewData = preview.town1?.[good];
        if (!previewData || !actualState.towns[0]) continue;

        const actualDelta =
          (actualState.towns[0]!.resources[good] ?? 0) - (state.towns[0]!.resources[good] ?? 0);
        const actualNext = actualState.towns[0]!.resources[good] ?? 0;

        expect(previewData.delta).toBe(actualDelta);
        expect(previewData.next).toBe(actualNext);
      }
    });

    it('should handle resource caps correctly', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 8, wood: 15, ore: 5 },
        },
      ]);

      const config = createTestProductionConfig(
        { fish: 3, wood: 2, ore: 4 },
        undefined,
        undefined,
        { fish: 10, wood: 20 },
        25, // global cap
      );

      const preview = previewProduction(state, config);
      const actualState = applyProductionTurn(state, config);

      // Fish: 8 + 3 = 11, but capped at 10 (per-good cap)
      expect(preview.town1?.fish?.next).toBe(10);
      expect(actualState.towns[0]?.resources.fish).toBe(10);

      // Wood: 15 + 2 = 17, no cap needed (17 < 20)
      expect(preview.town1?.wood?.next).toBe(17);
      expect(actualState.towns[0]?.resources.wood).toBe(17);

      // Ore: 5 + 4 = 9, no cap needed (9 < 25)
      expect(preview.town1?.ore?.next).toBe(9);
      expect(actualState.towns[0]?.resources.ore).toBe(9);
    });

    it('should actually apply caps when values exceed limits', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 8, wood: 18, ore: 22 },
        },
      ]);

      const config = createTestProductionConfig(
        { fish: 5, wood: 5, ore: 5 },
        undefined,
        undefined,
        { fish: 10, wood: 20 },
        25, // global cap
      );

      const preview = previewProduction(state, config);
      const actualState = applyProductionTurn(state, config);

      // Fish: 8 + 5 = 13, but capped at 10 (per-good cap)
      expect(preview.town1?.fish?.next).toBe(10);
      expect(actualState.towns[0]?.resources.fish).toBe(10);

      // Wood: 18 + 5 = 23, but capped at 20 (per-good cap)
      expect(preview.town1?.wood?.next).toBe(20);
      expect(actualState.towns[0]?.resources.wood).toBe(20);

      // Ore: 22 + 5 = 27, but capped at 25 (global cap)
      expect(preview.town1?.ore?.next).toBe(25);
      expect(actualState.towns[0]?.resources.ore).toBe(25);
    });

    it('should handle clampMin correctly', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 1, wood: 0, ore: 2 },
        },
      ]);

      const config = createTestProductionConfig({ fish: -2, wood: -1, ore: 0 });

      const preview = previewProduction(state, config, { clampMin: 0 });
      const actualState = applyProductionTurn(state, config, { clampMin: 0 });

      // Fish: 1 + (-2) = -1, clamped to 0
      expect(preview.town1?.fish?.next).toBe(0);
      expect(actualState.towns[0]?.resources.fish).toBe(0);

      // Wood: 0 + (-1) = -1, clamped to 0
      expect(preview.town1?.wood?.next).toBe(0);
      expect(actualState.towns[0]?.resources.wood).toBe(0);

      // Ore: 2 + 0 = 2, no clamping needed
      expect(preview.town1?.ore?.next).toBe(2);
      expect(actualState.towns[0]?.resources.ore).toBe(2);
    });

    it('should handle missing goods gracefully', () => {
      const state = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 5 }, // Missing wood and ore
        },
      ]);

      const config = createTestProductionConfig({ fish: 2, wood: 1, ore: 3 });

      const preview = previewProduction(state, config);

      // Fish should work normally
      expect(preview.town1?.fish?.delta).toBe(2);
      expect(preview.town1?.fish?.next).toBe(7);

      // Missing goods should default to 0
      expect(preview.town1?.wood?.delta).toBe(1);
      expect(preview.town1?.wood?.next).toBe(1);

      expect(preview.town1?.ore?.delta).toBe(3);
      expect(preview.town1?.ore?.next).toBe(3);
    });

    it('should not mutate the original state', () => {
      const originalState = createTestGameState([
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 5, wood: 3, ore: 1 },
        },
      ]);

      const config = createTestProductionConfig({ fish: 2, wood: 1, ore: 3 });

      const stateCopy = JSON.parse(JSON.stringify(originalState));
      const preview = previewProduction(stateCopy, config);

      // Verify the preview was calculated
      expect(preview.town1?.fish?.delta).toBe(2);
      expect(preview.town1?.fish?.next).toBe(7);

      // Verify the original state is unchanged
      expect(originalState.towns[0]?.resources.fish).toBe(5);
      expect(originalState.towns[0]?.resources.wood).toBe(3);
      expect(originalState.towns[0]?.resources.ore).toBe(1);
    });
  });
});
