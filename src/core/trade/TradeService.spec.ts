import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import { loadPriceCurves } from '../pricing/Config';
import { createLogRatioPriceMath } from '../pricing/Curves';

import { TradeValidationError } from './TradeErrors';
import { performTrade } from './TradeService';
import type { TradeRequest } from './TradeTypes';

describe('TradeService', () => {
  let state: GameState;
  let goods: Record<GoodId, GoodConfig>;
  let priceTables: ReturnType<typeof loadPriceCurves>;
  let priceMath: ReturnType<typeof createLogRatioPriceMath>;

  beforeEach(() => {
    // Set up a simple game state with two towns
    state = {
      turn: 0,
      version: 1,
      rngSeed: 'test-seed-123',
      towns: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: {
            wood: 100,
            fish: 50,
            ore: 30,
          },
          prices: {
            wood: 10,
            fish: 5,
            ore: 8,
          },
          treasury: 1000,
          prosperityRaw: 50,
          militaryRaw: 20,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'struggling',
            lastUpdatedTurn: 0,
          },
        },
        {
          id: 'town2',
          name: 'Town 2',
          resources: {
            wood: 80,
            fish: 60,
            ore: 25,
          },
          prices: {
            wood: 12,
            fish: 6,
            ore: 9,
          },
          treasury: 800,
          prosperityRaw: 40,
          militaryRaw: 15,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'struggling',
            lastUpdatedTurn: 0,
          },
        },
      ],
      goods: {
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: {
            prosperityDelta: 2,
            militaryDelta: 1,
          },
        },
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: {
            prosperityDelta: 1,
            militaryDelta: 0,
          },
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: {
            prosperityDelta: 3,
            militaryDelta: 2,
          },
        },
      },
    };

    // Set up goods configuration
    goods = state.goods;

    // Set up price curves and math
    priceTables = loadPriceCurves();
    priceMath = createLogRatioPriceMath();
  });

  describe('performTrade', () => {
    describe('happy path scenarios', () => {
      it('should successfully execute a buy transaction with all steps', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12, // Must match toTown's price
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        // Verify final state changes
        expect(result.state.towns).toHaveLength(2);

        // Town 1 (buyer) should have more wood, less money
        const town1 = result.state.towns.find(t => t.id === 'town1')!;
        expect(town1.resources.wood).toBe(110); // 100 + 10
        expect(town1.treasury).toBe(880); // 1000 - (10 * 12)
        expect(town1.prosperityRaw).toBe(52); // 50 + 2
        expect(town1.militaryRaw).toBe(21); // 20 + 1

        // Town 2 (seller) should have less wood, more money
        const town2 = result.state.towns.find(t => t.id === 'town2')!;
        expect(town2.resources.wood).toBe(70); // 80 - 10
        expect(town2.treasury).toBe(920); // 800 + (10 * 12)
        expect(town2.prosperityRaw).toBe(42); // 40 + 2
        expect(town2.militaryRaw).toBe(15); // No change (seller doesn't get military boost)

        // Verify deltas
        expect(result.deltas.from.resources?.wood).toBe(110);
        expect(result.deltas.from.treasury).toBe(880);
        expect(result.deltas.from.prosperityRaw).toBe(52);
        expect(result.deltas.from.militaryRaw).toBe(21);

        expect(result.deltas.to.resources?.wood).toBe(70);
        expect(result.deltas.to.treasury).toBe(920);
        expect(result.deltas.to.prosperityRaw).toBe(42);
        expect(result.deltas.to.militaryRaw).toBe(15);

        expect(result.unitPriceApplied).toBe(12);
      });

      it('should successfully execute a sell transaction with all steps', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'fish',
          quantity: 20,
          side: 'sell',
          pricePerUnit: 6, // Must match toTown's price
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        // Verify final state changes
        expect(result.state.towns).toHaveLength(2);

        // Town 1 (seller) should have less fish, more money
        const town1 = result.state.towns.find(t => t.id === 'town1')!;
        expect(town1.resources.fish).toBe(30); // 50 - 20
        expect(town1.treasury).toBe(1120); // 1000 + (20 * 6)
        expect(town1.prosperityRaw).toBe(51); // 50 + 1
        expect(town1.militaryRaw).toBe(20); // No change (seller doesn't get military boost)

        // Town 2 (buyer) should have more fish, less money
        const town2 = result.state.towns.find(t => t.id === 'town2')!;
        expect(town2.resources.fish).toBe(80); // 60 + 20
        expect(town2.treasury).toBe(680); // 800 - (20 * 6)
        expect(town2.prosperityRaw).toBe(41); // 40 + 1
        expect(town2.militaryRaw).toBe(15); // No change (fish has no military effect)

        // Verify deltas
        expect(result.deltas.from.resources?.fish).toBe(30);
        expect(result.deltas.from.treasury).toBe(1120);
        expect(result.deltas.from.prosperityRaw).toBe(51);
        expect(result.deltas.from.militaryRaw).toBe(20);

        expect(result.deltas.to.resources?.fish).toBe(80);
        expect(result.deltas.to.treasury).toBe(680);
        expect(result.deltas.to.prosperityRaw).toBe(41);
        expect(result.deltas.to.militaryRaw).toBe(15);

        expect(result.unitPriceApplied).toBe(6);
      });
    });

    describe('price adjustments', () => {
      it('should apply price adjustments after trade execution', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        // Verify price adjustments occurred
        const town1 = result.state.towns.find(t => t.id === 'town1')!;
        const town2 = result.state.towns.find(t => t.id === 'town2')!;

        // Town 1 bought wood (inventory increased), so price should decrease
        expect(town1.prices.wood).toBeLessThan(10); // Price should decrease due to increased stock

        // Town 2 sold wood (inventory decreased), but still above target stock (30), so price should decrease
        expect(town2.prices.wood).toBeLessThan(12); // Price should decrease due to still having excess supply

        // Fish prices should remain unchanged
        expect(town1.prices.fish).toBe(5);
        expect(town2.prices.fish).toBe(6);
      });

      it('should respect price curve constraints', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        const town1 = result.state.towns.find(t => t.id === 'town1')!;
        const town2 = result.state.towns.find(t => t.id === 'town2')!;

        // Prices should be within the configured bounds from price curves
        expect(town1.prices.wood).toBeGreaterThanOrEqual(1); // minPrice from config
        expect(town1.prices.wood).toBeLessThanOrEqual(9999); // maxPrice from config
        expect(town2.prices.wood).toBeGreaterThanOrEqual(1); // minPrice from config
        expect(town2.prices.wood).toBeLessThanOrEqual(9999); // maxPrice from config
      });
    });

    describe('error handling', () => {
      it('should propagate TradeValidationError from validation step', async () => {
        const invalidRequest: TradeRequest = {
          fromTownId: 'nonexistent',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        await expect(
          performTrade(state, invalidRequest, priceTables, priceMath, goods),
        ).rejects.toThrow(TradeValidationError);
      });

      it('should propagate TradeValidationError for insufficient resources', async () => {
        const invalidRequest: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 200, // More than town1 has
          side: 'sell',
          pricePerUnit: 6,
        };

        await expect(
          performTrade(state, invalidRequest, priceTables, priceMath, goods),
        ).rejects.toThrow(TradeValidationError);
      });

      it('should propagate TradeValidationError for insufficient treasury', async () => {
        const invalidRequest: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 100,
          side: 'buy',
          pricePerUnit: 12, // Total cost: 1200, but town1 only has 1000
        };

        await expect(
          performTrade(state, invalidRequest, priceTables, priceMath, goods),
        ).rejects.toThrow(TradeValidationError);
      });

      it('should propagate TradeValidationError for price mismatch', async () => {
        const invalidRequest: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 10, // Doesn't match town2's price of 12
        };

        await expect(
          performTrade(state, invalidRequest, priceTables, priceMath, goods),
        ).rejects.toThrow(TradeValidationError);
      });
    });

    describe('immutability', () => {
      it('should not modify the original state', async () => {
        const originalState = JSON.parse(JSON.stringify(state));
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        await performTrade(state, request, priceTables, priceMath, goods);

        // Original state should remain unchanged
        expect(state).toEqual(originalState);
      });

      it('should return a new state instance', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        // Result state should be a different object
        expect(result.state).not.toBe(state);
        expect(result.state.towns).not.toBe(state.towns);

        // But should have the expected changes
        expect(result.state.towns).toHaveLength(2);
        expect(result.state.towns[0]?.resources.wood).toBe(110);
      });
    });

    describe('consistency', () => {
      it('should maintain consistent deltas and final state', async () => {
        const request: TradeRequest = {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 10,
          side: 'buy',
          pricePerUnit: 12,
        };

        const result = await performTrade(state, request, priceTables, priceMath, goods);

        // Deltas should match the final state
        const town1 = result.state.towns.find(t => t.id === 'town1')!;
        const town2 = result.state.towns.find(t => t.id === 'town2')!;

        expect(result.deltas.from.resources?.wood).toBe(town1.resources.wood);
        expect(result.deltas.from.treasury).toBe(town1.treasury);
        expect(result.deltas.from.prosperityRaw).toBe(town1.prosperityRaw);
        expect(result.deltas.from.militaryRaw).toBe(town1.militaryRaw);

        expect(result.deltas.to.resources?.wood).toBe(town2.resources.wood);
        expect(result.deltas.to.treasury).toBe(town2.treasury);
        expect(result.deltas.to.prosperityRaw).toBe(town2.prosperityRaw);
        expect(result.deltas.to.militaryRaw).toBe(town2.militaryRaw);
      });
    });
  });
});
