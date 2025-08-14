import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodConfig } from '../../types/Goods';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
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

describe('TurnController Phase Order', () => {
  it('should log phases in the correct order: Start, PlayerAction, AiActions, UpdateStats, End', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();
    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    // Create a minimal mock game state
    const mockState = createMockGameState();

    // Act
    const result = await controller.runTurn(mockState);

    // Assert
    expect(result.phaseLog).toBeDefined();
    expect(result.phaseLog).toHaveLength(5);

    // Verify exact order and count
    expect(result.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);
  });

  it('should maintain phase order consistency across multiple turns', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();
    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const mockState = createMockGameState();

    // Act - Run multiple turns
    const result1 = await controller.runTurn(mockState);
    const result2 = await controller.runTurn(result1.state);

    // Assert - Both turns should have identical phase order
    expect(result1.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);

    expect(result2.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);
  });

  it('should include phaseLog in TurnResult interface', async () => {
    // Arrange
    const mockPlayerQ = new PlayerActionQueue();
    const mockUpdatePipeline = new UpdatePipeline();
    const controller = new TurnController(mockPlayerQ, mockUpdatePipeline);

    const mockState = createMockGameState();

    // Act
    const result = await controller.runTurn(mockState);

    // Assert - Verify TurnResult structure
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('phaseLog');
    expect(Array.isArray(result.phaseLog)).toBe(true);
    expect(result.phaseLog.every(phase => Object.values(TurnPhase).includes(phase))).toBe(true);
  });
});
