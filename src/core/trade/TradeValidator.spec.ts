import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import { TradeValidationError } from './TradeErrors';
import type { TradeRequest, TradeSide } from './TradeTypes';
import { validateTrade } from './TradeValidator';

describe('TradeValidator', () => {
  // Test data setup
  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town1',
        name: 'Portsmouth',
        resources: { fish: 100, wood: 50, ore: 25 },
        prices: { fish: 10, wood: 20, ore: 30 },
        treasury: 1000,
        militaryRaw: 50,
        prosperityRaw: 75,
        revealed: {
          militaryTier: 'formidable',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Ironforge',
        resources: { fish: 25, wood: 100, ore: 200 },
        prices: { fish: 12, wood: 18, ore: 25 },
        treasury: 2000,
        militaryRaw: 100,
        prosperityRaw: 50,
        revealed: {
          militaryTier: 'host',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
    ],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 2, militaryDelta: 2 } },
    },
  };

  describe('Happy paths', () => {
    it('should validate a valid sell trade', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 50,
        side: 'sell',
        pricePerUnit: 12, // town2's price for fish
      };

      const result = validateTrade(mockGameState, request);

      expect(result).toEqual({
        from: mockGameState.towns[0],
        to: mockGameState.towns[1],
        goodId: 'fish',
        qty: 50,
        unitPrice: 12,
        side: 'sell',
      });
    });

    it('should validate a valid buy trade', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 10,
        side: 'buy',
        pricePerUnit: 25, // town2's price for ore
      };

      const result = validateTrade(mockGameState, request);

      expect(result).toEqual({
        from: mockGameState.towns[0],
        to: mockGameState.towns[1],
        goodId: 'ore',
        qty: 10,
        unitPrice: 25,
        side: 'buy',
      });
    });

    it('should validate trade with maximum available quantity', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 100, // town1's exact fish stock
        side: 'sell',
        pricePerUnit: 12,
      };

      const result = validateTrade(mockGameState, request);
      expect(result.qty).toBe(100);
    });

    it('should validate trade with maximum affordable price', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 1,
        side: 'buy',
        pricePerUnit: 25,
      };

      const result = validateTrade(mockGameState, request);
      expect(result.unitPrice).toBe(25);
    });
  });

  describe('Town ID validation errors', () => {
    it('should throw error for non-existent fromTownId', () => {
      const request: TradeRequest = {
        fromTownId: 'nonexistent',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Town with ID 'nonexistent' not found",
      );
    });

    it('should throw error for non-existent toTownId', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'nonexistent',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Town with ID 'nonexistent' not found",
      );
    });

    it('should include correct path in error for fromTownId', () => {
      const request: TradeRequest = {
        fromTownId: 'nonexistent',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 12,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('fromTownId');
      }
    });

    it('should include correct path in error for toTownId', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'nonexistent',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 12,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('toTownId');
      }
    });
  });

  describe('Good ID validation errors', () => {
    it('should throw error when good not available in fromTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 25,
      };

      // Mock state where town1 has insufficient ore
      const modifiedState: GameState = {
        ...mockGameState,
        towns: [
          { ...mockGameState.towns[0]!, resources: { fish: 100, wood: 50, ore: 5 } },
          mockGameState.towns[1]!,
        ],
      };

      expect(() => validateTrade(modifiedState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(modifiedState, request)).toThrow(
        "Insufficient stock: town 'Portsmouth' has 5 ore, but 10 requested",
      );
    });

    it('should throw error when good not available in toTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'buy',
        pricePerUnit: 12,
      };

      // Mock state where town2 has insufficient fish
      const modifiedState: GameState = {
        ...mockGameState,
        towns: [
          mockGameState.towns[0]!,
          { ...mockGameState.towns[1]!, resources: { fish: 5, wood: 100, ore: 200 } },
        ],
      };

      expect(() => validateTrade(modifiedState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(modifiedState, request)).toThrow(
        "Insufficient stock: town 'Ironforge' has 5 fish, but 10 requested",
      );
    });

    it('should include correct path for fromTown good availability', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 25,
      };

      const modifiedState: GameState = {
        ...mockGameState,
        towns: [
          { ...mockGameState.towns[0]!, resources: { fish: 100, wood: 50, ore: 5 } },
          mockGameState.towns[1]!,
        ],
      };

      try {
        validateTrade(modifiedState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[0].resources.ore');
      }
    });

    it('should include correct path for toTown good availability', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'buy',
        pricePerUnit: 12,
      };

      const modifiedState: GameState = {
        ...mockGameState,
        towns: [
          mockGameState.towns[0]!,
          { ...mockGameState.towns[1]!, resources: { fish: 5, wood: 100, ore: 200 } },
        ],
      };

      try {
        validateTrade(modifiedState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[1].resources.fish');
      }
    });
  });

  describe('Quantity validation errors', () => {
    it('should throw error for zero quantity', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 0,
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        'Quantity must be a positive integer, got 0',
      );
    });

    it('should throw error for negative quantity', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: -5,
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        'Quantity must be a positive integer, got -5',
      );
    });

    it('should throw error for non-integer quantity', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 5.5,
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        'Quantity must be a positive integer, got 5.5',
      );
    });

    it('should include correct path for quantity errors', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 0,
        side: 'sell',
        pricePerUnit: 12,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('quantity');
      }
    });
  });

  describe('Price validation errors', () => {
    it('should throw error for negative price', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: -5,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        'Price per unit must be nonnegative, got -5',
      );
    });

    it('should include correct path for price errors', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: -5,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('pricePerUnit');
      }
    });
  });

  describe('Insufficient stock errors', () => {
    it('should throw error for sell trade with insufficient stock', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 150, // town1 only has 100 fish
        side: 'sell',
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Insufficient stock: town 'Portsmouth' has 100 fish, but 150 requested",
      );
    });

    it('should throw error for buy trade with insufficient stock in toTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 250, // town2 only has 200 ore
        side: 'buy',
        pricePerUnit: 25,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Insufficient stock: town 'Ironforge' has 200 ore, but 250 requested",
      );
    });

    it('should include correct path for insufficient stock in fromTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 150,
        side: 'sell',
        pricePerUnit: 12,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[0].resources.fish');
      }
    });

    it('should include correct path for insufficient stock in toTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 250,
        side: 'buy',
        pricePerUnit: 25,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[1].resources.ore');
      }
    });
  });

  describe('Insufficient treasury errors', () => {
    it('should throw error for sell trade with insufficient treasury in toTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 100, // 100 * 12 = 1200, town1 has 100 fish, but town2 only has 2000 treasury
        side: 'sell',
        pricePerUnit: 25, // Use a higher price to exceed town2's treasury
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Insufficient treasury: town 'Ironforge' has 2000 currency, but 2500 needed",
      );
    });

    it('should throw error for buy trade with insufficient treasury in fromTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 50, // 50 * 25 = 1250, but town1 only has 1000
        side: 'buy',
        pricePerUnit: 25,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Insufficient treasury: town 'Portsmouth' has 1000 currency, but 1250 needed",
      );
    });

    it('should include correct path for insufficient treasury in toTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 100,
        side: 'sell',
        pricePerUnit: 25,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[1].treasury');
      }
    });

    it('should include correct path for insufficient treasury in fromTown', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 50,
        side: 'buy',
        pricePerUnit: 25,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('towns[0].treasury');
      }
    });
  });

  describe('Price sanity check errors', () => {
    it('should throw error for sell trade with mismatched price', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 15, // town2 quotes 12 for fish
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Price mismatch: requested 15 but town 'Ironforge' quotes 12 for fish",
      );
    });

    it('should throw error for buy trade with mismatched price', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 10,
        side: 'buy',
        pricePerUnit: 30, // town2 quotes 25 for ore
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Price mismatch: requested 30 but town 'Ironforge' quotes 25 for ore",
      );
    });

    it('should include correct path for price sanity errors', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 15,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('pricePerUnit');
      }
    });
  });

  describe('Invalid trade side errors', () => {
    it('should throw error for invalid trade side', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'invalid' as TradeSide,
        pricePerUnit: 12,
      };

      expect(() => validateTrade(mockGameState, request)).toThrow(TradeValidationError);
      expect(() => validateTrade(mockGameState, request)).toThrow(
        "Invalid trade side: invalid. Must be 'buy' or 'sell'",
      );
    });

    it('should include correct path for invalid side errors', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'invalid' as TradeSide,
        pricePerUnit: 12,
      };

      try {
        validateTrade(mockGameState, request);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TradeValidationError);
        expect((error as TradeValidationError).path).toBe('side');
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle exact treasury match', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'ore',
        quantity: 40, // 40 * 25 = 1000, exactly town1's treasury
        side: 'buy',
        pricePerUnit: 25,
      };

      const result = validateTrade(mockGameState, request);
      expect(result.qty).toBe(40);
      expect(result.unitPrice).toBe(25);
    });

    it('should handle exact stock match', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 100, // exactly town1's fish stock
        side: 'sell',
        pricePerUnit: 12,
      };

      const result = validateTrade(mockGameState, request);
      expect(result.qty).toBe(100);
      expect(result.unitPrice).toBe(12);
    });

    it('should handle zero price (free trade)', () => {
      const request: TradeRequest = {
        fromTownId: 'town1',
        toTownId: 'town2',
        goodId: 'fish',
        quantity: 10,
        side: 'sell',
        pricePerUnit: 0,
      };

      // Mock state where town2 quotes 0 for fish
      const modifiedState: GameState = {
        ...mockGameState,
        towns: [
          mockGameState.towns[0]!,
          { ...mockGameState.towns[1]!, prices: { fish: 0, wood: 18, ore: 25 } },
        ],
      };

      const result = validateTrade(modifiedState, request);
      expect(result.unitPrice).toBe(0);
    });
  });
});
