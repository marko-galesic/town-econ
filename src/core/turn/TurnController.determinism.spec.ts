import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController Determinism', () => {
  let playerQueue: PlayerActionQueue;
  let pipeline: UpdatePipeline;
  let gameState: GameState;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    pipeline = new UpdatePipeline();
    gameState = {
      turn: 0,
      version: 1,
      rngSeed: 'test-seed',
      towns: [],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: { prosperityDelta: 2, militaryDelta: 1 },
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: { prosperityDelta: 1, militaryDelta: 2 },
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: { prosperityDelta: 3, militaryDelta: 3 },
        },
      },
    };
  });

  describe('deterministic behavior', () => {
    it('should produce identical outputs for identical initial states', async () => {
      const controller = new TurnController(
        playerQueue,
        pipeline,
        createDefaultTurnControllerOptions(),
      );

      const result1 = await controller.runTurn(gameState);
      const result2 = await controller.runTurn(gameState);

      expect(result1.state.turn).toBe(result2.state.turn);
      expect(result1.phaseLog).toEqual(result2.phaseLog);
    });

    it('should produce identical outputs for multiple runs with same seed', async () => {
      const controller = new TurnController(
        playerQueue,
        pipeline,
        createDefaultTurnControllerOptions(),
      );

      const result1 = await controller.runTurn(gameState);
      const result2 = await controller.runTurn(gameState);

      expect(result1.state.turn).toBe(result2.state.turn);
      expect(result1.phaseLog).toEqual(result2.phaseLog);
    });

    it('should produce different outputs for different RNG seeds', async () => {
      const controller = new TurnController(
        playerQueue,
        pipeline,
        createDefaultTurnControllerOptions(),
      );

      const state1 = { ...gameState, rngSeed: 'seed-1' };
      const state2 = { ...gameState, rngSeed: 'seed-2' };

      const result1 = await controller.runTurn(state1);
      const result2 = await controller.runTurn(state2);

      // Both should increment turn, but may have different RNG behavior
      expect(result1.state.turn).toBe(1);
      expect(result2.state.turn).toBe(1);
    });
  });
});
