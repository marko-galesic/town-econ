import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController Phase Order', () => {
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

  it('should log phases in the correct order: Start, PlayerAction, AiActions, UpdateStats, End', async () => {
    const controller = new TurnController(
      mockPlayerQ,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    const result = await controller.runTurn(mockState);

    expect(result.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);
  });

  it('should maintain phase order consistency across multiple turns', async () => {
    const controller = new TurnController(
      mockPlayerQ,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    // First turn
    const result1 = await controller.runTurn(mockState);
    expect(result1.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);

    // Second turn
    const result2 = await controller.runTurn(result1.state);
    expect(result2.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);

    // Third turn
    const result3 = await controller.runTurn(result2.state);
    expect(result3.phaseLog).toEqual([
      TurnPhase.Start,
      TurnPhase.PlayerAction,
      TurnPhase.AiActions,
      TurnPhase.UpdateStats,
      TurnPhase.End,
    ]);
  });

  it('should include phaseLog in TurnResult interface', async () => {
    const controller = new TurnController(
      mockPlayerQ,
      mockUpdatePipeline,
      createDefaultTurnControllerOptions(),
    );

    const result = await controller.runTurn(mockState);

    expect(result).toHaveProperty('phaseLog');
    expect(Array.isArray(result.phaseLog)).toBe(true);
    expect(result.phaseLog.length).toBeGreaterThan(0);
    expect(result.phaseLog.every(phase => Object.values(TurnPhase).includes(phase))).toBe(true);
  });
});
