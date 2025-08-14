import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';

import { executeTrade } from './TradeExecutor';
import type { ValidatedTrade } from './TradeValidator';

describe('TradeExecutor', () => {
  // Test data setup
  const mockGoods = {
    fish: {
      id: 'fish' as GoodId,
      name: 'Fish',
      effects: {
        prosperityDelta: 2,
        militaryDelta: 1,
      },
    },
    wood: {
      id: 'wood' as GoodId,
      name: 'Wood',
      effects: {
        prosperityDelta: 1,
        militaryDelta: 3,
      },
    },
    ore: {
      id: 'ore' as GoodId,
      name: 'Ore',
      effects: {
        prosperityDelta: -1,
        militaryDelta: 5,
      },
    },
  };

  const mockState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town1',
        name: 'Port Town',
        resources: { fish: 100, wood: 50, ore: 25 },
        treasury: 1000,
        prices: { fish: 10, wood: 20, ore: 50 },
        prosperityRaw: 50,
        militaryRaw: 30,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Mining Town',
        resources: { fish: 25, wood: 100, ore: 75 },
        treasury: 800,
        prices: { fish: 12, wood: 18, ore: 45 },
        prosperityRaw: 40,
        militaryRaw: 45,
        revealed: {
          militaryTier: 'garrison',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
    ],
    goods: mockGoods,
  };

  describe('executeTrade - Sell Path', () => {
    it('should execute a sell trade correctly', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 20,
        unitPrice: 12,
        side: 'sell',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // Verify state is updated
      expect(result.state.towns[0]!.resources.fish).toBe(80); // 100 - 20
      expect(result.state.towns[1]!.resources.fish).toBe(45); // 25 + 20
      expect(result.state.towns[0]!.treasury).toBe(1240); // 1000 + (20 * 12)
      expect(result.state.towns[1]!.treasury).toBe(560); // 800 - (20 * 12)

      // Verify effects applied
      expect(result.state.towns[0]!.prosperityRaw).toBe(52); // 50 + 2
      expect(result.state.towns[1]!.prosperityRaw).toBe(42); // 40 + 2
      expect(result.state.towns[0]!.militaryRaw).toBe(30); // No change (seller)
      expect(result.state.towns[1]!.militaryRaw).toBe(46); // 45 + 1 (buyer)

      // Verify deltas
      expect(result.deltas.from.resources!.fish).toBe(80);
      expect(result.deltas.to.resources!.fish).toBe(45);
      expect(result.deltas.from.treasury).toBe(1240);
      expect(result.deltas.to.treasury).toBe(560);
      expect(result.deltas.from.prosperityRaw).toBe(52);
      expect(result.deltas.to.prosperityRaw).toBe(42);
      expect(result.deltas.from.militaryRaw).toBe(30);
      expect(result.deltas.to.militaryRaw).toBe(46);

      // Verify unit price
      expect(result.unitPriceApplied).toBe(12);
    });

    it('should handle sell trade with negative prosperity effect', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'ore',
        qty: 10,
        unitPrice: 45,
        side: 'sell',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // Verify negative prosperity effect
      expect(result.state.towns[0]!.prosperityRaw).toBe(49); // 50 + (-1)
      expect(result.state.towns[1]!.prosperityRaw).toBe(39); // 40 + (-1)
      expect(result.state.towns[1]!.militaryRaw).toBe(50); // 45 + 5 (buyer gets military)
    });
  });

  describe('executeTrade - Buy Path', () => {
    it('should execute a buy trade correctly', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'wood',
        qty: 15,
        unitPrice: 18,
        side: 'buy',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // Verify state is updated
      expect(result.state.towns[0]!.resources.wood).toBe(65); // 50 + 15
      expect(result.state.towns[1]!.resources.wood).toBe(85); // 100 - 15
      expect(result.state.towns[0]!.treasury).toBe(730); // 1000 - (15 * 18)
      expect(result.state.towns[1]!.treasury).toBe(1070); // 800 + (15 * 18)

      // Verify effects applied
      expect(result.state.towns[0]!.prosperityRaw).toBe(51); // 50 + 1
      expect(result.state.towns[1]!.prosperityRaw).toBe(41); // 40 + 1
      expect(result.state.towns[0]!.militaryRaw).toBe(33); // 30 + 3 (buyer gets military)
      expect(result.state.towns[1]!.militaryRaw).toBe(45); // No change (seller)

      // Verify deltas
      expect(result.deltas.from.resources!.wood).toBe(65);
      expect(result.deltas.to.resources!.wood).toBe(85);
      expect(result.deltas.from.treasury).toBe(730);
      expect(result.deltas.to.treasury).toBe(1070);
      expect(result.deltas.from.prosperityRaw).toBe(51);
      expect(result.deltas.to.prosperityRaw).toBe(41);
      expect(result.deltas.from.militaryRaw).toBe(33);
      expect(result.deltas.to.militaryRaw).toBe(45);

      // Verify unit price
      expect(result.unitPriceApplied).toBe(18);
    });
  });

  describe('Immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = JSON.parse(JSON.stringify(mockState));
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 10,
        unitPrice: 10,
        side: 'sell',
      };

      executeTrade(mockState, validatedTrade, mockGoods);

      // Original state should remain unchanged
      expect(mockState.towns[0]!.resources.fish).toBe(100);
      expect(mockState.towns[0]!.treasury).toBe(1000);
      expect(mockState.towns[0]!.prosperityRaw).toBe(50);
      expect(mockState.towns[0]!.militaryRaw).toBe(30);
      expect(mockState.towns[1]!.resources.fish).toBe(25);
      expect(mockState.towns[1]!.treasury).toBe(800);
      expect(mockState.towns[1]!.prosperityRaw).toBe(40);
      expect(mockState.towns[1]!.militaryRaw).toBe(45);

      // Verify deep equality with original
      expect(JSON.stringify(mockState)).toBe(JSON.stringify(originalState));
    });

    it('should return a new state object', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 5,
        unitPrice: 10,
        side: 'sell',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // Result state should be a different object
      expect(result.state).not.toBe(mockState);
      expect(result.state.towns).not.toBe(mockState.towns);
      expect(result.state.towns[0]!).not.toBe(mockState.towns[0]);
      expect(result.state.towns[1]!).not.toBe(mockState.towns[1]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity trade', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 0,
        unitPrice: 10,
        side: 'sell',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // No changes should occur
      expect(result.state.towns[0]!.resources.fish).toBe(100);
      expect(result.state.towns[0]!.treasury).toBe(1000);
      expect(result.state.towns[1]!.resources.fish).toBe(25);
      expect(result.state.towns[1]!.treasury).toBe(800);
      expect(result.state.towns[0]!.prosperityRaw).toBe(52); // Still get prosperity effect
      expect(result.state.towns[1]!.prosperityRaw).toBe(42); // Still get prosperity effect
    });

    it('should handle zero price trade', () => {
      const validatedTrade: ValidatedTrade = {
        from: mockState.towns[0]!,
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 10,
        unitPrice: 0,
        side: 'sell',
      };

      const result = executeTrade(mockState, validatedTrade, mockGoods);

      // Goods should move but no treasury change
      expect(result.state.towns[0]!.resources.fish).toBe(90);
      expect(result.state.towns[1]!.resources.fish).toBe(35);
      expect(result.state.towns[0]!.treasury).toBe(1000); // No change
      expect(result.state.towns[1]!.treasury).toBe(800); // No change
    });
  });

  describe('Error Handling', () => {
    it('should throw error if town not found in state', () => {
      const invalidTrade: ValidatedTrade = {
        from: { ...mockState.towns[0]!, id: 'nonexistent' },
        to: mockState.towns[1]!,
        goodId: 'fish',
        qty: 10,
        unitPrice: 10,
        side: 'sell',
      };

      expect(() => executeTrade(mockState, invalidTrade, mockGoods)).toThrow(
        'Town not found in state during trade execution',
      );
    });
  });
});
