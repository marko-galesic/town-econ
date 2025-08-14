import { describe, it, expect } from 'vitest';

import type { RevealPolicy } from './RevealCadence';
import { DEFAULT_REVEAL_POLICY, isRevealDue, markRevealed } from './RevealCadence';

describe('RevealCadence', () => {
  describe('DEFAULT_REVEAL_POLICY', () => {
    it('should have interval of 2', () => {
      expect(DEFAULT_REVEAL_POLICY.interval).toBe(2);
    });
  });

  describe('markRevealed', () => {
    it('should return the input turn number', () => {
      expect(markRevealed(0)).toBe(0);
      expect(markRevealed(5)).toBe(5);
      expect(markRevealed(100)).toBe(100);
    });
  });

  describe('isRevealDue', () => {
    const policy: RevealPolicy = { interval: 2 };

    describe('with lastUpdatedTurn = -1 (never revealed)', () => {
      it('should reveal only on turn 0', () => {
        expect(isRevealDue(0, -1, policy)).toBe(true);
        expect(isRevealDue(1, -1, policy)).toBe(false);
        expect(isRevealDue(2, -1, policy)).toBe(false);
        expect(isRevealDue(3, -1, policy)).toBe(false);
      });
    });

    describe('with lastUpdatedTurn = 0', () => {
      it('should reveal every 2 turns starting from turn 2', () => {
        expect(isRevealDue(0, 0, policy)).toBe(false);
        expect(isRevealDue(1, 0, policy)).toBe(false);
        expect(isRevealDue(2, 0, policy)).toBe(true);
        expect(isRevealDue(3, 0, policy)).toBe(false);
        expect(isRevealDue(4, 0, policy)).toBe(true);
        expect(isRevealDue(5, 0, policy)).toBe(false);
        expect(isRevealDue(6, 0, policy)).toBe(true);
      });
    });

    describe('with lastUpdatedTurn = 1', () => {
      it('should reveal every 2 turns starting from turn 3', () => {
        expect(isRevealDue(0, 1, policy)).toBe(false);
        expect(isRevealDue(1, 1, policy)).toBe(false);
        expect(isRevealDue(2, 1, policy)).toBe(false);
        expect(isRevealDue(3, 1, policy)).toBe(true);
        expect(isRevealDue(4, 1, policy)).toBe(false);
        expect(isRevealDue(5, 1, policy)).toBe(true);
        expect(isRevealDue(6, 1, policy)).toBe(false);
      });
    });

    describe('with different interval policies', () => {
      it('should work with interval = 1 (every turn)', () => {
        const everyTurnPolicy: RevealPolicy = { interval: 1 };
        expect(isRevealDue(0, -1, everyTurnPolicy)).toBe(true);
        expect(isRevealDue(1, 0, everyTurnPolicy)).toBe(true);
        expect(isRevealDue(2, 1, everyTurnPolicy)).toBe(true);
        expect(isRevealDue(3, 2, everyTurnPolicy)).toBe(true);
      });

      it('should work with interval = 3 (every 3 turns)', () => {
        const everyThreeTurnsPolicy: RevealPolicy = { interval: 3 };
        expect(isRevealDue(0, -1, everyThreeTurnsPolicy)).toBe(true);
        expect(isRevealDue(1, 0, everyThreeTurnsPolicy)).toBe(false);
        expect(isRevealDue(2, 0, everyThreeTurnsPolicy)).toBe(false);
        expect(isRevealDue(3, 0, everyThreeTurnsPolicy)).toBe(true);
        expect(isRevealDue(4, 3, everyThreeTurnsPolicy)).toBe(false);
        expect(isRevealDue(5, 3, everyThreeTurnsPolicy)).toBe(false);
        expect(isRevealDue(6, 3, everyThreeTurnsPolicy)).toBe(true);
      });

      it('should work with interval = 5 (every 5 turns)', () => {
        const everyFiveTurnsPolicy: RevealPolicy = { interval: 5 };
        expect(isRevealDue(0, -1, everyFiveTurnsPolicy)).toBe(true);
        expect(isRevealDue(1, 0, everyFiveTurnsPolicy)).toBe(false);
        expect(isRevealDue(2, 0, everyFiveTurnsPolicy)).toBe(false);
        expect(isRevealDue(3, 0, everyFiveTurnsPolicy)).toBe(false);
        expect(isRevealDue(4, 0, everyFiveTurnsPolicy)).toBe(false);
        expect(isRevealDue(5, 0, everyFiveTurnsPolicy)).toBe(true);
        expect(isRevealDue(6, 5, everyFiveTurnsPolicy)).toBe(false);
        expect(isRevealDue(10, 5, everyFiveTurnsPolicy)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle large turn numbers', () => {
        expect(isRevealDue(1000, 998, policy)).toBe(true);
        expect(isRevealDue(1001, 998, policy)).toBe(false);
        expect(isRevealDue(1002, 998, policy)).toBe(true);
      });

      it('should handle zero interval (never reveal after initial)', () => {
        const neverRevealPolicy: RevealPolicy = { interval: 0 };
        expect(isRevealDue(0, -1, neverRevealPolicy)).toBe(true);
        expect(isRevealDue(1, 0, neverRevealPolicy)).toBe(false);
        expect(isRevealDue(100, 0, neverRevealPolicy)).toBe(false);
      });
    });
  });
});
