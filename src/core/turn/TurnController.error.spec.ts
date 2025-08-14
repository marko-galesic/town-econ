import { describe, it, expect, vi } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodConfig } from '../../types/Goods';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhaseError } from './TurnErrors';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

// Helper function to create a valid mock game state
function createMockGameState(turn: number = 1): GameState {
  const mockGoods: Record<string, GoodConfig> = {
    fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
    wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
    ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } },
  };

  return {
    turn,
    version: 1,
    rngSeed: 'test-seed',
    towns: [],
    goods: mockGoods,
  };
}

describe('TurnController Error Handling', () => {
  it('should throw TurnPhaseError when UpdateStats phase fails', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();

    // Mock the updatePipeline.run to throw an error
    const mockError = new Error('Update system failed');
    vi.spyOn(mockUpdatePipeline, 'run').mockImplementation(() => {
      throw mockError;
    });

    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const mockState = createMockGameState();

    // Act & Assert
    await expect(controller.runTurn(mockState)).rejects.toThrow(TurnPhaseError);

    try {
      await controller.runTurn(mockState);
    } catch (error) {
      expect(error).toBeInstanceOf(TurnPhaseError);
      if (error instanceof TurnPhaseError) {
        expect(error.phase).toBe(TurnPhase.UpdateStats);
        expect(error.cause).toBe(mockError);
        expect(error.message).toContain('Turn failed during updateStats');
        expect(error.message).toContain('Update system failed');
      }
    }
  });

  it('should preserve original state when any phase fails', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();

    // Mock the updatePipeline.run to throw an error
    vi.spyOn(mockUpdatePipeline, 'run').mockImplementation(() => {
      throw new Error('Update system failed');
    });

    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const originalState = createMockGameState();

    // Take a snapshot of the original state
    const stateSnapshot = JSON.parse(JSON.stringify(originalState));

    // Act & Assert
    try {
      await controller.runTurn(originalState);
    } catch (error) {
      // Verify the original state is unchanged
      expect(JSON.stringify(originalState)).toEqual(JSON.stringify(stateSnapshot));

      // Verify the error contains the correct phase
      expect(error).toBeInstanceOf(TurnPhaseError);
      if (error instanceof TurnPhaseError) {
        expect(error.phase).toBe(TurnPhase.UpdateStats);
      }
    }
  });

  it('should throw TurnPhaseError with correct phase when PlayerAction fails', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();

    // Mock the playerQ.dequeue to throw an error
    vi.spyOn(mockPlayerQ, 'dequeue').mockImplementation(() => {
      throw new Error('Player action failed');
    });

    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const mockState = createMockGameState();

    // Act & Assert
    try {
      await controller.runTurn(mockState);
    } catch (error) {
      expect(error).toBeInstanceOf(TurnPhaseError);
      if (error instanceof TurnPhaseError) {
        expect(error.phase).toBe(TurnPhase.PlayerAction);
        expect(error.message).toContain('Turn failed during playerAction');
        expect(error.message).toContain('Player action failed');
      }
    }
  });

  it('should throw TurnPhaseError with Start phase when startTurn fails', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();

    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    // Create a state that will cause startTurn to fail
    const mockState = createMockGameState();

    // Mock the advanceTurn function to throw
    vi.doMock('../stateApi', () => ({
      advanceTurn: () => {
        throw new Error('Start turn failed');
      },
    }));

    // Act & Assert
    try {
      await controller.runTurn(mockState);
    } catch (error) {
      expect(error).toBeInstanceOf(TurnPhaseError);
      if (error instanceof TurnPhaseError) {
        expect(error.phase).toBe(TurnPhase.Start);
        expect(error.message).toContain('Turn failed during start');
        expect(error.message).toContain('Start turn failed');
      }
    }
  });

  it('should maintain immutability assumption - input state is never mutated', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();

    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const originalState = createMockGameState();

    const stateSnapshot = JSON.parse(JSON.stringify(originalState));

    // Act - successful turn execution
    const result = await controller.runTurn(originalState);

    // Assert - original state unchanged, new state returned
    expect(JSON.stringify(originalState)).toEqual(JSON.stringify(stateSnapshot));
    expect(result.state).not.toBe(originalState); // Should be a new reference
    expect(result.state.turn).toBe(2); // Turn should be incremented
  });
});
