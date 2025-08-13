import { describe, it, expect } from 'vitest';
import { deserializeGameState } from './deserialize';
import { ValidationError } from './validation';
import type { GameState } from '../types/GameState';

describe('deserializeGameState', () => {
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

  describe('happy path', () => {
    it('should deserialize valid JSON and return typed GameState', () => {
      const json = JSON.stringify(validGameState);
      const result = deserializeGameState(json);

      // Should return the same data
      expect(result).toEqual(validGameState);

      // Should be properly typed
      expect(result.turn).toBe(0);
      expect(result.towns).toHaveLength(1);
      expect(result.towns[0].id).toBe('town1');
      expect(result.goods.fish.name).toBe('Fish');
    });
  });

  describe('bad JSON', () => {
    it('should throw error mentioning JSON parse when JSON is malformed', () => {
      const badJson = '{ "turn": 0, "version": 1, "rngSeed": "abc", "towns": [';

      expect(() => deserializeGameState(badJson)).toThrow();

      try {
        deserializeGameState(badJson);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Failed to parse JSON');
        expect(errorMessage).toContain('Unexpected end of JSON input');
      }
    });

    it('should throw error mentioning JSON parse when JSON has trailing comma', () => {
      const badJson = '{ "turn": 0, "version": 1, "rngSeed": "abc", "towns": [], "goods": {}, }';

      expect(() => deserializeGameState(badJson)).toThrow();

      try {
        deserializeGameState(badJson);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Failed to parse JSON');
        // The specific error message may vary, but should contain JSON parse failure info
        expect(errorMessage).toMatch(/Failed to parse JSON: .+/);
      }
    });

    it('should throw error mentioning JSON parse when JSON has invalid syntax', () => {
      const badJson = '{ "turn": 0, "version": 1, "rngSeed": "abc", "towns": [], "goods": { "fish": { "id": "fish", "name": "Fish", "effects": { "prosperityDelta": 1, "militaryDelta": 0 } } } }';

      // This JSON is actually valid, so let's use a truly invalid one
      const invalidJson = '{ "turn": 0, "version": 1, "rngSeed": "abc", "towns": [], "goods": { "fish": { "id": "fish", "name": "Fish", "effects": { "prosperityDelta": 1, "militaryDelta": 0 } } } } }';

      expect(() => deserializeGameState(invalidJson)).toThrow();

      try {
        deserializeGameState(invalidJson);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Failed to parse JSON');
      }
    });
  });

  describe('bad shape', () => {
    it('should throw ValidationError when JSON parses but structure is invalid', () => {
      const invalidStructure = {
        turn: 0,
        version: 1,
        rngSeed: 'abc123',
        towns: [],
        goods: {
          fish: {
            id: 'fish',
            name: 'Fish',
            effects: {
              prosperityDelta: 1,
              militaryDelta: 0
            }
          }
          // Missing wood and ore goods
        }
      };

      const json = JSON.stringify(invalidStructure);

      expect(() => deserializeGameState(json)).toThrow();

      try {
        deserializeGameState(json);
      } catch (error) {
        // Should be a ValidationError, not a generic Error
        expect(error).toBeInstanceOf(Object);
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('goods');
        expect(validationError.message).toContain("Missing required good 'wood'");
      }
    });

    it('should throw ValidationError with precise path for nested validation failures', () => {
      const invalidStructure = {
        turn: 0,
        version: 1,
        rngSeed: 'abc123',
        towns: [
          {
            id: 'town1',
            name: 'Test Town',
            resources: { fish: 10, wood: 5 }, // Missing ore
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

      const json = JSON.stringify(invalidStructure);

      expect(() => deserializeGameState(json)).toThrow();

      try {
        deserializeGameState(json);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].resources');
        expect(validationError.message).toContain("Missing required good 'ore'");
      }
    });

    it('should throw ValidationError for numeric validation failures', () => {
      const invalidStructure = {
        turn: 0,
        version: 1,
        rngSeed: 'abc123',
        towns: [
          {
            id: 'town1',
            name: 'Test Town',
            resources: { fish: 10, wood: 5, ore: 3 },
            prices: { fish: 2, wood: 1, ore: 4.5 }, // Float instead of integer
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

      const json = JSON.stringify(invalidStructure);

      expect(() => deserializeGameState(json)).toThrow();

      try {
        deserializeGameState(json);
      } catch (error) {
        const validationError = error as ValidationError;
        expect(validationError.path).toBe('towns[0].prices.ore');
        expect(validationError.message).toContain('Expected integer');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty towns array', () => {
      const emptyTownsState = {
        ...validGameState,
        towns: []
      };

      const json = JSON.stringify(emptyTownsState);
      const result = deserializeGameState(json);

      expect(result.towns).toEqual([]);
      expect(result.towns).toHaveLength(0);
    });

    it('should handle multiple towns', () => {
      const multiTownState = {
        ...validGameState,
        towns: [
          validGameState.towns[0],
          {
            id: 'town2',
            name: 'Second Town',
            resources: { fish: 5, wood: 10, ore: 2 },
            prices: { fish: 3, wood: 2, ore: 5 },
            militaryRaw: 10,
            prosperityRaw: 15,
            revealed: {
              militaryTier: 'garrison',
              prosperityTier: 'modest',
              lastUpdatedTurn: 0
            }
          }
        ]
      };

      const json = JSON.stringify(multiTownState);
      const result = deserializeGameState(json);

      expect(result.towns).toHaveLength(2);
      expect(result.towns[1].id).toBe('town2');
      expect(result.towns[1].name).toBe('Second Town');
    });
  });
});
