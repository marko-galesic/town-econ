import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { Town } from '../../types/Town';

import { DEFAULT_REVEAL_POLICY } from './RevealCadence';
import { applyRevealPass } from './RevealSystem';

describe('RevealSystem', () => {
  const createMockTown = (
    id: string,
    militaryRaw: number,
    prosperityRaw: number,
    lastUpdatedTurn: number,
  ): Town => ({
    id,
    name: `Town ${id}`,
    resources: { fish: 0, wood: 0, ore: 0 },
    prices: { fish: 10, wood: 15, ore: 25 },
    militaryRaw,
    prosperityRaw,
    treasury: 100,
    revealed: {
      militaryTier: 'militia',
      prosperityTier: 'struggling',
      lastUpdatedTurn,
    },
  });

  const createMockGameState = (turn: number, towns: Town[]): GameState => ({
    turn,
    version: 1,
    rngSeed: 'test-seed-123',
    towns,
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } },
    },
  });

  describe('applyRevealPass', () => {
    it('should not update revealed tiers when not due', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(1, [town]);
      const originalRevealed = { ...town.revealed };

      const result = applyRevealPass(state, 'test-seed');

      expect(result.towns[0]!.revealed.militaryTier).toBe(originalRevealed.militaryTier);
      expect(result.towns[0]!.revealed.prosperityTier).toBe(originalRevealed.prosperityTier);
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(originalRevealed.lastUpdatedTurn);
    });

    it('should update both tiers and lastUpdatedTurn when reveal is due', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]); // Turn 2, last updated 0, interval 2

      const result = applyRevealPass(state, 'test-seed');

      expect(result.towns[0]!.revealed.militaryTier).not.toBe('militia');
      expect(result.towns[0]!.revealed.prosperityTier).not.toBe('struggling');
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(2);
    });

    it('should be deterministic for same seed, town, and turn', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      const result1 = applyRevealPass(state, 'test-seed');
      const result2 = applyRevealPass(state, 'test-seed');

      expect(result1.towns[0]!.revealed.militaryTier).toBe(result2.towns[0]!.revealed.militaryTier);
      expect(result1.towns[0]!.revealed.prosperityTier).toBe(
        result2.towns[0]!.revealed.prosperityTier,
      );
    });

    it('should produce different results for different seeds', () => {
      const town = createMockTown('town1', 45, 55, 0); // Values closer to tier boundaries
      const state = createMockGameState(2, [town]);

      const result1 = applyRevealPass(state, 'seed-1');
      const result2 = applyRevealPass(state, 'seed-2');

      // Different seeds should produce different fuzzy results
      // Note: This test may occasionally fail if both seeds produce the same tier
      // due to the deterministic nature of the fuzzy system
      const militaryDifferent =
        result1.towns[0]!.revealed.militaryTier !== result2.towns[0]!.revealed.militaryTier;
      const prosperityDifferent =
        result1.towns[0]!.revealed.prosperityTier !== result2.towns[0]!.revealed.prosperityTier;

      // At least one of the tiers should be different
      expect(militaryDifferent || prosperityDifferent).toBe(true);
    });

    it('should handle multiple towns independently', () => {
      const town1 = createMockTown('town1', 75, 80, 0);
      const town2 = createMockTown('town2', 25, 30, 1);
      const state = createMockGameState(2, [town1, town2]);

      const result = applyRevealPass(state, 'test-seed');

      // Town1 should be updated (turn 2, last updated 0, interval 2)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(2);
      expect(result.towns[0]!.revealed.militaryTier).not.toBe('militia');

      // Town2 should not be updated (turn 2, last updated 1, interval 2)
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(1);
      expect(result.towns[1]!.revealed.militaryTier).toBe('militia');
    });

    it('should respect custom reveal policy', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(3, [town]);
      const customPolicy = { interval: 3 };

      const result = applyRevealPass(state, 'test-seed', customPolicy);

      // With interval 3, turn 3 should trigger reveal (3 - 0 = 3, which is divisible by 3)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(3);
    });

    it('should handle towns with different lastUpdatedTurn values', () => {
      const town1 = createMockTown('town1', 75, 80, 0);
      const town2 = createMockTown('town2', 25, 30, 2);
      const state = createMockGameState(4, [town1, town2]);

      const result = applyRevealPass(state, 'test-seed');

      // Town1: turn 4, last updated 0, interval 2 -> should update (4-0=4, divisible by 2)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(4);

      // Town2: turn 4, last updated 2, interval 2 -> should update (4-2=2, divisible by 2)
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(4);
    });

    it('should preserve other town properties unchanged', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      const result = applyRevealPass(state, 'test-seed');

      const updatedTown = result.towns[0]!;
      expect(updatedTown.id).toBe(town.id);
      expect(updatedTown.name).toBe(town.name);
      expect(updatedTown.militaryRaw).toBe(town.militaryRaw);
      expect(updatedTown.prosperityRaw).toBe(town.prosperityRaw);
      expect(updatedTown.treasury).toBe(town.treasury);
      expect(updatedTown.resources).toBe(town.resources);
      expect(updatedTown.prices).toBe(town.prices);
    });

    it('should handle empty towns array', () => {
      const state = createMockGameState(2, []);

      const result = applyRevealPass(state, 'test-seed');

      expect(result.towns).toEqual([]);
      expect(result.turn).toBe(2);
      expect(result.rngSeed).toBe('test-seed-123');
    });

    it('should use DEFAULT_REVEAL_POLICY when no policy specified', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      const result1 = applyRevealPass(state, 'test-seed');
      const result2 = applyRevealPass(state, 'test-seed', DEFAULT_REVEAL_POLICY);

      expect(result1.towns[0]!.revealed.lastUpdatedTurn).toBe(
        result2.towns[0]!.revealed.lastUpdatedTurn,
      );
      expect(result1.towns[0]!.revealed.militaryTier).toBe(result2.towns[0]!.revealed.militaryTier);
    });

    it('should validate revealed tiers are in allowed set', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      const result = applyRevealPass(state, 'test-seed');
      const revealedTown = result.towns[0]!;

      // Verify military tier is valid
      expect(['militia', 'garrison', 'formidable', 'host']).toContain(
        revealedTown.revealed.militaryTier,
      );

      // Verify prosperity tier is valid
      expect(['struggling', 'modest', 'prosperous', 'opulent']).toContain(
        revealedTown.revealed.prosperityTier,
      );
    });

    it('should validate tier configuration', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      // This should not throw as the configuration is valid
      expect(() => applyRevealPass(state, 'test-seed')).not.toThrow();
    });

    it('should never return unknown tier values', () => {
      const town = createMockTown('town1', 75, 80, 0);
      const state = createMockGameState(2, [town]);

      const result = applyRevealPass(state, 'test-seed');
      const revealedTown = result.towns[0]!;

      // Ensure fuzzy tier mapping never produces invalid tiers
      const validMilitaryTiers = ['militia', 'garrison', 'formidable', 'host'];
      const validProsperityTiers = ['struggling', 'modest', 'prosperous', 'opulent'];

      expect(validMilitaryTiers).toContain(revealedTown.revealed.militaryTier);
      expect(validProsperityTiers).toContain(revealedTown.revealed.prosperityTier);
    });
  });
});
