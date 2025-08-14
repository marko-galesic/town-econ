import { describe, it, expect, vi } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.updateStats', () => {
  it('should run empty pipeline and return unchanged state', async () => {
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

    // Run just the updateStats phase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (controller as any).updateStats(initialState);

    // State should be unchanged
    expect(result).toBe(initialState);

    // Phase hook should have been called with ran=0
    expect(onPhase).toHaveBeenCalledWith(TurnPhase.UpdateStats, { ran: 0 });
  });

  it('should run pipeline with registered systems', async () => {
    const playerQ = new PlayerActionQueue();
    const pipeline = new UpdatePipeline();
    const onPhase = vi.fn();

    const controller = new TurnController(playerQ, pipeline, { onPhase });

    const initialState: GameState & { counter?: number } = {
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
      counter: 0,
    };

    // Register a system that increments counter
    pipeline.register((s: GameState & { counter?: number }) => ({
      ...s,
      counter: (s.counter || 0) + 1,
    }));

    // Run the updateStats phase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (controller as any).updateStats(initialState);

    // State should be modified
    expect(result).not.toBe(initialState);
    expect(result.counter).toBe(1);

    // Phase hook should have been called with ran=1
    expect(onPhase).toHaveBeenCalledWith(TurnPhase.UpdateStats, { ran: 1 });
  });

  it('should require UpdatePipeline in constructor', () => {
    const playerQ = new PlayerActionQueue();

    expect(() => {
      new TurnController(playerQ, null as unknown as UpdatePipeline);
    }).toThrow('UpdatePipeline is required');
  });
});
