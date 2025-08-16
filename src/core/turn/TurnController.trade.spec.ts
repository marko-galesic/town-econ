import { describe, it, expect, beforeEach } from 'vitest';

import { initGameState } from '../initGameState';
import { loadPriceCurves } from '../pricing/Config';
import { createLogRatioPriceMath } from '../pricing/Curves';
import type { TradeRequest } from '../trade/TradeTypes';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhaseError } from './TurnErrors';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController - Trade Actions', () => {
  let controller: TurnController;
  let playerQ: PlayerActionQueue;
  let pipeline: UpdatePipeline;
  let gameState: ReturnType<typeof initGameState>;

  let phaseLog: Array<{ phase: TurnPhase; detail?: unknown }>;

  beforeEach(() => {
    gameState = initGameState();
    playerQ = new PlayerActionQueue();
    pipeline = new UpdatePipeline();

    phaseLog = [];
    const onPhase = (phase: TurnPhase, detail?: unknown) => {
      phaseLog.push({ phase, detail });
    };

    controller = new TurnController(playerQ, pipeline, {
      goods: gameState.goods,
      aiProfiles: {
        greedy: {
          id: 'greedy',
          mode: 'greedy',
          weights: { priceSpread: 0.8, prosperity: 0.15, military: 0.05 },
          maxTradesPerTurn: 1,
          maxQuantityPerTrade: 5,
        },
      },
      playerTownId: 'riverdale',
      onPhase,
      priceCurves: loadPriceCurves(),
      priceMath: createLogRatioPriceMath(),
    });
  });

  describe('Trade Action Processing', () => {
    it('should process a queued trade action and update state', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      // Create a valid trade request with matching price
      const tradeRequest: TradeRequest = {
        fromTownId: gameState.towns[0]!.id, // Riverdale
        toTownId: gameState.towns[1]!.id, // Forestburg
        goodId: 'fish',
        quantity: 5,
        side: 'buy',
        pricePerUnit: 4, // Forestburg quotes 4 for fish
      };

      // Enqueue the trade action
      playerQ.enqueue({ type: 'trade', payload: tradeRequest });

      // Run the turn
      const result = await controller.runTurn(gameState);

      // Verify state changes
      expect(result.state).not.toBe(gameState); // State should be updated
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);

      // Verify phase callback was called with action and result
      const playerActionPhase = phaseLog.find(p => p.phase === TurnPhase.PlayerAction);
      expect(playerActionPhase).toBeDefined();
      expect(playerActionPhase?.detail).toMatchObject({
        action: { type: 'trade', payload: tradeRequest },
        result: {
          unitPriceApplied: expect.any(Number),
          deltas: expect.objectContaining({
            from: expect.any(Object),
            to: expect.any(Object),
          }),
        },
      });
    });

    it('should preserve phase order when processing trade actions', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      const tradeRequest: TradeRequest = {
        fromTownId: gameState.towns[0]!.id, // Riverdale
        toTownId: gameState.towns[1]!.id, // Forestburg
        goodId: 'wood',
        quantity: 3,
        side: 'sell',
        pricePerUnit: 1, // Forestburg quotes 1 for wood
      };

      playerQ.enqueue({ type: 'trade', payload: tradeRequest });

      const result = await controller.runTurn(gameState);

      // Verify phases execute in correct order
      expect(result.phaseLog).toEqual([
        TurnPhase.Start,
        TurnPhase.PlayerAction,
        TurnPhase.AiActions,
        TurnPhase.UpdateStats,
        TurnPhase.End,
      ]);
    });

    it('should handle multiple turns with trade actions', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      const tradeRequest1: TradeRequest = {
        fromTownId: gameState.towns[0]!.id, // Riverdale
        toTownId: gameState.towns[1]!.id, // Forestburg
        goodId: 'fish',
        quantity: 2,
        side: 'buy',
        pricePerUnit: 4, // Forestburg quotes 4 for fish
      };

      const tradeRequest2: TradeRequest = {
        fromTownId: gameState.towns[1]!.id, // Forestburg
        toTownId: gameState.towns[0]!.id, // Riverdale
        goodId: 'ore',
        quantity: 1,
        side: 'sell',
        pricePerUnit: 5, // Riverdale quotes 5 for ore
      };

      // First turn
      playerQ.enqueue({ type: 'trade', payload: tradeRequest1 });
      const result1 = await controller.runTurn(gameState);
      expect(result1.state.turn).toBe(1);

      // Second turn
      playerQ.enqueue({ type: 'trade', payload: tradeRequest2 });
      const result2 = await controller.runTurn(result1.state);
      expect(result2.state.turn).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw TurnPhaseError when trade validation fails', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      // Create an invalid trade request (negative quantity)
      const invalidTradeRequest: TradeRequest = {
        fromTownId: gameState.towns[0]!.id,
        toTownId: gameState.towns[1]!.id,
        goodId: 'fish',
        quantity: -5, // Invalid: negative quantity
        side: 'buy',
        pricePerUnit: 10,
      };

      playerQ.enqueue({ type: 'trade', payload: invalidTradeRequest });

      // Should throw TurnPhaseError with PlayerAction phase
      await expect(controller.runTurn(gameState)).rejects.toThrow(TurnPhaseError);

      try {
        await controller.runTurn(gameState);
      } catch (error) {
        if (error instanceof TurnPhaseError) {
          expect(error.phase).toBe(TurnPhase.PlayerAction);
          expect(error.cause).toBeDefined();
        } else {
          throw error;
        }
      }
    });

    it('should throw TurnPhaseError when trade execution fails', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      // Create a trade request that might fail during execution
      // (e.g., insufficient resources)
      const tradeRequest: TradeRequest = {
        fromTownId: gameState.towns[0]!.id,
        toTownId: gameState.towns[1]!.id,
        goodId: 'fish',
        quantity: 999999, // Very large quantity that might exceed available resources
        side: 'buy',
        pricePerUnit: 10,
      };

      playerQ.enqueue({ type: 'trade', payload: tradeRequest });

      // Should throw TurnPhaseError if trade execution fails
      await expect(controller.runTurn(gameState)).rejects.toThrow(TurnPhaseError);
    });
  });

  describe('No Action Handling', () => {
    it('should handle empty queue with no action', async () => {
      // Don't enqueue any actions
      const result = await controller.runTurn(gameState);

      // Should still complete all phases
      expect(result.phaseLog).toContain(TurnPhase.PlayerAction);
      // Turn is incremented even for 'none' action, so state will be different
      expect(result.state.turn).toBe(1);

      // Verify phase callback was called with 'none' action
      const playerActionPhase = phaseLog.find(p => p.phase === TurnPhase.PlayerAction);
      expect(playerActionPhase?.detail).toMatchObject({
        action: { type: 'none' },
      });
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original game state', async () => {
      // Ensure we have at least 2 towns
      expect(gameState.towns.length).toBeGreaterThanOrEqual(2);

      const originalState = { ...gameState };
      const originalTowns = gameState.towns.map(town => ({ ...town }));

      const tradeRequest: TradeRequest = {
        fromTownId: gameState.towns[0]!.id,
        toTownId: gameState.towns[1]!.id,
        goodId: 'fish',
        quantity: 5,
        side: 'buy',
        pricePerUnit: 4, // Forestburg quotes 4 for fish
      };

      playerQ.enqueue({ type: 'trade', payload: tradeRequest });

      const result = await controller.runTurn(gameState);

      // Original state should remain unchanged
      expect(gameState).toEqual(originalState);
      expect(gameState.towns).toEqual(originalTowns);

      // Result state should be different
      expect(result.state).not.toBe(gameState);
      expect(result.state.towns).not.toBe(gameState.towns);
    });
  });
});
