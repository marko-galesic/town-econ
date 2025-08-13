import { describe, it, expect } from 'vitest';

import type { GameState } from '../types/GameState';

import { deserializeGameState } from './deserialize';
import { initGameState } from './initGameState';
import { serializeGameState } from './serialize';

describe('GameState round-trip', () => {
  it('should preserve exact GameState through serialize/deserialize cycle', () => {
    // Create initial game state with specific RNG seed
    const s1: GameState = initGameState({ rngSeed: 'X' });

    // Serialize to JSON string
    const json = serializeGameState(s1);

    // Deserialize back to GameState
    const s2: GameState = deserializeGameState(json);

    // Verify strict deep equality
    expect(s2).toStrictEqual(s1);
  });

  it('should preserve all nested properties exactly', () => {
    const s1: GameState = initGameState({ rngSeed: 'test-seed-123' });
    const json = serializeGameState(s1);
    const s2: GameState = deserializeGameState(json);

    // Verify root level properties
    expect(s2.turn).toStrictEqual(s1.turn);
    expect(s2.version).toStrictEqual(s1.version);
    expect(s2.rngSeed).toStrictEqual(s1.rngSeed);

    // Verify towns array
    expect(s2.towns).toStrictEqual(s1.towns);
    expect(s2.towns.length).toStrictEqual(s1.towns.length);

    // Verify goods record
    expect(s2.goods).toStrictEqual(s1.goods);
    expect(Object.keys(s2.goods)).toStrictEqual(Object.keys(s1.goods));

    // Verify specific nested properties
    if (s1.towns.length > 0) {
      const town1 = s1.towns[0];
      const town2 = s2.towns[0];

      expect(town2?.id).toStrictEqual(town1?.id);
      expect(town2?.name).toStrictEqual(town1?.name);
      expect(town2?.resources).toStrictEqual(town1?.resources);
      expect(town2?.prices).toStrictEqual(town1?.prices);
      expect(town2?.militaryRaw).toStrictEqual(town1?.militaryRaw);
      expect(town2?.prosperityRaw).toStrictEqual(town1?.prosperityRaw);
      expect(town2?.revealed).toStrictEqual(town1?.revealed);
    }

    if (s1.goods.fish) {
      expect(s2.goods.fish.id).toStrictEqual(s1.goods.fish.id);
      expect(s2.goods.fish.name).toStrictEqual(s1.goods.fish.name);
      expect(s2.goods.fish.effects).toStrictEqual(s1.goods.fish.effects);
    }
  });

  it('should handle different RNG seeds correctly', () => {
    const seeds = ['seed1', 'seed2', 'seed3', 'default-seed-12345'];

    seeds.forEach(seed => {
      const s1: GameState = initGameState({ rngSeed: seed });
      const json = serializeGameState(s1);
      const s2: GameState = deserializeGameState(json);

      expect(s2).toStrictEqual(s1);
      expect(s2.rngSeed).toBe(seed);
    });
  });

  it('should preserve empty towns array', () => {
    // Create a minimal game state (though initGameState always creates towns)
    const s1: GameState = initGameState({ rngSeed: 'empty-test' });

    // Verify towns exist
    expect(s1.towns.length).toBeGreaterThan(0);

    const json = serializeGameState(s1);
    const s2: GameState = deserializeGameState(json);

    expect(s2.towns).toStrictEqual(s1.towns);
    expect(s2.towns.length).toStrictEqual(s1.towns.length);
  });

  it('should preserve all goods configuration exactly', () => {
    const s1: GameState = initGameState({ rngSeed: 'goods-test' });
    const json = serializeGameState(s1);
    const s2: GameState = deserializeGameState(json);

    // Verify all goods are present
    expect(s2.goods.fish).toStrictEqual(s1.goods.fish);
    expect(s2.goods.wood).toStrictEqual(s1.goods.wood);
    expect(s2.goods.ore).toStrictEqual(s1.goods.ore);

    // Verify goods effects
    expect(s2.goods.fish.effects.prosperityDelta).toStrictEqual(
      s1.goods.fish.effects.prosperityDelta,
    );
    expect(s2.goods.fish.effects.militaryDelta).toStrictEqual(s1.goods.fish.effects.militaryDelta);
    expect(s2.goods.wood.effects.prosperityDelta).toStrictEqual(
      s1.goods.wood.effects.prosperityDelta,
    );
    expect(s2.goods.wood.effects.militaryDelta).toStrictEqual(s1.goods.wood.effects.militaryDelta);
    expect(s2.goods.ore.effects.prosperityDelta).toStrictEqual(
      s1.goods.ore.effects.prosperityDelta,
    );
    expect(s2.goods.ore.effects.militaryDelta).toStrictEqual(s1.goods.ore.effects.militaryDelta);
  });
});
