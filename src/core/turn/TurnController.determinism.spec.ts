import { describe, it, expect, beforeEach } from 'vitest';

import { initGameState } from '../initGameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { UpdatePipeline } from './UpdatePipeline';

/**
 * Deep clones an object to ensure no shared references.
 * This is a copy of the function from initGameState.ts to avoid circular dependencies.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

describe('TurnController Determinism', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    controller = new TurnController(playerQueue, new UpdatePipeline(), {});
  });

  describe('deterministic behavior', () => {
    it('should produce identical outputs for identical initial states', async () => {
      // Create two identical initial states with fixed RNG seed
      const s1 = initGameState({ rngSeed: 'FIXED' });
      const s2 = deepClone(s1);

      // Verify the states are identical before running turns
      expect(s1).toStrictEqual(s2);
      expect(s1.rngSeed).toBe('FIXED');
      expect(s2.rngSeed).toBe('FIXED');

      // Run turns on both states
      const r1 = await controller.runTurn(s1);
      const r2 = await controller.runTurn(s2);

      // The resulting states should be strictly equal
      expect(r1.state).toStrictEqual(r2.state);

      // Verify that both states have the same turn number (should be incremented)
      expect(r1.state.turn).toBe(1);
      expect(r2.state.turn).toBe(1);

      // Verify that both states maintain the same RNG seed
      expect(r1.state.rngSeed).toBe('FIXED');
      expect(r2.state.rngSeed).toBe('FIXED');

      // Verify that both phase logs are identical
      expect(r1.phaseLog).toStrictEqual(r2.phaseLog);
    });

    it('should produce identical outputs for multiple runs with same seed', async () => {
      const s1 = initGameState({ rngSeed: 'DETERMINISTIC-SEED-123' });
      const s2 = deepClone(s1);
      const s3 = deepClone(s1);

      // Run turns on all three identical states
      const r1 = await controller.runTurn(s1);
      const r2 = await controller.runTurn(s2);
      const r3 = await controller.runTurn(s3);

      // All three results should be identical
      expect(r1.state).toStrictEqual(r2.state);
      expect(r2.state).toStrictEqual(r3.state);
      expect(r1.state).toStrictEqual(r3.state);

      // All should have the same turn number
      expect(r1.state.turn).toBe(1);
      expect(r2.state.turn).toBe(1);
      expect(r3.state.turn).toBe(1);

      // All should maintain the same RNG seed
      expect(r1.state.rngSeed).toBe('DETERMINISTIC-SEED-123');
      expect(r2.state.rngSeed).toBe('DETERMINISTIC-SEED-123');
      expect(r3.state.rngSeed).toBe('DETERMINISTIC-SEED-123');
    });

    it('should produce different outputs for different RNG seeds', async () => {
      const s1 = initGameState({ rngSeed: 'SEED-A' });
      const s2 = initGameState({ rngSeed: 'SEED-B' });

      // Run turns on states with different seeds
      const r1 = await controller.runTurn(s1);
      const r2 = await controller.runTurn(s2);

      // The states should be different due to different RNG seeds
      expect(r1.state.rngSeed).toBe('SEED-A');
      expect(r2.state.rngSeed).toBe('SEED-B');

      // Both should have turn incremented to 1
      expect(r1.state.turn).toBe(1);
      expect(r2.state.turn).toBe(1);
    });
  });
});
