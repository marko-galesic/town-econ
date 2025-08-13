import { describe, it, expect } from 'vitest';
import { validateGameState, ValidationError } from './validation';
import type { GameState } from '../types/GameState';

describe('validateGameState', () => {
  const validGameState: GameState = {
    turn: 0,
    version: 1,
    rngSeed: 'abc123',
    towns: [
      {
        id: 'town1',
        name: 'Test Town',
        resources: { fish: 10, wood: 5, ore: 3 },
        prices: { fish: 2, wood: 1, ore: 4 },
        militaryRaw: 15,
        prosperityRaw: 20,
        revealed: {
          militaryTier: 'formidable',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 0
        }
      }
    ],
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: {
          prosperityDelta: 1,
          militaryDelta: 0
        }
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: {
          prosperityDelta: 0,
          militaryDelta: 1
        }
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: {
          prosperityDelta: 2,
          militaryDelta: 2
        }
      }
    }
  };

  it('should validate a correct GameState without throwing', () => {
    expect(() => validateGameState(validGameState)).not.toThrow();
  });

  it('debug: should show what happens when validating validGameState', () => {
    try {
      validateGameState(validGameState);
      console.log('DEBUG - Validation passed successfully');
    } catch (error) {
      const validationError = error as ValidationError;
      console.log('DEBUG - Validation failed with path:', validationError.path);
      console.log('DEBUG - Validation failed with message:', validationError.message);
    }
  });

  describe('missing keys', () => {
    it('should throw with path when turn is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).turn;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Missing required field: turn');
      }
    });

    it('should throw with path when version is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).version;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('version');
        expect(validationError.message).toContain('Missing required field: version');
      }
    });

    it('should throw with path when rngSeed is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).rngSeed;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('rngSeed');
        expect(validationError.message).toContain('Missing required field: rngSeed');
      }
    });

    it('should throw with path when towns is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).towns;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns');
        expect(validationError.message).toContain('Missing required field: towns');
      }
    });

    it('should throw with path when goods is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).goods;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain('Missing required field: goods');
      }
    });
  });

  describe('bad numbers (NaN/Infinity/float)', () => {
    it('should throw with path when turn is NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).turn = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when turn is Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).turn = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when turn is a float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).turn = 1.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when turn is negative', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).turn = -1;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Expected value >= 0');
      }
    });

    it('should throw with path when version is less than 1', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).version = 0;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('version');
        expect(validationError.message).toContain('Expected value >= 1');
      }
    });

    it('should throw with path when town resources contain NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).resources.fish = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources.fish');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town prices contain float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prices.wood = 1.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices.wood');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when town prices contain negative value', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prices.ore = -1;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices.ore');
        expect(validationError.message).toContain('Expected value >= 0');
      }
    });

    it('should throw with path when town resources contain Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).resources.fish = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources.fish');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town resources contain float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).resources.wood = 5.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources.wood');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when town resources contain negative value', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).resources.ore = -3;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources.ore');
        expect(validationError.message).toContain('Expected value >= 0');
      }
    });

    it('should throw with path when town prices contain NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prices.fish = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices.fish');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town prices contain Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prices.wood = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices.wood');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town militaryRaw contains NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).militaryRaw = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].militaryRaw');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town militaryRaw contains Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).militaryRaw = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].militaryRaw');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town militaryRaw contains float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).militaryRaw = 15.7;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].militaryRaw');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when town prosperityRaw contains NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prosperityRaw = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prosperityRaw');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town prosperityRaw contains Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prosperityRaw = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prosperityRaw');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town prosperityRaw contains float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).prosperityRaw = 20.3;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prosperityRaw');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when town lastUpdatedTurn contains NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).revealed.lastUpdatedTurn = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].revealed.lastUpdatedTurn');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town lastUpdatedTurn contains Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).revealed.lastUpdatedTurn = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].revealed.lastUpdatedTurn');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when town lastUpdatedTurn contains float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).revealed.lastUpdatedTurn = 0.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].revealed.lastUpdatedTurn');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when town lastUpdatedTurn contains negative value', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.towns[0] as any).revealed.lastUpdatedTurn = -1;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].revealed.lastUpdatedTurn');
        expect(validationError.message).toContain('Expected value >= 0');
      }
    });

    it('should throw with path when good effects contain Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.prosperityDelta = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.prosperityDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when good effects contain NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.prosperityDelta = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.prosperityDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when good effects contain float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.prosperityDelta = 1.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.prosperityDelta');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when good effects contain float in militaryDelta', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.militaryDelta = 2.7;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.militaryDelta');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when good effects contain Infinity in militaryDelta', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.militaryDelta = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.militaryDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when good effects contain NaN in militaryDelta', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.fish as any).effects.militaryDelta = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects.militaryDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when wood good effects contain float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.wood as any).effects.prosperityDelta = 0.5;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.wood.effects.prosperityDelta');
        expect(validationError.message).toContain('Expected integer');
      }
    });

    it('should throw with path when wood good effects contain Infinity', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.wood as any).effects.militaryDelta = Infinity;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.wood.effects.militaryDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when ore good effects contain NaN', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.ore as any).effects.prosperityDelta = NaN;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.ore.effects.prosperityDelta');
        expect(validationError.message).toContain('Expected finite number');
      }
    });

    it('should throw with path when ore good effects contain float', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState.goods.ore as any).effects.militaryDelta = 2.3;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.ore.effects.militaryDelta');
        expect(validationError.message).toContain('Expected integer');
      }
    });
  });

  describe('unknown good ID in town maps', () => {
    it('should throw with path when town resources missing fish', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.towns[0] as any).resources.fish;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources');
        expect(validationError.message).toContain("Missing required good 'fish'");
      }
    });

    it('should throw with path when town prices missing wood', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.towns[0] as any).prices.wood;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices');
        expect(validationError.message).toContain("Missing required good 'wood'");
      }
    });

    it('should throw with path when town resources missing ore', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.towns[0] as any).resources.ore;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources');
        expect(validationError.message).toContain("Missing required good 'ore'");
      }
    });
  });

  describe('missing required goods', () => {
    it('should throw with path when fish good is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).goods.fish;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain("Missing required good 'fish'");
      }
    });

    it('should throw with path when wood good is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).goods.wood;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain("Missing required good 'wood'");
      }
    });

    it('should throw with path when ore good is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState as any).goods.ore;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain("Missing required good 'ore'");
      }
    });
  });

  describe('type validation', () => {
    it('should throw with path when turn is string', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).turn = '0' as any;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('turn');
        expect(validationError.message).toContain('Expected number');
      }
    });

    it('should throw with path when rngSeed is number', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).rngSeed = 123 as any;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('rngSeed');
        expect(validationError.message).toContain('Expected string');
      }
    });

    it('should throw with path when towns is not array', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).towns = {} as any;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns');
        expect(validationError.message).toContain('Expected array');
      }
    });

    it('should throw with path when goods is not object', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      (invalidState as any).goods = [] as any;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain('Expected object');
      }
    });
  });

  describe('nested validation', () => {
    it('should throw with path when town id is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.towns[0] as any).id;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].id');
        expect(validationError.message).toContain('Missing required field: id');
      }
    });

    it('should throw with path when town revealed object is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.towns[0] as any).revealed;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].revealed');
        expect(validationError.message).toContain('Missing required field: revealed');
      }
    });

    it('should throw with path when good effects object is missing', () => {
      const invalidState = JSON.parse(JSON.stringify(validGameState));
      delete (invalidState.goods.fish as any).effects;

      expect(() => validateGameState(invalidState)).toThrow();
      try {
        validateGameState(invalidState);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods.fish.effects');
        expect(validationError.message).toContain('Missing required field: effects');
      }
    });
  });
});
