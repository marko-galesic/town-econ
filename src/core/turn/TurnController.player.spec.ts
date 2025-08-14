import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';

describe('TurnController.player', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;
  let mockState: GameState;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    mockState = {
      turn: 0,
      version: 1,
      rngSeed: 'test-seed',
      towns: [],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: { prosperityDelta: 2, militaryDelta: 1 }
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: { prosperityDelta: 1, militaryDelta: 2 }
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: { prosperityDelta: 3, militaryDelta: 3 }
        }
      }
    };
  });

  describe('with empty queue', () => {
    it('should synthesize action as "none"', async () => {
      controller = new TurnController(playerQueue);

      // Queue should be empty initially
      expect(playerQueue.length).toBe(0);

      const result = await controller.runTurn(mockState);

      // Turn should be incremented (from startTurn)
      expect(result.state.turn).toBe(1);

      // No other state changes should occur
      expect(result.state.version).toBe(mockState.version);
      expect(result.state.rngSeed).toBe(mockState.rngSeed);
      expect(result.state.towns).toEqual(mockState.towns);
      expect(result.state.goods).toEqual(mockState.goods);
    });
  });

  describe('with one queued action', () => {
    it('should dequeue action and make no state changes', async () => {
      controller = new TurnController(playerQueue);

      // Add one action to queue
      playerQueue.enqueue({ type: 'trade' });
      expect(playerQueue.length).toBe(1);

      const result = await controller.runTurn(mockState);

      // Action should have been consumed
      expect(playerQueue.length).toBe(0);

      // Turn should be incremented (from startTurn)
      expect(result.state.turn).toBe(1);

      // No other state changes should occur
      expect(result.state.version).toBe(mockState.version);
      expect(result.state.rngSeed).toBe(mockState.rngSeed);
      expect(result.state.towns).toEqual(mockState.towns);
      expect(result.state.goods).toEqual(mockState.goods);
    });
  });

  describe('onPhase hook', () => {
    it('should receive phase and action details', async () => {
      const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];

      controller = new TurnController(playerQueue, {
        onPhase: (phase, detail) => {
          phaseLog.push({ phase, detail });
        }
      });

      // Add an action to queue
      playerQueue.enqueue({ type: 'trade', payload: { good: 'fish' } });

      await controller.runTurn(mockState);

      // Should have logged all phases
      expect(phaseLog).toHaveLength(5);

      // Check that PlayerAction phase was logged with action details
      const playerActionLog = phaseLog.find(log => log.phase === TurnPhase.PlayerAction);
      expect(playerActionLog).toBeDefined();
      expect(playerActionLog?.detail).toEqual({ type: 'trade', payload: { good: 'fish' } });

      // Check other phases were logged (without details for now)
      expect(phaseLog.find(log => log.phase === TurnPhase.Start)).toBeDefined();
      expect(phaseLog.find(log => log.phase === TurnPhase.AiActions)).toBeDefined();
      expect(phaseLog.find(log => log.phase === TurnPhase.UpdateStats)).toBeDefined();
      expect(phaseLog.find(log => log.phase === TurnPhase.End)).toBeDefined();
    });

    it('should work without onPhase hook', async () => {
      controller = new TurnController(playerQueue);

      // Should not throw when no hook is provided
      expect(() => controller.runTurn(mockState)).not.toThrow();
    });
  });

  describe('aiActions phase', () => {
    it('should trigger AiActions hook with decided:false and make no state changes', async () => {
      const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];

      controller = new TurnController(playerQueue, {
        onPhase: (phase, detail) => {
          phaseLog.push({ phase, detail });
        }
      });

      const result = await controller.runTurn(mockState);

      // Check that AiActions phase was logged with decided:false
      const aiActionsLog = phaseLog.find(log => log.phase === TurnPhase.AiActions);
      expect(aiActionsLog).toBeDefined();
      expect(aiActionsLog?.detail).toEqual({ decided: false });

      // Verify no state changes occurred (turn should still be incremented from startTurn)
      expect(result.state.turn).toBe(1); // First turn
      expect(result.state.version).toBe(mockState.version);
      expect(result.state.rngSeed).toBe(mockState.rngSeed);
      expect(result.state.towns).toEqual(mockState.towns);
      expect(result.state.goods).toEqual(mockState.goods);
    });
  });
});
