import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.start', () => {
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

    controller = new TurnController(
      playerQueue,
      new UpdatePipeline(),
      createDefaultTurnControllerOptions(),
    );
  });

  it('should increment turn counter from 0 to 1 after runTurn', async () => {
    const result = await controller.runTurn(gameState);

    expect(result.state.turn).toBe(1);
    expect(result.state.turn).toBe(gameState.turn + 1);
  });

  it('should not change any other fields except turn (deep compare)', async () => {
    const result = await controller.runTurn(gameState);

    // Only turn should change
    expect(result.state.turn).toBe(1);
    expect(result.state.version).toBe(gameState.version);
    expect(result.state.rngSeed).toBe(gameState.rngSeed);
    expect(result.state.towns).toEqual(gameState.towns);
    expect(result.state.goods).toEqual(gameState.goods);
  });
});
