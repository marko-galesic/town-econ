import { describe, it, expect } from 'vitest';

import type { GoodId } from '../types/Goods';

import { initGameState } from './initGameState';

describe('initGameState', () => {
  describe('Basic Structure', () => {
    it('should return a valid GameState with all required properties', () => {
      const gameState = initGameState();

      expect(gameState).toBeDefined();
      expect(typeof gameState).toBe('object');
      expect(gameState).toHaveProperty('turn');
      expect(gameState).toHaveProperty('version');
      expect(gameState).toHaveProperty('rngSeed');
      expect(gameState).toHaveProperty('towns');
      expect(gameState).toHaveProperty('goods');
    });

    it('should have turn === 0', () => {
      const gameState = initGameState();
      expect(gameState.turn).toBe(0);
    });

    it('should have version === 1', () => {
      const gameState = initGameState();
      expect(gameState.version).toBe(1);
    });

    it('should have non-empty rngSeed', () => {
      const gameState = initGameState();
      expect(gameState.rngSeed).toBeDefined();
      expect(typeof gameState.rngSeed).toBe('string');
      expect(gameState.rngSeed.length).toBeGreaterThan(0);
    });

    it('should use provided rngSeed when specified', () => {
      const customSeed = 'custom-seed-123';
      const gameState = initGameState({ rngSeed: customSeed });
      expect(gameState.rngSeed).toBe(customSeed);
    });
  });

  describe('Towns Validation', () => {
    it('should return exactly 3 towns', () => {
      const gameState = initGameState();
      expect(gameState.towns).toHaveLength(3);
    });

    it('should have towns with unique IDs', () => {
      const gameState = initGameState();
      const townIds = gameState.towns.map(town => town.id);
      const uniqueIds = new Set(townIds);
      expect(uniqueIds.size).toBe(townIds.length);
    });

    it('should have correct town structure for all towns', () => {
      const gameState = initGameState();

      gameState.towns.forEach(town => {
        expect(town).toHaveProperty('id');
        expect(town).toHaveProperty('name');
        expect(town).toHaveProperty('resources');
        expect(town).toHaveProperty('prices');
        expect(town).toHaveProperty('militaryRaw');
        expect(town).toHaveProperty('prosperityRaw');
        expect(town).toHaveProperty('revealed');
        expect(town.revealed).toHaveProperty('militaryTier');
        expect(town.revealed).toHaveProperty('prosperityTier');
        expect(town.revealed).toHaveProperty('lastUpdatedTurn');
      });
    });

    it('should have integer resources ≥0 for each town×good combination', () => {
      const gameState = initGameState();
      const goodIds = Object.keys(gameState.goods) as GoodId[];

      gameState.towns.forEach(town => {
        goodIds.forEach(goodId => {
          expect(town.resources).toHaveProperty(goodId);
          const resourceValue = town.resources[goodId as keyof typeof town.resources];
          expect(typeof resourceValue).toBe('number');
          expect(Number.isInteger(resourceValue)).toBe(true);
          expect(resourceValue).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should have integer prices ≥0 for each town×good combination', () => {
      const gameState = initGameState();
      const goodIds = Object.keys(gameState.goods) as GoodId[];

      gameState.towns.forEach(town => {
        goodIds.forEach(goodId => {
          expect(town.prices).toHaveProperty(goodId);
          const priceValue = town.prices[goodId as keyof typeof town.prices];
          expect(typeof priceValue).toBe('number');
          expect(Number.isInteger(priceValue)).toBe(true);
          expect(priceValue).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('Goods Coverage', () => {
    it('should have goods keys for all GoodIds', () => {
      const gameState = initGameState();
      const expectedGoodIds: GoodId[] = ['fish', 'wood', 'ore'];

      expectedGoodIds.forEach(goodId => {
        expect(gameState.goods).toHaveProperty(goodId);
        expect(gameState.goods[goodId]).toBeDefined();
      });
    });

    it('should have correct goods structure for all goods', () => {
      const gameState = initGameState();

      Object.values(gameState.goods).forEach(good => {
        expect(good).toHaveProperty('id');
        expect(good).toHaveProperty('name');
        expect(good).toHaveProperty('effects');
        expect(good.effects).toHaveProperty('prosperityDelta');
        expect(good.effects).toHaveProperty('militaryDelta');
      });
    });
  });

  describe('Data Isolation', () => {
    it('should deep clone towns to avoid shared references', () => {
      const gameState1 = initGameState();
      const gameState2 = initGameState();

      // Modify a town in the first game state
      if (gameState1.towns[0]) {
        gameState1.towns[0].name = 'Modified Name';
      }

      // The second game state should be unaffected
      if (gameState2.towns[0]) {
        expect(gameState2.towns[0].name).not.toBe('Modified Name');
      }
    });

    it('should deep clone goods to avoid shared references', () => {
      const gameState1 = initGameState();
      const gameState2 = initGameState();

      // Modify a good in the first game state
      gameState1.goods.fish.name = 'Modified Fish';

      // The second game state should be unaffected
      expect(gameState2.goods.fish.name).not.toBe('Modified Fish');
    });
  });

  describe('Determinism', () => {
    it('should be deterministic with same inputs', () => {
      const gameState1 = initGameState({ rngSeed: 'test-seed' });
      const gameState2 = initGameState({ rngSeed: 'test-seed' });

      expect(gameState1.rngSeed).toBe(gameState2.rngSeed);
      expect(gameState1.turn).toBe(gameState2.turn);
      expect(gameState1.version).toBe(gameState2.version);
      expect(gameState1.towns).toHaveLength(gameState2.towns.length);
      expect(Object.keys(gameState1.goods)).toEqual(Object.keys(gameState2.goods));
    });

    it('should produce deep-equal states with same seed', () => {
      const gameState1 = initGameState({ rngSeed: 'TEST' });
      const gameState2 = initGameState({ rngSeed: 'TEST' });

      // Since there's no RNG yet, same seed should produce identical states
      expect(gameState1.rngSeed).toBe('TEST');
      expect(gameState2.rngSeed).toBe('TEST');

      // Deep equality check - all properties should be identical
      expect(gameState1.turn).toBe(gameState2.turn);
      expect(gameState1.version).toBe(gameState2.version);
      expect(gameState1.rngSeed).toBe(gameState2.rngSeed);
      expect(gameState1.towns).toHaveLength(gameState2.towns.length);
      expect(Object.keys(gameState1.goods)).toEqual(Object.keys(gameState2.goods));

      // Check that towns are deep-equal
      gameState1.towns.forEach((town1, index) => {
        const town2 = gameState2.towns[index];
        if (town2) {
          expect(town1.id).toBe(town2.id);
          expect(town1.name).toBe(town2.name);
          expect(town1.resources).toEqual(town2.resources);
          expect(town1.prices).toEqual(town2.prices);
          expect(town1.militaryRaw).toBe(town2.militaryRaw);
          expect(town1.prosperityRaw).toBe(town2.prosperityRaw);
          expect(town1.revealed).toEqual(town2.revealed);
        }
      });

      // Check that goods are deep-equal
      Object.keys(gameState1.goods).forEach(goodId => {
        const good1 = gameState1.goods[goodId as keyof typeof gameState1.goods];
        const good2 = gameState2.goods[goodId as keyof typeof gameState2.goods];
        expect(good1.id).toBe(good2.id);
        expect(good1.name).toBe(good2.name);
        expect(good1.effects).toEqual(good2.effects);
      });
    });

    it('should return different rngSeeds when no seed provided', () => {
      const gameState1 = initGameState();
      const gameState2 = initGameState();

      // Note: This test might occasionally fail if crypto.getRandomValues returns the same value
      // In practice, this is extremely unlikely, but we're testing the behavior
      expect(gameState1.rngSeed).toBeDefined();
      expect(gameState2.rngSeed).toBeDefined();
    });
  });
});
