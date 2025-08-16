import { describe, it, expect } from 'vitest';

import type { Town } from '../../types/Town';

import { readTownPriceState, writeTownPrice } from './TownPriceIO';

describe('TownPriceIO', () => {
  const mockTown: Town = {
    id: 'test-town',
    name: 'Test Town',
    resources: {
      fish: 100,
      wood: 50,
      ore: 25,
    },
    prices: {
      fish: 10,
      wood: 15,
      ore: 20,
    },
    militaryRaw: 5,
    prosperityRaw: 8,
    treasury: 1000,
    revealed: {
      militaryTier: 'militia',
      prosperityTier: 'prosperous',
      lastUpdatedTurn: 1,
    },
  };

  describe('readTownPriceState', () => {
    it('returns exact stock and price for the specified good', () => {
      const fishState = readTownPriceState(mockTown, 'fish');
      expect(fishState.stock).toBe(100);
      expect(fishState.price).toBe(10);

      const woodState = readTownPriceState(mockTown, 'wood');
      expect(woodState.stock).toBe(50);
      expect(woodState.price).toBe(15);

      const oreState = readTownPriceState(mockTown, 'ore');
      expect(oreState.stock).toBe(25);
      expect(oreState.price).toBe(20);
    });
  });

  describe('writeTownPrice', () => {
    it('updates only the specified good price', () => {
      const updatedTown = writeTownPrice(mockTown, 'fish', 25);

      // Fish price should be updated
      expect(updatedTown.prices.fish).toBe(25);

      // Other prices should remain unchanged
      expect(updatedTown.prices.wood).toBe(15);
      expect(updatedTown.prices.ore).toBe(20);
    });

    it('clamps prices to minimum of 1', () => {
      const updatedTown = writeTownPrice(mockTown, 'fish', 0);
      expect(updatedTown.prices.fish).toBe(1);

      const updatedTown2 = writeTownPrice(mockTown, 'fish', -5);
      expect(updatedTown2.prices.fish).toBe(1);
    });

    it('truncates decimal prices to integers', () => {
      const updatedTown = writeTownPrice(mockTown, 'fish', 12.7);
      expect(updatedTown.prices.fish).toBe(12);

      const updatedTown2 = writeTownPrice(mockTown, 'fish', 8.3);
      expect(updatedTown2.prices.fish).toBe(8);
    });

    it('preserves all other town fields unchanged', () => {
      const updatedTown = writeTownPrice(mockTown, 'fish', 30);

      // All other fields should be identical
      expect(updatedTown.id).toBe(mockTown.id);
      expect(updatedTown.name).toBe(mockTown.name);
      expect(updatedTown.resources).toEqual(mockTown.resources);
      expect(updatedTown.militaryRaw).toBe(mockTown.militaryRaw);
      expect(updatedTown.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(updatedTown.treasury).toBe(mockTown.treasury);
      expect(updatedTown.revealed).toEqual(mockTown.revealed);
      expect(updatedTown.aiProfileId).toBe(mockTown.aiProfileId);
    });

    it('creates a new town object (immutability)', () => {
      const updatedTown = writeTownPrice(mockTown, 'fish', 30);

      // Should be a different object reference
      expect(updatedTown).not.toBe(mockTown);
      expect(updatedTown.prices).not.toBe(mockTown.prices);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
    });
  });
});
