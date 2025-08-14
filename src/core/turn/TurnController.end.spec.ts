import { describe, it, expect, vi } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.endTurn', () => {
  it('should emit End phase with correct turn number', async () => {
    const playerQ = new PlayerActionQueue();
    const pipeline = new UpdatePipeline();
    const onPhase = vi.fn();

    const controller = new TurnController(playerQ, pipeline, { onPhase });

    const initialState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'test',
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

    // Run just the endTurn phase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (controller as any).endTurn(initialState);

    // State should be unchanged
    expect(result).toBe(initialState);

    // Phase hook should have been called with turn number
    expect(onPhase).toHaveBeenCalledWith(TurnPhase.End, { turn: 0 });
  });

  it('should emit End phase with incremented turn number after full turn', async () => {
    const playerQ = new PlayerActionQueue();
    const pipeline = new UpdatePipeline();
    const onPhase = vi.fn();

    const controller = new TurnController(playerQ, pipeline, { onPhase });

    const initialState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'test',
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

    // Run a complete turn
    const result = await controller.runTurn(initialState);

    // Turn should have been incremented
    expect(result.state.turn).toBe(1);

    // Phase hook should have been called with the final turn number
    expect(onPhase).toHaveBeenCalledWith(TurnPhase.End, { turn: 1 });
  });

  it('should work without onPhase hook', async () => {
    const playerQ = new PlayerActionQueue();
    const pipeline = new UpdatePipeline();

    const controller = new TurnController(playerQ, pipeline);

    const initialState: GameState = {
      turn: 5,
      version: 1,
      rngSeed: 'test',
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

    // Should not throw when no hook is provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (controller as any).endTurn(initialState);
    expect(result).toBe(initialState);
  });
});
