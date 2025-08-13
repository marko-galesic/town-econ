import { describe, it, expect } from 'vitest';

import type { GoodId, GoodConfig } from './Goods';
import type { MilitaryTier, ProsperityTier } from './Tiers';
import type { Town } from './Town';
import type { GameState } from './GameState';

describe('Type smoke tests', () => {
  it('should align GoodId with GoodConfig', () => {
    const goods: Record<GoodId, GoodConfig> = {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 1, militaryDelta: 0 }
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 0, militaryDelta: 1 }
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 2, militaryDelta: 2 }
      }
    };

    expectTypeOf(goods).toMatchTypeOf<Record<GoodId, GoodConfig>>();
    expectTypeOf(goods.fish.id).toMatchTypeOf<GoodId>();
    expectTypeOf(goods.wood.effects.prosperityDelta).toMatchTypeOf<number>();
    expectTypeOf(goods.ore.effects.militaryDelta).toMatchTypeOf<number>();
  });

  it('should align MilitaryTier and ProsperityTier with Town', () => {
    const militaryTier: MilitaryTier = 'garrison';
    const prosperityTier: ProsperityTier = 'modest';

    const town: Town = {
      id: 'test-town',
      name: 'Test Town',
      resources: { fish: 10, wood: 20, ore: 5 },
      prices: { fish: 5, wood: 3, ore: 8 },
      militaryRaw: 15,
      prosperityRaw: 25,
      revealed: {
        militaryTier,
        prosperityTier,
        lastUpdatedTurn: 1
      }
    };

    expectTypeOf(town.militaryRaw).toMatchTypeOf<number>();
    expectTypeOf(town.prosperityRaw).toMatchTypeOf<number>();
    expectTypeOf(town.revealed.militaryTier).toMatchTypeOf<MilitaryTier>();
    expectTypeOf(town.revealed.prosperityTier).toMatchTypeOf<ProsperityTier>();
    expectTypeOf(town.resources.fish).toMatchTypeOf<number>();
    expectTypeOf(town.prices.ore).toMatchTypeOf<number>();
  });

  it('should construct minimal GameState with 3 towns and 3 goods', () => {
    const towns: Town[] = [
      {
        id: 'town-1',
        name: 'Port Town',
        resources: { fish: 50, wood: 30, ore: 10 },
        prices: { fish: 3, wood: 2, ore: 5 },
        militaryRaw: 20,
        prosperityRaw: 40,
        revealed: {
          militaryTier: 'formidable',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 0
        }
      },
      {
        id: 'town-2',
        name: 'Forest Town',
        resources: { fish: 20, wood: 80, ore: 15 },
        prices: { fish: 4, wood: 1, ore: 6 },
        militaryRaw: 10,
        prosperityRaw: 30,
        revealed: {
          militaryTier: 'garrison',
          prosperityTier: 'modest',
          lastUpdatedTurn: 0
        }
      },
      {
        id: 'town-3',
        name: 'Mining Town',
        resources: { fish: 15, wood: 25, ore: 60 },
        prices: { fish: 5, wood: 3, ore: 2 },
        militaryRaw: 25,
        prosperityRaw: 35,
        revealed: {
          militaryTier: 'host',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 0
        }
      }
    ];

    const goods: Record<GoodId, GoodConfig> = {
      fish: {
        id: 'fish',
        name: 'Fresh Fish',
        effects: { prosperityDelta: 1, militaryDelta: 0 }
      },
      wood: {
        id: 'wood',
        name: 'Quality Wood',
        effects: { prosperityDelta: 0, militaryDelta: 1 }
      },
      ore: {
        id: 'ore',
        name: 'Rich Ore',
        effects: { prosperityDelta: 2, militaryDelta: 2 }
      }
    };

    const gameState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'smoke-test-seed-12345',
      towns,
      goods
    };

    // Verify GameState shape
    expectTypeOf(gameState).toMatchTypeOf<GameState>();
    expectTypeOf(gameState.turn).toMatchTypeOf<number>();
    expectTypeOf(gameState.version).toMatchTypeOf<number>();
    expectTypeOf(gameState.rngSeed).toMatchTypeOf<string>();
    expectTypeOf(gameState.towns).toMatchTypeOf<Town[]>();
    expectTypeOf(gameState.goods).toMatchTypeOf<Record<GoodId, GoodConfig>>();

    // Verify array lengths
    expect(gameState.towns).toHaveLength(3);
    expect(Object.keys(gameState.goods)).toHaveLength(3);

    // Verify specific values
    expect(gameState.turn).toBe(0);
    expect(gameState.version).toBe(1);
    expect(gameState.towns[0]?.name).toBe('Port Town');
    expect(gameState.towns[1]?.name).toBe('Forest Town');
    expect(gameState.towns[2]?.name).toBe('Mining Town');
    expect(gameState.goods.fish.name).toBe('Fresh Fish');
    expect(gameState.goods.wood.name).toBe('Quality Wood');
    expect(gameState.goods.ore.name).toBe('Rich Ore');
  });

  it('should handle optional Town properties', () => {
    const townWithAI: Town = {
      id: 'ai-town',
      name: 'AI Controlled Town',
      resources: { fish: 0, wood: 0, ore: 0 },
      prices: { fish: 1, wood: 1, ore: 1 },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      },
      aiProfileId: 'ai-profile-123'
    };

    expectTypeOf(townWithAI.aiProfileId).toMatchTypeOf<string | undefined>();
    expect(townWithAI.aiProfileId).toBe('ai-profile-123');
  });
});
