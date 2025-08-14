import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';

describe('TurnController', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    controller = new TurnController(playerQueue);
  });

  describe('runTurn', () => {
    it('should return an object with phaseLog exactly [Start, PlayerAction, AiActions, UpdateStats, End]', async () => {
      const mockState: GameState = {
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

      const result = await controller.runTurn(mockState);

      expect(result.phaseLog).toEqual([
        TurnPhase.Start,
        TurnPhase.PlayerAction,
        TurnPhase.AiActions,
        TurnPhase.UpdateStats,
        TurnPhase.End
      ]);
    });

    it('should return a GameState object (same ref allowed for now)', async () => {
      const mockState: GameState = {
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

      const result = await controller.runTurn(mockState);

      // For now, we allow the same reference since no logic is implemented yet
      // This documents our current choice and can be updated when state modifications are added
      expect(result.state).toBe(mockState);
      expect(result.state).toEqual(mockState);
    });

    it('should execute phases in the correct order', async () => {
      const mockState: GameState = {
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

      const result = await controller.runTurn(mockState);

      // Verify the phase log contains exactly 5 phases in the correct order
      expect(result.phaseLog).toHaveLength(5);
      expect(result.phaseLog[0]).toBe(TurnPhase.Start);
      expect(result.phaseLog[1]).toBe(TurnPhase.PlayerAction);
      expect(result.phaseLog[2]).toBe(TurnPhase.AiActions);
      expect(result.phaseLog[3]).toBe(TurnPhase.UpdateStats);
      expect(result.phaseLog[4]).toBe(TurnPhase.End);
    });
  });

  describe('playerAction phase queue integration', () => {
    it('should no-op when queue is empty', async () => {
      const mockState: GameState = {
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

      // Queue should be empty initially
      expect(playerQueue.length).toBe(0);

      await controller.runTurn(mockState);

      // Queue should still be empty after turn
      expect(playerQueue.length).toBe(0);
    });

    it('should consume one action when queue has items', async () => {
      const mockState: GameState = {
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

      // Add actions to queue
      playerQueue.enqueue({ type: 'trade' });
      playerQueue.enqueue({ type: 'none' });
      playerQueue.enqueue({ type: 'trade', payload: { good: 'fish' } });

      expect(playerQueue.length).toBe(3);

      await controller.runTurn(mockState);

      // One action should have been consumed during the turn
      expect(playerQueue.length).toBe(2);
    });
  });
});
