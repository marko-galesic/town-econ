import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import { UpdatePipeline, type UpdateSystem } from './UpdatePipeline';

describe('UpdatePipeline', () => {
  it('should start with no systems', () => {
    const pipeline = new UpdatePipeline();
    expect(pipeline.systemCount).toBe(0);
  });

  it('should register systems and increment count', () => {
    const pipeline = new UpdatePipeline();
    const mockSystem: UpdateSystem = (s: GameState) => s;

    pipeline.register(mockSystem);
    expect(pipeline.systemCount).toBe(1);

    pipeline.register(mockSystem);
    expect(pipeline.systemCount).toBe(2);
  });

  it('should apply systems in registration order', () => {
    const pipeline = new UpdatePipeline();

    // Create a mock GameState with a counter field
    const mockState: GameState & { counter?: number } = {
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

    // Create systems that increment the counter
    const incrementBy1: UpdateSystem = (s: GameState & { counter?: number }) => ({
      ...s,
      counter: (s.counter || 0) + 1,
    });

    const incrementBy2: UpdateSystem = (s: GameState & { counter?: number }) => ({
      ...s,
      counter: (s.counter || 0) + 2,
    });

    // Register systems in order
    pipeline.register(incrementBy1);
    pipeline.register(incrementBy2);

    // Run the pipeline
    const result = pipeline.run(mockState);

    // Should have applied both systems in order: 0 + 1 + 2 = 3
    expect((result as typeof mockState).counter).toBe(3);
    expect(result).not.toBe(mockState); // Should be a new object
  });

  it('should return original state when no systems are registered', () => {
    const pipeline = new UpdatePipeline();
    const mockState: GameState = {
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

    const result = pipeline.run(mockState);
    expect(result).toBe(mockState); // Same reference when no systems
  });

  it('should handle single system correctly', () => {
    const pipeline = new UpdatePipeline();
    const mockState: GameState & { counter?: number } = {
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
      counter: 5,
    };

    const doubleCounter: UpdateSystem = (s: GameState & { counter?: number }) => ({
      ...s,
      counter: (s.counter || 0) * 2,
    });

    pipeline.register(doubleCounter);
    const result = pipeline.run(mockState);

    expect((result as typeof mockState).counter).toBe(10);
    expect(result).not.toBe(mockState);
  });
});
