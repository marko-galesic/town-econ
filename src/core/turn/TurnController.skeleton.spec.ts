import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';
import { createSimpleLinearPriceModel } from '../trade/PriceModel';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    const mockState: GameState = {
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

    controller = new TurnController(playerQueue, new UpdatePipeline(), {
      priceModel: createSimpleLinearPriceModel(),
      goods: mockState.goods,
    });
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

      const result = await controller.runTurn(mockState);

      expect(result.phaseLog).toEqual([
        TurnPhase.Start,
        TurnPhase.PlayerAction,
        TurnPhase.AiActions,
        TurnPhase.UpdateStats,
        TurnPhase.End,
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

      const result = await controller.runTurn(mockState);

      // State is now modified (turn is incremented) so we expect a new object
      expect(result.state).not.toBe(mockState);
      expect(result.state.turn).toBe(1);
      expect(result.state.version).toBe(mockState.version);
      expect(result.state.rngSeed).toBe(mockState.rngSeed);
      expect(result.state.towns).toEqual(mockState.towns);
      expect(result.state.goods).toEqual(mockState.goods);
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
        towns: [
          {
            id: 'town1',
            name: 'Town 1',
            resources: { fish: 10, wood: 10, ore: 10 },
            prices: { fish: 2, wood: 3, ore: 5 },
            militaryRaw: 5,
            prosperityRaw: 8,
            treasury: 1000,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'modest',
              lastUpdatedTurn: 0,
            },
          },
          {
            id: 'town2',
            name: 'Town 2',
            resources: { fish: 10, wood: 10, ore: 10 },
            prices: { fish: 4, wood: 1, ore: 6 },
            militaryRaw: 12,
            prosperityRaw: 15,
            treasury: 1200,
            revealed: {
              militaryTier: 'garrison',
              prosperityTier: 'prosperous',
              lastUpdatedTurn: 0,
            },
          },
        ],
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

      // Add actions to queue
      playerQueue.enqueue({
        type: 'trade',
        payload: {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'fish',
          quantity: 5,
          side: 'buy',
          pricePerUnit: 4, // Town2 quotes 4 for fish
        },
      });
      playerQueue.enqueue({ type: 'none' });
      playerQueue.enqueue({
        type: 'trade',
        payload: {
          fromTownId: 'town1',
          toTownId: 'town2',
          goodId: 'wood',
          quantity: 3,
          side: 'sell',
          pricePerUnit: 3, // Town1 quotes 3 for wood
        },
      });

      expect(playerQueue.length).toBe(3);

      await controller.runTurn(mockState);

      // One action should have been consumed during the turn
      expect(playerQueue.length).toBe(2);
    });
  });
});
