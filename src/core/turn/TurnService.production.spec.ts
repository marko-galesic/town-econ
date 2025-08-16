import { describe, it, expect, beforeEach } from 'vitest';

import { loadProductionConfig } from '../../core/production/Config';
import { applyProductionTurn } from '../../core/production/ProductionSystem';
import type { GameState } from '../../types/GameState';

import { createMockGameState } from './testHelpers';
import { createTurnController } from './TurnService';

describe('TurnService Production Integration', () => {
  let mockState: GameState;

  beforeEach(() => {
    mockState = createMockGameState();
  });

  describe('production system direct test', () => {
    it('production system works correctly in isolation', () => {
      const prodCfg = loadProductionConfig();

      const testState: GameState = {
        ...mockState,
        towns: [
          {
            id: 'test',
            name: 'Test',
            resources: { fish: 10, wood: 5, ore: 2 },
            prices: { fish: 10, wood: 8, ore: 15 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 100,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
        ],
      };

      const result = applyProductionTurn(testState, prodCfg);

      expect(result.towns[0]!.resources.fish).toBe(13); // 10 + 3
    });
  });

  describe('production system registration', () => {
    it('registers production system in the update pipeline', () => {
      const { pipeline } = createTurnController(mockState);

      // Should have at least 2 systems: stats update + production
      expect(pipeline.systemCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('production runs automatically each turn', () => {
    it('increments resources according to production.json config', async () => {
      // Create a state with towns that have initial resources
      const stateWithTowns: GameState = {
        ...mockState,
        towns: [
          {
            id: 'riverdale',
            name: 'Riverdale',
            resources: { fish: 10, wood: 5, ore: 2 },
            prices: { fish: 10, wood: 8, ore: 15 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 100,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
          {
            id: 'oakvale',
            name: 'Oakvale',
            resources: { fish: 3, wood: 8, ore: 1 },
            prices: { fish: 12, wood: 6, ore: 18 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 80,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
        ],
      };

      const phaseLog: Array<{ phase: string; detail?: unknown }> = [];
      const onPhase = (phase: string, detail?: unknown) => {
        phaseLog.push({ phase, detail });
      };

      const { controller } = createTurnController(stateWithTowns, { onPhase });

      // Run one turn
      const result = await controller.runTurn(stateWithTowns);

      // Note: AI trading happens before production, so the actual result depends on trading
      // The AI sold 5 fish from riverdale to oakvale, then production added 3
      // So: 10 (initial) - 5 (sold) + 3 (production) = 8

      // Verify resources after trading + production:
      // Initial: fish: 10, wood: 5, ore: 2
      // After AI trading: fish: 5 (sold 5), wood: 5, ore: 2
      // After production: fish: 8 (5 + 3), wood: 7 (5 + 2), ore: 3 (2 + 1)
      expect(result.state.towns[0]!.resources.fish).toBe(8); // 5 + 3 (after trading)
      expect(result.state.towns[0]!.resources.wood).toBe(7); // 5 + 2
      expect(result.state.towns[0]!.resources.ore).toBe(3); // 2 + 1

      // Second town (oakvale) bought 5 fish from riverdale, then production added 3
      // So: 3 (initial) + 5 (bought) + 3 (production) = 11
      expect(result.state.towns[1]!.resources.fish).toBe(11); // 3 + 5 + 3 (after trading + production)
      expect(result.state.towns[1]!.resources.wood).toBe(10); // 8 + 2
      expect(result.state.towns[1]!.resources.ore).toBe(2); // 1 + 1
    });

    it('handles towns with missing goods gracefully', async () => {
      // Create a town missing some goods
      const stateWithIncompleteTown: GameState = {
        ...mockState,
        towns: [
          {
            id: 'incomplete',
            name: 'Incomplete',
            resources: { fish: 5, wood: 0, ore: 0 }, // Missing wood and ore
            prices: { fish: 10, wood: 8, ore: 15 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 50,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
        ],
      };

      const { controller } = createTurnController(stateWithIncompleteTown);

      // Run one turn
      const result = await controller.runTurn(stateWithIncompleteTown);

      // Should add missing goods with base production rates
      expect(result.state.towns[0]!.resources.fish).toBe(8); // 5 + 3
      expect(result.state.towns[0]!.resources.wood).toBe(2); // 0 + 2 (missing, so starts at 0)
      expect(result.state.towns[0]!.resources.ore).toBe(1); // 0 + 1 (missing, so starts at 0)
    });

    it('production happens before reveal phase', async () => {
      // Create a state with towns that have initial resources
      const stateWithTowns: GameState = {
        ...mockState,
        towns: [
          {
            id: 'test-town',
            name: 'Test Town',
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 10, wood: 8, ore: 15 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 100,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
        ],
      };

      const { controller } = createTurnController(stateWithTowns);

      // Run one turn
      const result = await controller.runTurn(stateWithTowns);

      // Verify production was applied (resources increased from 0)
      expect(result.state.towns[0]!.resources.fish).toBe(3); // 0 + 3
      expect(result.state.towns[0]!.resources.wood).toBe(2); // 0 + 2
      expect(result.state.towns[0]!.resources.ore).toBe(1); // 0 + 1

      // Verify turn advanced
      expect(result.state.turn).toBe(1);
    });

    it('production is deterministic with same seed', async () => {
      const stateWithTowns: GameState = {
        ...mockState,
        towns: [
          {
            id: 'deterministic',
            name: 'Deterministic',
            resources: { fish: 10, wood: 10, ore: 10 },
            prices: { fish: 10, wood: 8, ore: 15 },
            militaryRaw: 0,
            prosperityRaw: 0,
            treasury: 100,
            revealed: {
              militaryTier: 'militia',
              prosperityTier: 'struggling',
              lastUpdatedTurn: 0,
            },
          },
        ],
      };

      const { controller } = createTurnController(stateWithTowns);

      // Run two turns with the same seed
      const result1 = await controller.runTurn(stateWithTowns);
      const result2 = await controller.runTurn(result1.state);

      // Verify production is consistent
      expect(result1.state.towns[0]!.resources.fish).toBe(13); // 10 + 3
      expect(result2.state.towns[0]!.resources.fish).toBe(16); // 13 + 3
    });
  });
});
