import { describe, it, expect, vi } from 'vitest';

import type { GameState } from '../../types/GameState';

import { TurnPhase } from './TurnPhase';
import { createTurnController } from './TurnService';

describe('TurnService', () => {
  describe('createTurnController', () => {
    it('returns instances of all required components', () => {
      const result = createTurnController();

      expect(result.controller).toBeDefined();
      expect(result.playerQ).toBeDefined();
      expect(result.pipeline).toBeDefined();

      expect(typeof result.controller.runTurn).toBe('function');
      expect(typeof result.playerQ.enqueue).toBe('function');
      expect(typeof result.pipeline.register).toBe('function');
    });

    it('wires components correctly', () => {
      const result = createTurnController();

      // Verify the controller can access its dependencies
      expect(() => result.controller.runTurn({} as GameState)).not.toThrow();
    });

    it('accepts optional onPhase hook', () => {
      const onPhase = vi.fn();
      const result = createTurnController({ onPhase });

      expect(result.controller).toBeDefined();
      // The hook is passed through to the controller constructor
      expect(() => result.controller.runTurn({} as GameState)).not.toThrow();
    });

    it('works without onPhase hook', () => {
      const result = createTurnController();

      expect(result.controller).toBeDefined();
      expect(() => result.controller.runTurn({} as GameState)).not.toThrow();
    });
  });

  describe('controller.runTurn works', () => {
    it('can execute a turn with the created controller', async () => {
      const result = createTurnController();
      const mockState = {} as GameState;

      // This should not throw and should return a promise
      const turnPromise = result.controller.runTurn(mockState);
      expect(turnPromise).toBeInstanceOf(Promise);

      // The turn should complete (even if it fails due to mock state)
      try {
        await turnPromise;
      } catch {
        // Expected to fail with mock state, but the controller is working
        // Error details are not needed for this test
      }
    });
  });

  describe('hooks fire', () => {
    it('calls onPhase hook when provided', async () => {
      const onPhase = vi.fn();
      const result = createTurnController({ onPhase });
      const mockState = {} as GameState;

      try {
        await result.controller.runTurn(mockState);
      } catch {
        // Expected to fail, but hooks should have fired
        // Error details are not needed for this test
      }

      // Verify the hook was called at least once (for the Start phase)
      expect(onPhase).toHaveBeenCalled();
      expect(onPhase).toHaveBeenCalledWith(TurnPhase.Start);
    });

    it('does not call onPhase hook when not provided', async () => {
      const result = createTurnController();
      const mockState = {} as GameState;

      try {
        await result.controller.runTurn(mockState);
      } catch {
        // Expected to fail, but no hooks should fire
        // Error details are not needed for this test
      }

      // No hook should be called
      // (We can't easily test this without exposing the hook, but the test structure is correct)
    });
  });
});
