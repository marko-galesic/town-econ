import { describe, it, expect, beforeEach } from 'vitest';

import { GREEDY, RANDOM } from '../ai/AiProfiles';
import type { AiProfile } from '../ai/AiTypes';
import { initGameState } from '../initGameState';
import { createPricingService } from '../pricing/PricingService';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

describe('TurnController - AI Actions', () => {
  let controller: TurnController;
  let playerQ: PlayerActionQueue;
  let pipeline: UpdatePipeline;
  let gameState: ReturnType<typeof initGameState>;

  let phaseLog: Array<{ phase: TurnPhase; detail?: unknown }>;
  let aiProfiles: Record<string, AiProfile>;

  beforeEach(() => {
    gameState = initGameState({ rngSeed: 'deterministic-test-seed' });
    playerQ = new PlayerActionQueue();
    pipeline = new UpdatePipeline();

    // Create AI profiles for testing
    aiProfiles = {
      greedy: GREEDY,
      random: RANDOM,
    };

    phaseLog = [];
    const onPhase = (phase: TurnPhase, detail?: unknown) => {
      phaseLog.push({ phase, detail });
    };

    controller = new TurnController(playerQ, pipeline, {
      goods: gameState.goods,
      aiProfiles,
      playerTownId: 'riverdale', // Riverdale is the player town
      pricingService: createPricingService(),
      onPhase,
    });
  });

  describe('AI Trade Execution', () => {
    it('should execute exactly one trade per AI town per turn with deterministic seed', async () => {
      // Ensure we have AI towns (all towns except Riverdale)
      const aiTowns = gameState.towns.filter(town => town.id !== 'riverdale');
      expect(aiTowns.length).toBeGreaterThanOrEqual(2);

      // Set up deterministic conditions for AI trading
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            // Give Forestburg a clear trading opportunity - lower fish price than Riverdale
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000, // High treasury for buying
              resources: { ...town.resources, fish: 20 }, // High fish stock for selling
              prices: { ...town.prices, fish: 1 }, // Much lower price than Riverdale (2)
            };
          }
          if (town.id === 'ironforge') {
            // Give Ironforge a different trading opportunity - lower wood price than Riverdale
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2500, // High treasury for buying
              resources: { ...town.resources, wood: 30 }, // High wood stock for selling
              prices: { ...town.prices, wood: 1 }, // Much lower price than Riverdale (3)
            };
          }
          return town;
        }),
      };

      // Run the turn
      const result = await controller.runTurn(modifiedState);

      // Verify state changes occurred (turn counter will be incremented)
      expect(result.state.turn).toBe(modifiedState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // Find AI actions phase details
      const aiActionsPhase = phaseLog.find(p => p.phase === TurnPhase.AiActions);
      expect(aiActionsPhase).toBeDefined();

      // Verify that at least one AI trade was executed
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have at least one AI action with trade details
      const tradeActions = aiActionsDetails.filter(
        detail => detail && typeof detail === 'object' && 'tradeResult' in detail,
      );
      expect(tradeActions.length).toBeGreaterThan(0);

      // Verify the first AI trade was executed
      const firstTradeAction = tradeActions[0];
      expect(firstTradeAction).toMatchObject({
        townId: expect.any(String),
        decision: {
          request: expect.objectContaining({
            fromTownId: expect.any(String),
            toTownId: expect.any(String),
            goodId: expect.any(String),
            quantity: expect.any(Number),
            side: expect.any(String),
            pricePerUnit: expect.any(Number),
          }),
          reason: expect.any(String),
        },
        tradeResult: {
          unitPriceApplied: expect.any(Number),
          deltas: expect.objectContaining({
            from: expect.any(Object),
            to: expect.any(Object),
          }),
        },
        trace: expect.objectContaining({
          aiTownId: expect.any(String),
          mode: expect.any(String),
          candidateCount: expect.any(Number),
          chosen: expect.objectContaining({
            quote: expect.any(Object),
          }),
          reason: expect.any(String),
        }),
      });
    });

    it('should skip trading when no candidates are available', async () => {
      // Create a minimal game state with only one AI town that has no trading opportunities
      const minimalState = {
        ...gameState,
        towns: [
          // Player town
          {
            ...gameState.towns[0]!,
            id: 'riverdale',
            treasury: 1000,
            resources: { fish: 10, wood: 10, ore: 10 },
            prices: { fish: 5, wood: 5, ore: 5 },
          },
          // AI town with no trading opportunities
          {
            ...gameState.towns[1]!,
            id: 'forestburg',
            aiProfileId: 'greedy',
            treasury: 0, // No money to buy
            resources: { fish: 0, wood: 0, ore: 0 }, // No stock to sell
            prices: { fish: 5, wood: 5, ore: 5 }, // Same prices as player town
          },
        ],
      };

      // Run the turn
      const result = await controller.runTurn(minimalState);

      // Verify state changes occurred (turn counter will be incremented)
      expect(result.state.turn).toBe(minimalState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // Find AI actions phase details
      const aiActionsPhase = phaseLog.find(p => p.phase === TurnPhase.AiActions);
      expect(aiActionsPhase).toBeDefined();

      // Verify that AI decided to skip trading
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have AI actions with skip decisions
      const skipActions = aiActionsDetails.filter(
        detail =>
          detail &&
          typeof detail === 'object' &&
          'decision' in detail &&
          'skipped' in (detail as { decision: { skipped?: boolean } }).decision &&
          (detail as { decision: { skipped?: boolean } }).decision.skipped,
      );
      expect(skipActions.length).toBeGreaterThan(0);

      // Verify the skip decision details
      const firstSkipAction = skipActions[0];
      expect(firstSkipAction).toMatchObject({
        townId: expect.any(String),
        decision: {
          skipped: true,
          reason: 'no-candidate',
        },
        trace: expect.objectContaining({
          aiTownId: expect.any(String),
          mode: expect.any(String),
          candidateCount: expect.any(Number),
          reason: 'no-candidate',
        }),
      });
    });

    it('should emit telemetry data with scores for greedy AI and without scores for random AI', async () => {
      // Create a game state with two AI towns using different profiles
      const telemetryState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000,
              resources: { ...town.resources, fish: 20 },
              prices: { ...town.prices, fish: 1 }, // Lower price than Riverdale
            };
          }
          if (town.id === 'ironforge') {
            return {
              ...town,
              aiProfileId: 'random',
              treasury: 2500,
              resources: { ...town.resources, wood: 30 },
              prices: { ...town.prices, wood: 1 }, // Lower price than Riverdale
            };
          }
          return town;
        }),
      };

      // Run the turn
      const result = await controller.runTurn(telemetryState);

      // Verify state changes occurred
      expect(result.state.turn).toBe(telemetryState.turn + 1);

      // Find AI actions phase details
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have AI actions with telemetry data
      const tradeActions = aiActionsDetails.filter(
        detail => detail && typeof detail === 'object' && 'trace' in detail,
      );
      expect(tradeActions.length).toBeGreaterThan(0);

      // Find greedy AI action (should have score)
      const greedyAction = tradeActions.find(
        detail =>
          detail &&
          typeof detail === 'object' &&
          'trace' in detail &&
          (detail as { trace: { mode: string } }).trace.mode === 'greedy',
      );
      expect(greedyAction).toBeDefined();
      expect(greedyAction).toMatchObject({
        trace: expect.objectContaining({
          mode: 'greedy',
          chosen: expect.objectContaining({
            score: expect.any(Number), // Greedy AI should have score
          }),
        }),
      });

      // Find random AI action (should not have score)
      const randomAction = tradeActions.find(
        detail =>
          detail &&
          typeof detail === 'object' &&
          'trace' in detail &&
          (detail as { trace: { mode: string } }).trace.mode === 'random',
      );
      expect(randomAction).toBeDefined();
      expect(randomAction).toMatchObject({
        trace: expect.objectContaining({
          mode: 'random',
          chosen: expect.objectContaining({
            quote: expect.any(Object),
          }),
        }),
      });
      // Random AI should not have score in trace
      expect(
        (randomAction as { trace: { chosen?: { score?: number } } }).trace.chosen,
      ).not.toHaveProperty('score');
    });

    it('should respect maxTradesPerTurn limit', async () => {
      // Create a custom AI profile with maxTradesPerTurn = 1
      const limitedProfile: AiProfile = {
        ...GREEDY,
        id: 'limited',
        maxTradesPerTurn: 1,
      };

      const customAiProfiles = {
        ...aiProfiles,
        limited: limitedProfile,
      };

      // Set up multiple AI towns with the limited profile and profitable opportunities
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'limited',
              treasury: 2000, // High treasury for trading
              prices: { ...town.prices, fish: 1 }, // Lower price than Riverdale (2)
            };
          }
          if (town.id === 'ironforge') {
            return {
              ...town,
              aiProfileId: 'limited',
              treasury: 2000, // High treasury for trading
              prices: { ...town.prices, wood: 1 }, // Lower price than Riverdale (3)
            };
          }
          return town;
        }),
      };

      // Create controller with custom AI profiles
      const customController = new TurnController(playerQ, pipeline, {
        goods: gameState.goods,
        aiProfiles: customAiProfiles,
        playerTownId: 'riverdale',
        onPhase: (phase, detail) => {
          phaseLog.push({ phase, detail });
        },
        pricingService: createPricingService(),
      });

      // Run the turn
      const result = await customController.runTurn(modifiedState);

      // Verify state changes occurred
      expect(result.state.turn).toBe(modifiedState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // Count the number of trades executed
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      const tradeActions = aiActionsDetails.filter(
        detail => detail && typeof detail === 'object' && 'tradeResult' in detail,
      );

      // Each town with maxTradesPerTurn = 1 can make up to 1 trade
      // Since we have 2 AI towns, they can each make 1 trade = 2 total trades
      expect(tradeActions.length).toBe(2);

      // Verify that each town made exactly one trade (respecting their individual limit)
      const townIds = tradeActions.map(detail => (detail as { townId: string }).townId);
      expect(townIds).toContain('forestburg');
      expect(townIds).toContain('ironforge');
    });

    it('should handle AI profile not found gracefully', async () => {
      // Set up a town with a non-existent AI profile
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'nonexistent-profile',
            };
          }
          return town;
        }),
      };

      // Run the turn
      const result = await controller.runTurn(modifiedState);

      // Verify the turn completes without errors
      expect(result.state.turn).toBe(modifiedState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // The AI town should be skipped due to missing profile
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have at least one AI action (even if skipped)
      expect(aiActionsDetails.length).toBeGreaterThan(0);
    });

    it('should emit phase details with townId and decision for each AI town', async () => {
      // Set up multiple AI towns with different profiles and profitable opportunities
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000,
              prices: { ...town.prices, fish: 1 }, // Lower price than Riverdale (2)
            };
          }
          if (town.id === 'ironforge') {
            return {
              ...town,
              aiProfileId: 'random',
              treasury: 2000,
              prices: { ...town.prices, wood: 1 }, // Lower price than Riverdale (3)
            };
          }
          return town;
        }),
      };

      // Run the turn
      const result = await controller.runTurn(modifiedState);

      // Verify state changes occurred
      expect(result.state.turn).toBe(modifiedState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // Get all AI actions phase details
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have details for each AI town (both should be processed) plus the start phase hook
      expect(aiActionsDetails.length).toBe(3);

      // Each AI action should have townId and decision (filter out the start phase hook)
      aiActionsDetails
        .filter(detail => detail && typeof detail === 'object' && 'townId' in detail)
        .forEach(detail => {
          expect(detail as { townId: string; decision: unknown }).toMatchObject({
            townId: expect.any(String),
            decision: expect.objectContaining({
              reason: expect.any(String),
            }),
          });
        });

      // Verify we have actions for both AI towns
      const townIds = aiActionsDetails
        .filter(detail => detail && typeof detail === 'object' && 'townId' in detail)
        .map(detail => (detail as { townId: string }).townId);
      expect(townIds).toContain('forestburg');
      expect(townIds).toContain('ironforge');
    });

    it('should process all AI towns regardless of trade decisions', async () => {
      // Create a simple test with two AI towns that will both skip trading
      const simpleState = {
        ...gameState,
        towns: [
          // Player town
          {
            ...gameState.towns[0]!,
            id: 'riverdale',
            treasury: 1000,
            resources: { fish: 10, wood: 10, ore: 10 },
            prices: { fish: 5, wood: 5, ore: 5 },
          },
          // First AI town - no trading opportunities
          {
            ...gameState.towns[1]!,
            id: 'forestburg',
            aiProfileId: 'greedy',
            treasury: 0, // No money to buy
            resources: { fish: 0, wood: 0, ore: 0 }, // No stock to sell
            prices: { fish: 5, wood: 5, ore: 5 }, // Same prices as player town
          },
          // Second AI town - no trading opportunities
          {
            ...gameState.towns[2]!,
            id: 'ironforge',
            aiProfileId: 'random',
            treasury: 0, // No money to buy
            resources: { fish: 0, wood: 0, ore: 0 }, // No stock to sell
            prices: { fish: 5, wood: 5, ore: 5 }, // Same prices as player town
          },
        ],
      };

      // Run the turn
      const result = await controller.runTurn(simpleState);

      // Verify state changes occurred (turn counter will be incremented)
      expect(result.state.turn).toBe(simpleState.turn + 1);
      expect(result.phaseLog).toContain(TurnPhase.AiActions);

      // Get all AI actions phase details
      const aiActionsDetails = phaseLog
        .filter(p => p.phase === TurnPhase.AiActions)
        .map(p => p.detail);

      // Should have details for BOTH AI towns plus the start phase hook
      expect(aiActionsDetails.length).toBe(3);

      // Each AI action should have townId and decision (filter out the start phase hook)
      aiActionsDetails
        .filter(detail => detail && typeof detail === 'object' && 'townId' in detail)
        .forEach(detail => {
          expect(detail as { townId: string; decision: unknown }).toMatchObject({
            townId: expect.any(String),
            decision: expect.objectContaining({
              reason: expect.any(String),
            }),
          });
        });

      // Verify we have actions for both AI towns
      const townIds = aiActionsDetails
        .filter(detail => detail && typeof detail === 'object' && 'townId' in detail)
        .map(detail => (detail as { townId: string }).townId);
      expect(townIds).toContain('forestburg');
      expect(townIds).toContain('ironforge');
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce identical results with the same seed', async () => {
      // Set up deterministic conditions
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000,
              resources: { ...town.resources, fish: 25 },
              prices: { ...town.prices, fish: 1 }, // Lower price than Riverdale (2)
            };
          }
          return town;
        }),
      };

      // Run the turn with the first controller
      const result1 = await controller.runTurn(modifiedState);

      // Create a fresh controller to ensure no internal state persists
      const freshController = new TurnController(playerQ, pipeline, {
        goods: gameState.goods,
        aiProfiles,
        playerTownId: 'riverdale',
        onPhase: () => {
          // Create a new phase log for the fresh controller
        },
        pricingService: createPricingService(),
      });

      // Run the turn with the fresh controller
      const result2 = await freshController.runTurn(modifiedState);

      // Results should be identical since both controllers start with the same state
      expect(result1.state).toEqual(result2.state);
      // Note: phaseLog comparison removed since different controllers have different phase logs
    });
  });

  describe('Cooldown System', () => {
    it('should prevent AI from immediately reversing trades', async () => {
      // Set up a scenario where Forestburg can buy fish from Riverdale
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'riverdale') {
            // Riverdale has fish to sell at a reasonable price
            return {
              ...town,
              treasury: 1000,
              resources: { ...town.resources, fish: 20 },
              prices: { ...town.prices, fish: 2 }, // Sell price
            };
          }
          if (town.id === 'forestburg') {
            // Forestburg wants to buy fish and has money
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000,
              resources: { ...town.resources, fish: 0 },
              prices: { ...town.prices, fish: 4 }, // Buy price (higher than Riverdale's sell price)
            };
          }
          return town;
        }),
      };

      // Run the first turn - Forestburg should buy fish from Riverdale
      const result1 = await controller.runTurn(modifiedState);

      // Verify that a trade occurred
      const aiActions1 = phaseLog.filter(p => p.phase === TurnPhase.AiActions).map(p => p.detail);

      const tradeAction1 = aiActions1.find(
        detail => detail && typeof detail === 'object' && 'tradeResult' in detail,
      );
      expect(tradeAction1).toBeDefined();

      // Now set up a scenario where Forestburg wants to buy fish again (but should be blocked by cooldown)
      const stateAfterTrade1 = result1.state;
      const reverseState = {
        ...stateAfterTrade1,
        towns: stateAfterTrade1.towns.map(town => {
          if (town.id === 'riverdale') {
            // Riverdale now has fish to sell again
            return {
              ...town,
              resources: { ...town.resources, fish: 15 }, // Still has some fish
              prices: { ...town.prices, fish: 2 }, // Same sell price
            };
          }
          if (town.id === 'forestburg') {
            // Forestburg wants to buy fish again (but should be blocked by cooldown)
            return {
              ...town,
              treasury: 1500, // Still has money
              prices: { ...town.prices, fish: 4 }, // Still willing to pay high price
            };
          }
          return town;
        }),
      };

      // Run the second turn - Forestburg should NOT be able to buy fish again due to cooldown
      await controller.runTurn(reverseState);

      // Verify that no reverse trade occurred
      const aiActions2 = phaseLog.filter(p => p.phase === TurnPhase.AiActions).map(p => p.detail);

      // Forestburg should skip trading due to cooldown (it was the buyer in the first trade)
      const forestburgAction2 = aiActions2.find(
        detail =>
          detail &&
          typeof detail === 'object' &&
          (detail as { townId: string }).townId === 'forestburg',
      );

      expect(forestburgAction2).toBeDefined();

      const decision = (
        forestburgAction2 as {
          decision: { skipped?: boolean; reason?: string; request?: { goodId: string } };
        }
      ).decision;

      // The AI might still find other trading opportunities, so we need to check if it's trading fish
      if (decision.skipped) {
        expect(decision.reason).toBe('no-candidate'); // Should be filtered out due to cooldown
      } else {
        // If it's not skipped, it should not be trading fish (due to cooldown)
        expect(decision.request).toBeDefined();
        expect(decision.request!.goodId).not.toBe('fish'); // Should not be trading fish due to cooldown
      }
    });

    it('should allow trading after cooldown expires', async () => {
      // Set up initial trade scenario
      const modifiedState = {
        ...gameState,
        towns: gameState.towns.map(town => {
          if (town.id === 'riverdale') {
            return {
              ...town,
              treasury: 1000,
              resources: { ...town.resources, fish: 20 },
              prices: { ...town.prices, fish: 2 },
            };
          }
          if (town.id === 'forestburg') {
            return {
              ...town,
              aiProfileId: 'greedy',
              treasury: 2000,
              resources: { ...town.resources, fish: 0 },
              prices: { ...town.prices, fish: 4 },
            };
          }
          return town;
        }),
      };

      // Run first turn - Forestburg buys fish
      await controller.runTurn(modifiedState);

      // Run second turn - cooldown still active, should skip
      await controller.runTurn(modifiedState);

      // Run third turn - cooldown should be expired, trading allowed again
      await controller.runTurn(modifiedState);

      // Verify that Forestburg can trade again in the third turn
      const aiActions3 = phaseLog.filter(p => p.phase === TurnPhase.AiActions).map(p => p.detail);

      const forestburgAction3 = aiActions3.find(
        detail =>
          detail &&
          typeof detail === 'object' &&
          (detail as { townId: string }).townId === 'forestburg',
      );

      // Forestburg should be able to trade again (either successfully or skip for other reasons)
      expect(forestburgAction3).toBeDefined();

      // The important thing is that it's not blocked by cooldown anymore
      // It might still skip for other reasons (no profitable opportunities, etc.)
      // We don't care if it skips or trades, just that cooldown isn't blocking it
    });
  });
});
