import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createDefaultTurnControllerOptions } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController.endTurn', () => {
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

  it('should emit End phase with correct turn number', async () => {
    const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];
    const onPhase = (phase: TurnPhase, detail?: unknown) => {
      phaseLog.push({ phase, detail });
    };

    const controller = new TurnController(playerQ, pipeline, {
      ...createDefaultTurnControllerOptions(),
      onPhase,
    });

    await controller.runTurn(gameState);

    const endPhase = phaseLog.find(p => p.phase === TurnPhase.End);
    expect(endPhase).toBeDefined();
    expect(endPhase?.detail).toMatchObject({ turn: 1 });
  });

  it('should emit End phase with incremented turn number after full turn', async () => {
    const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];
    const onPhase = (phase: TurnPhase, detail?: unknown) => {
      phaseLog.push({ phase, detail });
    };

    const controllerWithHook = new TurnController(playerQ, pipeline, {
      ...createDefaultTurnControllerOptions(),
      onPhase,
    });

    // Run first turn
    const result1 = await controllerWithHook.runTurn(gameState);
    expect(result1.state.turn).toBe(1);

    // Run second turn
    const result2 = await controllerWithHook.runTurn(result1.state);
    expect(result2.state.turn).toBe(2);

    // Check that End phase was called with correct turn numbers
    const endPhases = phaseLog.filter(p => p.phase === TurnPhase.End);
    expect(endPhases).toHaveLength(2);
    expect(endPhases[0]?.detail).toMatchObject({ turn: 1 });
    expect(endPhases[1]?.detail).toMatchObject({ turn: 2 });
  });

  it('should work without onPhase hook', async () => {
    const controllerWithoutHook = new TurnController(
      playerQ,
      pipeline,
      createDefaultTurnControllerOptions(),
    );

    const result = await controllerWithoutHook.runTurn(gameState);
    expect(result.state.turn).toBe(1);
    expect(result.phaseLog).toContain(TurnPhase.End);
  });
});
