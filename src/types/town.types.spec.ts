import { describe, it, expect } from 'vitest';

import type { Town } from './Town';

describe('Town types', () => {
  it('should compile with valid town object literal', () => {
    const validTown: Town = {
      id: 'town-1',
      name: 'Test Town',
      resources: {
        fish: 10,
        wood: 20,
        ore: 5,
      },
      prices: {
        fish: 5,
        wood: 3,
        ore: 8,
      },
      militaryRaw: 15,
      prosperityRaw: 25,
      treasury: 1000,
      revealed: {
        militaryTier: 'garrison',
        prosperityTier: 'modest',
        lastUpdatedTurn: 1,
      },
    };

    expect(validTown.id).toBe('town-1');
    expect(validTown.name).toBe('Test Town');
    expect(validTown.resources.fish).toBe(10);
    expect(validTown.prices.ore).toBe(8);
    expect(validTown.militaryRaw).toBe(15);
    expect(validTown.prosperityRaw).toBe(25);
    expect(validTown.revealed.militaryTier).toBe('garrison');
    expect(validTown.revealed.prosperityTier).toBe('modest');
    expect(validTown.revealed.lastUpdatedTurn).toBe(1);
  });

  it('should compile with optional aiProfileId', () => {
    const townWithAI: Town = {
      id: 'town-2',
      name: 'AI Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0,
      },
      prices: {
        fish: 1,
        wood: 1,
        ore: 1,
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      treasury: 1000,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0,
      },
      aiProfileId: 'ai-profile-1',
    };

    expect(townWithAI.aiProfileId).toBe('ai-profile-1');
  });
});
