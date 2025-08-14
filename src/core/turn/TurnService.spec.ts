import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';

import { PlayerActionQueue } from './PlayerActionQueue';
import { createMockGameState } from './testHelpers';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { createTurnController } from './TurnService';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnService', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createMockGameState();
  });

  describe('createTurnController', () => {
    it('returns instances of all required components', () => {
      const { controller, playerQ, pipeline } = createTurnController(mockState);

      expect(controller).toBeInstanceOf(TurnController);
      expect(playerQ).toBeInstanceOf(PlayerActionQueue);
      expect(pipeline).toBeInstanceOf(UpdatePipeline);
    });

    it('wires components correctly', () => {
      const { controller } = createTurnController(mockState);

      // Test that the controller can run a turn
      expect(() => controller.runTurn(mockState)).not.toThrow();
    });

    it('accepts optional onPhase hook', () => {
      const onPhase = () => {
        // Test hook implementation
      };

      const { controller } = createTurnController(mockState, { onPhase });

      expect(controller).toBeInstanceOf(TurnController);
    });

    it('works without onPhase hook', () => {
      const { controller } = createTurnController(mockState);

      expect(controller).toBeInstanceOf(TurnController);
    });
  });

  describe('controller.runTurn works', () => {
    it('can execute a turn with the created controller', async () => {
      const { controller } = createTurnController(mockState);

      const result = await controller.runTurn(mockState);

      expect(result.state.turn).toBe(1);
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
    });
  });

  describe('hooks fire', () => {
    it('calls onPhase hook when provided', async () => {
      const phaseLog: Array<{ phase: TurnPhase; detail?: unknown }> = [];
      const onPhase = (phase: TurnPhase, detail?: unknown) => {
        phaseLog.push({ phase, detail });
      };

      const { controller } = createTurnController(mockState, { onPhase });

      await controller.runTurn(mockState);

      expect(phaseLog.length).toBeGreaterThan(0);
      expect(phaseLog.some(p => p.phase === TurnPhase.PlayerAction)).toBe(true);
    });

    it('does not call onPhase hook when not provided', async () => {
      const { controller } = createTurnController(mockState);

      const result = await controller.runTurn(mockState);

      expect(result.state.turn).toBe(1);
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
    });
  });
});
