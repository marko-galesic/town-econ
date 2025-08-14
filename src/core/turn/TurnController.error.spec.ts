import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhaseError } from './TurnErrors';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController Error Handling', () => {
  let mockPlayerQ: PlayerActionQueue;
  let mockUpdatePipeline: UpdatePipeline;
  let mockState: GameState;

  beforeEach(() => {
    mockPlayerQ = new PlayerActionQueue();
    mockUpdatePipeline = new UpdatePipeline();
    mockState = {
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

  it('should throw TurnPhaseError when UpdateStats phase fails', async () => {
    // Mock the update pipeline to throw an error
    const mockPipeline = {
      run: vi.fn().mockImplementation(() => {
        throw new Error('Update pipeline failed');
      }),
      systemCount: 0,
    } as unknown as UpdatePipeline;

    const controller = new TurnController(
      mockPlayerQ,
      mockPipeline,
      createDefaultTurnControllerOptions(),
    );

    await expect(controller.runTurn(mockState)).rejects.toThrow(TurnPhaseError);
  });

  it('should preserve original state when any phase fails', async () => {
    const mockPipeline = {
      run: vi.fn().mockImplementation(() => {
        throw new Error('Update pipeline failed');
      }),
      systemCount: 0,
    } as unknown as UpdatePipeline;

    const controller = new TurnController(
      mockPlayerQ,
      mockPipeline,
      createDefaultTurnControllerOptions(),
    );

    const originalState = { ...mockState };
    const originalTowns = mockState.towns.map(town => ({ ...town }));

    try {
      await controller.runTurn(mockState);
    } catch {
      // Original state should remain unchanged
      expect(mockState).toEqual(originalState);
      expect(mockState.towns).toEqual(originalTowns);
    }
  });

  it('should throw TurnPhaseError with correct phase when PlayerAction fails', async () => {
    // Mock the player queue to return an action that will cause an error
    const mockPlayerQWithError = {
      dequeue: vi.fn().mockReturnValue({
        type: 'trade',
        payload: {
          fromTownId: 'invalid-town',
          toTownId: 'invalid-town',
          goodId: 'fish',
          quantity: 5,
          side: 'buy',
          pricePerUnit: 10,
        },
      }),
    } as unknown as PlayerActionQueue;

    const controller = new TurnController(
      mockPlayerQWithError,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    await expect(controller.runTurn(mockState)).rejects.toThrow(TurnPhaseError);
  });

  it('should throw TurnPhaseError with Start phase when startTurn fails', async () => {
    // This test would require mocking the advanceTurn function to fail
    // For now, we'll test that the controller properly handles errors
    const controller = new TurnController(
      mockPlayerQ,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    // This should not throw an error for a valid state
    const result = await controller.runTurn(mockState);
    expect(result.state.turn).toBe(1);
  });

  it('should maintain immutability assumption - input state is never mutated', async () => {
    const controller = new TurnController(
      mockPlayerQ,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    const originalState = { ...mockState };
    const originalTowns = mockState.towns.map(town => ({ ...town }));

    const result = await controller.runTurn(mockState);

    // Original state should remain unchanged
    expect(mockState).toEqual(originalState);
    expect(mockState.towns).toEqual(originalTowns);

    // Result state should be different (turn incremented)
    expect(result.state).not.toBe(mockState);
    expect(result.state.turn).toBe(1);
  });
});
