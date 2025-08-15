import { describe, it, expect } from 'vitest';

import type { CooldownState } from './Cooldown';
import {
  shouldSkipCooldown,
  markCooldown,
  createCooldownKey,
  clearExpiredCooldowns,
} from './Cooldown';

describe('Cooldown', () => {
  describe('createCooldownKey', () => {
    it('should create correct cooldown key format', () => {
      expect(createCooldownKey('riverdale', 'fish')).toBe('riverdale:fish');
      expect(createCooldownKey('forestburg', 'wood')).toBe('forestburg:wood');
    });
  });

  describe('shouldSkipCooldown', () => {
    it('should return false when no cooldown is active', () => {
      const cd: CooldownState = {};
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 5)).toBe(false);
    });

    it('should return true when cooldown is active', () => {
      const cd: CooldownState = { 'riverdale:fish': 6 };
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 5)).toBe(true);
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 6)).toBe(true);
    });

    it('should return false when cooldown has expired', () => {
      const cd: CooldownState = { 'riverdale:fish': 6 };
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 7)).toBe(false);
    });

    it('should respect cooldown expiration', () => {
      const cd: CooldownState = { 'riverdale:fish': 8 };
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 7)).toBe(true);
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 8)).toBe(true);
      expect(shouldSkipCooldown(cd, 'riverdale:fish', 9)).toBe(false);
    });
  });

  describe('markCooldown', () => {
    it('should mark cooldown for specified key', () => {
      const cd: CooldownState = {};
      markCooldown(cd, 'riverdale:fish', 5);
      expect(cd['riverdale:fish']).toBe(6); // 5 + 1 (default interval)
    });

    it('should respect custom interval', () => {
      const cd: CooldownState = {};
      markCooldown(cd, 'riverdale:fish', 5, 3);
      expect(cd['riverdale:fish']).toBe(8); // 5 + 3
    });

    it('should overwrite existing cooldown', () => {
      const cd: CooldownState = { 'riverdale:fish': 10 };
      markCooldown(cd, 'riverdale:fish', 5);
      expect(cd['riverdale:fish']).toBe(6);
    });
  });

  describe('clearExpiredCooldowns', () => {
    it('should remove expired cooldowns', () => {
      const cd: CooldownState = {
        'riverdale:fish': 5, // expired at turn 6
        'forestburg:wood': 8, // active until turn 9
        'ironforge:iron': 3, // expired at turn 4
      };

      clearExpiredCooldowns(cd, 6);

      expect(cd['riverdale:fish']).toBeUndefined();
      expect(cd['forestburg:wood']).toBe(8);
      expect(cd['ironforge:iron']).toBeUndefined();
    });

    it('should keep active cooldowns', () => {
      const cd: CooldownState = {
        'riverdale:fish': 8,
        'forestburg:wood': 10,
      };

      clearExpiredCooldowns(cd, 6);

      expect(cd['riverdale:fish']).toBe(8);
      expect(cd['forestburg:wood']).toBe(10);
    });

    it('should handle empty cooldown state', () => {
      const cd: CooldownState = {};
      clearExpiredCooldowns(cd, 5);
      expect(cd).toEqual({});
    });
  });

  describe('integration scenarios', () => {
    it('should prevent immediate trade reversal', () => {
      const cd: CooldownState = {};
      const currentTurn = 5;

      // Town A trades fish with Town B
      markCooldown(cd, 'townA:fish', currentTurn);

      // Same turn - should skip due to cooldown
      expect(shouldSkipCooldown(cd, 'townA:fish', currentTurn)).toBe(true);

      // Next turn - should still skip due to cooldown
      expect(shouldSkipCooldown(cd, 'townA:fish', currentTurn + 1)).toBe(true);

      // Turn after cooldown expires - should allow trade
      expect(shouldSkipCooldown(cd, 'townA:fish', currentTurn + 2)).toBe(false);
    });

    it('should allow different goods for same town', () => {
      const cd: CooldownState = {};
      const currentTurn = 5;

      // Town A trades fish
      markCooldown(cd, 'townA:fish', currentTurn);

      // Town A should still be able to trade wood
      expect(shouldSkipCooldown(cd, 'townA:wood', currentTurn)).toBe(false);
    });

    it('should allow different towns to trade same good', () => {
      const cd: CooldownState = {};
      const currentTurn = 5;

      // Town A trades fish
      markCooldown(cd, 'towndale:fish', currentTurn);

      // Town B should still be able to trade fish
      expect(shouldSkipCooldown(cd, 'townB:fish', currentTurn)).toBe(false);
    });
  });

  describe('TurnController scenario test', () => {
    it('should simulate the exact scenario from TurnController test', () => {
      const cd: CooldownState = {};
      const turn1 = 1;
      const turn2 = 2;

      // Turn 1: Forestburg buys fish from Riverdale
      // This should mark cooldown for Forestburg:fish
      markCooldown(cd, 'forestburg:fish', turn1);

      // Turn 2: Forestburg should be blocked from buying fish again
      expect(shouldSkipCooldown(cd, 'forestburg:fish', turn2)).toBe(true);

      // Turn 3: Cooldown should be expired
      expect(shouldSkipCooldown(cd, 'forestburg:fish', 3)).toBe(false);

      // Verify cooldown state
      expect(cd['forestburg:fish']).toBe(2); // expires at turn 2
    });
  });
});
