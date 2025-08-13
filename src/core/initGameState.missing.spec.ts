import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the JSON imports for testing
vi.mock('../data/goods.json', () => ({
  default: [
    { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 1 } },
    { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 1 } },
    { id: 'ore', name: 'Ore', effects: { prosperityDelta: 1, militaryDelta: 1 } }
  ]
}));

vi.mock('../data/towns.json', () => ({
  default: [
    {
      id: 'town1',
      name: 'Town 1',
      resources: { fish: 10, wood: 10, ore: 10 },
      prices: { fish: 1, wood: 1, ore: 1 },
      militaryRaw: 5,
      prosperityRaw: 5,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'modest',
        lastUpdatedTurn: 0
      }
    }
  ]
}));

describe('initGameState validation - missing keys', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should throw error when town is missing resource key', async () => {
    // Mock towns data with missing resource
    vi.doMock('../data/towns.json', () => ({
      default: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10, wood: 10 }, // Missing 'ore'
          prices: { fish: 1, wood: 1, ore: 1 },
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        }
      ]
    }));

    const { initGameState } = await import('./initGameState');

    expect(() => initGameState()).toThrow();
    expect(() => initGameState()).toThrow(/Missing resource key 'ore' in towns\[0\]\.resources/);
  });

  it('should throw error when town is missing price key', async () => {
    // Mock towns data with missing price
    vi.doMock('../data/towns.json', () => ({
      default: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10, wood: 10, ore: 10 },
          prices: { fish: 1, wood: 1 }, // Missing 'ore'
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        }
      ]
    }));

    const { initGameState } = await import('./initGameState');

    expect(() => initGameState()).toThrow();
    expect(() => initGameState()).toThrow(/Missing price key 'ore' in towns\[0\]\.prices/);
  });

  it('should throw error with correct path for second town', async () => {
    // Mock towns data with missing key in second town
    vi.doMock('../data/towns.json', () => ({
      default: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10, wood: 10, ore: 10 },
          prices: { fish: 1, wood: 1, ore: 1 },
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        },
        {
          id: 'town2',
          name: 'Town 2',
          resources: { fish: 10, wood: 10, ore: 10 },
          prices: { fish: 1, wood: 1 }, // Missing 'ore' in second town
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        }
      ]
    }));

    const { initGameState } = await import('./initGameState');

    expect(() => initGameState()).toThrow();
    expect(() => initGameState()).toThrow(/Missing price key 'ore' in towns\[1\]\.prices/);
  });

  it('should throw error for multiple missing keys', async () => {
    // Mock towns data with multiple missing keys
    vi.doMock('../data/towns.json', () => ({
      default: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10 }, // Missing 'wood' and 'ore'
          prices: { fish: 1 }, // Missing 'wood' and 'ore'
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        }
      ]
    }));

    const { initGameState } = await import('./initGameState');

    expect(() => initGameState()).toThrow();
    // Should throw on first missing key encountered
    expect(() => initGameState()).toThrow(/Missing resource key 'wood' in towns\[0\]\.resources/);
  });

  it('should pass validation when all keys are present', async () => {
    // Mock towns data with all required keys
    vi.doMock('../data/towns.json', () => ({
      default: [
        {
          id: 'town1',
          name: 'Town 1',
          resources: { fish: 10, wood: 10, ore: 10 },
          prices: { fish: 1, wood: 1, ore: 1 },
          militaryRaw: 5,
          prosperityRaw: 5,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'modest',
            lastUpdatedTurn: 0
          }
        }
      ]
    }));

    const { initGameState } = await import('./initGameState');

    // Should not throw
    expect(() => initGameState()).not.toThrow();

    const gameState = initGameState();
    expect(gameState.towns).toHaveLength(1);
    if (gameState.towns[0]) {
      expect(gameState.towns[0].id).toBe('town1');
    }
  });
});
