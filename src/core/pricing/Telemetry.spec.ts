import { describe, it, expect, vi } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import { createPricingService } from './PricingService';
import type { PriceChangeTrace } from './Telemetry';

describe('Price Change Telemetry', () => {
  // Mock game state with a simple town and good
  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town1',
        name: 'Test Town 1',
        resources: { fish: 50, wood: 30, ore: 20 },
        prices: { fish: 10, wood: 15, ore: 25 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 100,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Test Town 2',
        resources: { fish: 40, wood: 35, ore: 15 },
        prices: { fish: 12, wood: 14, ore: 30 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 150,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
    ],
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 1, militaryDelta: 0 },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 0, militaryDelta: 1 },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 1, militaryDelta: 1 },
      },
    },
  };

  // Mock validated trade
  const mockTrade: ValidatedTrade = {
    goodId: 'fish',
    qty: 10,
    from: mockGameState.towns[0]!,
    to: mockGameState.towns[1]!,
    unitPrice: 12,
    side: 'sell',
  };

  describe('Post-Trade Telemetry', () => {
    it('should emit telemetry for both towns when trade occurs', () => {
      const traces: PriceChangeTrace[] = [];
      const pricingService = createPricingService();

      pricingService.afterTrade(mockGameState, mockTrade, {
        onTrace: trace => traces.push(trace),
      });

      // Should have 2 traces (one for each town)
      expect(traces).toHaveLength(2);

      // Verify town1 trace
      const town1Trace = traces.find(t => t.townId === 'town1');
      expect(town1Trace).toBeDefined();
      expect(town1Trace?.goodId).toBe('fish');
      expect(town1Trace?.oldPrice).toBe(10);
      expect(town1Trace?.cause).toBe('post-trade');
      expect(town1Trace?.prosperityTier).toBe('modest');
      expect(town1Trace?.prosperityFactor).toBe(1.0);
      expect(town1Trace?.stock).toBe(50);
      expect(town1Trace?.elasticity).toBeDefined();
      expect(town1Trace?.target).toBeDefined();

      // Verify town2 trace
      const town2Trace = traces.find(t => t.townId === 'town2');
      expect(town2Trace).toBeDefined();
      expect(town2Trace?.goodId).toBe('fish');
      expect(town2Trace?.oldPrice).toBe(12);
      expect(town2Trace?.cause).toBe('post-trade');
      expect(town2Trace?.prosperityTier).toBe('prosperous');
      expect(town2Trace?.prosperityFactor).toBe(1.1);
      expect(town2Trace?.stock).toBe(40);

      // Verify price progression: oldPrice -> curvePrice -> smoothed -> final
      expect(town1Trace?.oldPrice).toBeLessThanOrEqual(town1Trace?.final!);
      expect(town1Trace?.curvePrice).toBeDefined();
      expect(town1Trace?.smoothed).toBeDefined();
      expect(town1Trace?.final).toBeDefined();
    });

    it('should not emit telemetry when callback is not provided', () => {
      const pricingService = createPricingService();

      // Should not throw or error
      expect(() => {
        pricingService.afterTrade(mockGameState, mockTrade);
      }).not.toThrow();
    });
  });

  describe('Drift Telemetry', () => {
    it('should emit telemetry for price changes during drift', () => {
      const traces: PriceChangeTrace[] = [];
      const pricingService = createPricingService();

      pricingService.perTurnDrift(mockGameState, {
        onTrace: trace => traces.push(trace),
      });

      // Should have traces for towns with price changes
      expect(traces.length).toBeGreaterThan(0);

      // All traces should have 'drift' cause
      traces.forEach(trace => {
        expect(trace.cause).toBe('drift');
        expect(trace.townId).toMatch(/^town\d+$/);
        expect(['fish', 'wood', 'ore']).toContain(trace.goodId);
        expect(trace.oldPrice).toBeGreaterThan(0);
        expect(trace.curvePrice).toBeDefined();
        expect(trace.smoothed).toBeDefined();
        expect(trace.final).toBeDefined();
        expect(trace.stock).toBeGreaterThanOrEqual(0);
        expect(trace.target).toBeGreaterThan(0);
        expect(trace.elasticity).toBeGreaterThan(0);
        expect(['struggling', 'modest', 'prosperous', 'opulent']).toContain(trace.prosperityTier);
        expect(trace.prosperityFactor).toBeGreaterThan(0);
      });
    });

    it('should not emit telemetry when callback is not provided', () => {
      const pricingService = createPricingService();

      // Should not throw or error
      expect(() => {
        pricingService.perTurnDrift(mockGameState);
      }).not.toThrow();
    });
  });

  describe('Telemetry Data Integrity', () => {
    it('should provide meaningful numeric components for explainability', () => {
      const traces: PriceChangeTrace[] = [];
      const pricingService = createPricingService();

      // Trigger both post-trade and drift
      pricingService.afterTrade(mockGameState, mockTrade, {
        onTrace: trace => traces.push(trace),
      });

      pricingService.perTurnDrift(mockGameState, {
        onTrace: trace => traces.push(trace),
      });

      // Verify all traces have meaningful data
      traces.forEach(trace => {
        // Price progression should make sense
        expect(trace.oldPrice).toBeGreaterThan(0);
        expect(trace.final).toBeGreaterThan(0);

        // Stock and target should be reasonable
        expect(trace.stock).toBeGreaterThanOrEqual(0);
        expect(trace.target).toBeGreaterThan(0);

        // Elasticity should be positive
        expect(trace.elasticity).toBeGreaterThan(0);

        // Prosperity factor should match tier
        const expectedFactor =
          trace.prosperityTier === 'struggling'
            ? 0.9
            : trace.prosperityTier === 'modest'
              ? 1.0
              : trace.prosperityTier === 'prosperous'
                ? 1.1
                : 1.2;
        expect(trace.prosperityFactor).toBe(expectedFactor);

        // Cause should be valid
        expect(['post-trade', 'drift']).toContain(trace.cause);
      });
    });

    it('should not affect core pricing logic', () => {
      const pricingService = createPricingService();

      // Get result without telemetry
      const resultWithoutTrace = pricingService.afterTrade(mockGameState, mockTrade);

      // Get result with telemetry
      const resultWithTrace = pricingService.afterTrade(mockGameState, mockTrade, {
        onTrace: vi.fn(),
      });

      // Results should be identical
      expect(resultWithoutTrace).toEqual(resultWithTrace);
    });
  });
});
