import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.player', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;
  let gameState: GameState;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
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

  describe('with empty queue', () => {
    it('should synthesize action as "none"', async () => {
      controller = new TurnController(
        playerQueue,
        new UpdatePipeline(),
        createDefaultTurnControllerOptions(),
      );

      const result = await controller.runTurn(gameState);

      expect(result.state.turn).toBe(1);
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
    });
  });

  describe('with one queued action', () => {
    it('should dequeue action and make no state changes', async () => {
      // Enqueue a 'none' action
      playerQueue.enqueue({ type: 'none' });

      controller = new TurnController(
        playerQueue,
        new UpdatePipeline(),
        createDefaultTurnControllerOptions(),
      );

      const result = await controller.runTurn(gameState);

      expect(result.state.turn).toBe(1);
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
    });
  });

  describe('onPhase hook', () => {
    it('should receive phase and action details', async () => {
      const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];
      const onPhase = (phase: TurnPhase, detail?: unknown) => {
        phaseLog.push({ phase, detail });
      };

      controller = new TurnController(playerQueue, new UpdatePipeline(), {
        ...createDefaultTurnControllerOptions(),
        onPhase,
      });

      await controller.runTurn(gameState);

      const playerActionPhase = phaseLog.find(p => p.phase === TurnPhase.PlayerAction);
      expect(playerActionPhase).toBeDefined();
      expect(playerActionPhase?.detail).toMatchObject({
        action: { type: 'none' },
      });
    });

    it('should work without onPhase hook', async () => {
      controller = new TurnController(
        playerQueue,
        new UpdatePipeline(),
        createDefaultTurnControllerOptions(),
      );

      const result = await controller.runTurn(gameState);

      expect(result.state.turn).toBe(1);
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
    });
  });

  describe('aiActions phase', () => {
    it('should trigger AiActions hook with decided:false and make no state changes', async () => {
      const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];
      const onPhase = (phase: TurnPhase, detail?: unknown) => {
        phaseLog.push({ phase, detail });
      };

      controller = new TurnController(playerQueue, new UpdatePipeline(), {
        ...createDefaultTurnControllerOptions(),
        onPhase,
      });

      await controller.runTurn(gameState);

      const aiActionsPhase = phaseLog.find(p => p.phase === TurnPhase.AiActions);
      expect(aiActionsPhase).toBeDefined();
      expect(aiActionsPhase?.detail).toMatchObject({ decided: false });
    });
  });
});
