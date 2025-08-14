import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.start', () => {
  let controller: TurnController;
  let playerQueue: PlayerActionQueue;

  beforeEach(() => {
    playerQueue = new PlayerActionQueue();
    controller = new TurnController(playerQueue, new UpdatePipeline(), {});
  });

  it('should increment turn counter from 0 to 1 after runTurn', async () => {
    const initialState: GameState = {
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

    const result = await controller.runTurn(initialState);

    expect(result.state.turn).toBe(1);
  });

  it('should not change any other fields except turn (deep compare)', async () => {
    const initialState: GameState = {
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

    const result = await controller.runTurn(initialState);

    // Check that turn was incremented
    expect(result.state.turn).toBe(1);

    // Check that all other fields remain unchanged
    expect(result.state.version).toBe(initialState.version);
    expect(result.state.rngSeed).toBe(initialState.rngSeed);
    expect(result.state.towns).toEqual(initialState.towns);
    expect(result.state.goods).toEqual(initialState.goods);

    // Deep compare everything except turn
    const { turn: initialTurn, ...initialWithoutTurn } = initialState;
    const { turn: resultTurn, ...resultWithoutTurn } = result.state;
    expect(resultWithoutTurn).toEqual(initialWithoutTurn);
    // Verify turn was incremented
    expect(resultTurn).toBe(initialTurn + 1);
  });
});
