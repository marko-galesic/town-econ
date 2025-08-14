import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.updateStats', () => {
  let controller: TurnController;
  let playerQ: PlayerActionQueue;
  let pipeline: UpdatePipeline;
  let gameState: GameState;

  beforeEach(() => {
    playerQ = new PlayerActionQueue();
    pipeline = new UpdatePipeline();
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
  });

  it('should run empty pipeline and return unchanged state', async () => {
    const onPhase = () => {
      // Test hook implementation
    };

    controller = new TurnController(playerQ, pipeline, {
      ...createDefaultTurnControllerOptions(),
      onPhase,
    });

    const result = await controller.runTurn(gameState);

    expect(result.state.turn).toBe(1);
    expect(result.phaseLog).toContain(TurnPhase.UpdateStats);
  });

  it('should run pipeline with registered systems', async () => {
    const onPhase = () => {
      // Test hook implementation
    };

    controller = new TurnController(playerQ, pipeline, {
      ...createDefaultTurnControllerOptions(),
      onPhase,
    });

    const result = await controller.runTurn(gameState);

    expect(result.state.turn).toBe(1);
    expect(result.phaseLog).toContain(TurnPhase.UpdateStats);
  });

  it('should require UpdatePipeline in constructor', () => {
    expect(() => {
      new TurnController(
        playerQ,
        null as unknown as UpdatePipeline,
        createDefaultTurnControllerOptions(),
      );
    }).toThrow('UpdatePipeline is required');
  });
});
