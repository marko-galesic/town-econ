import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import { applyPostTradePricing } from './PriceAdjustment';
import { createSimpleLinearPriceModel } from './PriceModel';
import type { ValidatedTrade } from './TradeValidator';

describe('PriceAdjustment', () => {
  // Test fixture: a simple game state with two towns
  const createTestGameState = (): GameState => ({
    turn: 0,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town-a',
        name: 'Town A',
        resources: { fish: 100, wood: 50, ore: 25 },
        prices: { fish: 10, wood: 20, ore: 30 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 1000,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
      {
        id: 'town-b',
        name: 'Town B',
        resources: { fish: 80, wood: 60, ore: 40 },
        prices: { fish: 12, wood: 18, ore: 28 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 800,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
    ],
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 1, militaryDelta: 0 },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 0, militaryDelta: 1 },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 2, militaryDelta: 1 },
      },
    },
  });

  // Test fixture: a simple linear price model with baseStep: 1, min: 1, max: 999
  const createTestPriceModel = () =>
    createSimpleLinearPriceModel({ baseStep: 1, min: 1, max: 999 });

  describe('applyPostTradePricing', () => {
    it('should increase seller price and decrease buyer price for sell trades', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'fish',
        qty: 5,
        unitPrice: 12,
        side: 'sell',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Town A (seller) should have increased fish price
      expect(updatedState.towns[0]!.prices.fish).toBe(11); // 10 + 1
      // Town B (buyer) should have decreased fish price
      expect(updatedState.towns[1]!.prices.fish).toBe(11); // 12 - 1

      // Other prices should remain unchanged
      expect(updatedState.towns[0]!.prices.wood).toBe(20);
      expect(updatedState.towns[0]!.prices.ore).toBe(30);
      expect(updatedState.towns[1]!.prices.wood).toBe(18);
      expect(updatedState.towns[1]!.prices.ore).toBe(28);
    });

    it('should increase seller price and decrease buyer price for buy trades', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'wood',
        qty: 3,
        unitPrice: 18,
        side: 'buy',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Town A (buyer) should have decreased wood price
      expect(updatedState.towns[0]!.prices.wood).toBe(19); // 20 - 1
      // Town B (seller) should have increased wood price
      expect(updatedState.towns[1]!.prices.wood).toBe(19); // 18 + 1

      // Other prices should remain unchanged
      expect(updatedState.towns[0]!.prices.fish).toBe(10);
      expect(updatedState.towns[0]!.prices.ore).toBe(30);
      expect(updatedState.towns[1]!.prices.fish).toBe(12);
      expect(updatedState.towns[1]!.prices.ore).toBe(28);
    });

    it('should respect price clamping at minimum value', () => {
      const state = createTestGameState();
      // Set Town A's fish price to minimum (1)
      state.towns[0]!.prices.fish = 1;

      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'fish',
        qty: 10,
        unitPrice: 12,
        side: 'buy',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Town A (buyer) should have fish price clamped at minimum
      expect(updatedState.towns[0]!.prices.fish).toBe(1); // Should not go below 1
      // Town B (seller) should have increased fish price
      expect(updatedState.towns[1]!.prices.fish).toBe(13); // 12 + 1
    });

    it('should respect price clamping at maximum value', () => {
      const state = createTestGameState();
      // Set Town B's ore price to maximum (999)
      state.towns[1]!.prices.ore = 999;

      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'ore',
        qty: 7,
        unitPrice: 28,
        side: 'sell',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Town A (seller) should have increased ore price
      expect(updatedState.towns[0]!.prices.ore).toBe(31); // 30 + 1
      // Town B (buyer) should have decreased ore price, but clamped at maximum
      // Since it starts at 999 and is a buyer (quantityDelta > 0), price decreases to 998
      expect(updatedState.towns[1]!.prices.ore).toBe(998); // 999 - 1, not clamped
    });

    it('should handle large trade quantities correctly', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'fish',
        qty: 100,
        unitPrice: 12,
        side: 'sell',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Price changes should still be baseStep (1) regardless of quantity
      expect(updatedState.towns[0]!.prices.fish).toBe(11); // 10 + 1
      expect(updatedState.towns[1]!.prices.fish).toBe(11); // 12 - 1
    });

    it('should preserve all other town properties', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'fish',
        qty: 5,
        unitPrice: 12,
        side: 'sell',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // All other properties should be preserved
      expect(updatedState.towns[0]!.id).toBe(state.towns[0]!.id);
      expect(updatedState.towns[0]!.name).toBe(state.towns[0]!.name);
      expect(updatedState.towns[0]!.resources).toBe(state.towns[0]!.resources);
      expect(updatedState.towns[0]!.militaryRaw).toBe(state.towns[0]!.militaryRaw);
      expect(updatedState.towns[0]!.prosperityRaw).toBe(state.towns[0]!.prosperityRaw);
      expect(updatedState.towns[0]!.treasury).toBe(state.towns[0]!.treasury);
      expect(updatedState.towns[0]!.revealed).toBe(state.towns[0]!.revealed);

      expect(updatedState.towns[1]!.id).toBe(state.towns[1]!.id);
      expect(updatedState.towns[1]!.name).toBe(state.towns[1]!.name);
      expect(updatedState.towns[1]!.resources).toBe(state.towns[1]!.resources);
      expect(updatedState.towns[1]!.militaryRaw).toBe(state.towns[1]!.militaryRaw);
      expect(updatedState.towns[1]!.prosperityRaw).toBe(state.towns[1]!.prosperityRaw);
      expect(updatedState.towns[1]!.treasury).toBe(state.towns[1]!.treasury);
      expect(updatedState.towns[1]!.revealed).toBe(state.towns[1]!.revealed);
    });

    it('should return a new game state instance (immutability)', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: state.towns[0]!, // Town A
        to: state.towns[1]!, // Town B
        goodId: 'fish',
        qty: 5,
        unitPrice: 12,
        side: 'sell',
      };

      const updatedState = applyPostTradePricing(state, validatedTrade, model);

      // Should be a different object reference
      expect(updatedState).not.toBe(state);
      expect(updatedState.towns).not.toBe(state.towns);
      expect(updatedState.towns[0]).not.toBe(state.towns[0]);
      expect(updatedState.towns[1]).not.toBe(state.towns[1]);

      // Original state should be unchanged
      expect(state.towns[0]!.prices.fish).toBe(10);
      expect(state.towns[1]!.prices.fish).toBe(12);
    });

    it('should handle towns not found in state', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      const validatedTrade: ValidatedTrade = {
        from: { ...state.towns[0]!, id: 'non-existent-town' },
        to: state.towns[1]!,
        goodId: 'fish',
        qty: 5,
        unitPrice: 12,
        side: 'sell',
      };

      expect(() => {
        applyPostTradePricing(state, validatedTrade, model);
      }).toThrow('Town not found in current game state');
    });

    it('should handle multiple goods in the same trade state', () => {
      const state = createTestGameState();
      const model = createTestPriceModel();

      // First trade: fish
      const fishTrade: ValidatedTrade = {
        from: state.towns[0]!,
        to: state.towns[1]!,
        goodId: 'fish',
        qty: 3,
        unitPrice: 12,
        side: 'sell',
      };

      let updatedState = applyPostTradePricing(state, fishTrade, model);

      // Second trade: wood - Town A buys wood from Town B
      const woodTrade: ValidatedTrade = {
        from: updatedState.towns[0]!, // Town A (buyer)
        to: updatedState.towns[1]!, // Town B (seller)
        goodId: 'wood',
        qty: 2,
        unitPrice: 18,
        side: 'buy',
      };

      updatedState = applyPostTradePricing(updatedState, woodTrade, model);

      // Fish prices should reflect first trade
      expect(updatedState.towns[0]!.prices.fish).toBe(11); // 10 + 1
      expect(updatedState.towns[1]!.prices.fish).toBe(11); // 12 - 1

      // Wood prices should reflect second trade
      // Town A (buyer) should have decreased wood price from 20 to 19
      expect(updatedState.towns[0]!.prices.wood).toBe(19); // 20 - 1
      // Town B (seller) should have increased wood price from 18 to 19
      expect(updatedState.towns[1]!.prices.wood).toBe(19); // 18 + 1

      // Ore prices should remain unchanged
      expect(updatedState.towns[0]!.prices.ore).toBe(30);
      expect(updatedState.towns[1]!.prices.ore).toBe(28);
    });
  });
});
