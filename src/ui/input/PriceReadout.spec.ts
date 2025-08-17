import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { GameState } from '@/types/GameState';

import type { GoodId } from './GoodsPicker';
import { mountPriceReadout } from './PriceReadout';
import { SelectionStore } from './SelectionStore';
import type { TradeMode } from './TradeModeToggle';

describe('PriceReadout', () => {
  let container: HTMLElement;
  let store: SelectionStore;
  let destroy: { destroy(): void } | undefined;
  let mockState: GameState;
  let selectedGood: GoodId;
  let selectedMode: TradeMode;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store = new SelectionStore();
    destroy = undefined;

    mockState = {
      turn: 0,
      version: 1,
      rngSeed: 'test',
      towns: [
        {
          id: 'riverdale',
          name: 'Riverdale',
          resources: { fish: 100, wood: 50, ore: 25 },
          prices: { fish: 10, wood: 15, ore: 20 },
          militaryRaw: 5,
          prosperityRaw: 8,
          treasury: 1000,
          revealed: {
            militaryTier: 'militia' as const,
            prosperityTier: 'prosperous' as const,
            lastUpdatedTurn: 0,
          },
        },
      ],
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
      },
    };

    selectedGood = 'fish';
    selectedMode = 'buy';
  });

  afterEach(() => {
    if (destroy) {
      destroy.destroy();
    }
    document.body.removeChild(container);
  });

  it('shows "Select a town to see prices" when no town is selected', () => {
    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    expect(container.querySelector('.price-readout')?.textContent).toBe(
      'Select a town to see prices',
    );
  });

  it('shows "Will buy for ₲X" when mode is buy', () => {
    store.setTown('riverdale');

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲10');
  });

  it('shows "Will sell for ₲X" when mode is sell', () => {
    store.setTown('riverdale');
    selectedMode = 'sell';

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    expect(container.querySelector('.price-readout')?.textContent).toBe('Will sell for ₲10');
  });

  it('updates price when good changes', () => {
    store.setTown('riverdale');

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    // Initially shows fish price
    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲10');

    // Change to wood
    selectedGood = 'wood';
    store.setTown('riverdale'); // Trigger update

    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲15');
  });

  it('updates price when mode changes', () => {
    store.setTown('riverdale');

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    // Initially shows buy mode
    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲10');

    // Change to sell mode
    selectedMode = 'sell';
    store.setTown('riverdale'); // Trigger update

    expect(container.querySelector('.price-readout')?.textContent).toBe('Will sell for ₲10');
  });

  it('updates price when town changes', () => {
    const newState: GameState = {
      ...mockState,
      towns: [
        {
          id: 'forestburg',
          name: 'Forestburg',
          resources: { fish: 50, wood: 100, ore: 30 },
          prices: { fish: 12, wood: 8, ore: 25 },
          militaryRaw: 3,
          prosperityRaw: 6,
          treasury: 800,
          revealed: {
            militaryTier: 'militia' as const,
            prosperityTier: 'modest' as const,
            lastUpdatedTurn: 0,
          },
        },
      ],
    };

    destroy = mountPriceReadout(
      container,
      store,
      () => newState,
      () => selectedGood,
      () => selectedMode,
    );

    // Select new town
    store.setTown('forestburg');

    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲12');
  });

  it('shows "Town not found" for invalid town ID', () => {
    store.setTown('nonexistent');

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    expect(container.querySelector('.price-readout')?.textContent).toBe('Town not found');
  });

  it('has proper ARIA attributes', () => {
    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    const readout = container.querySelector('.price-readout');
    expect(readout?.getAttribute('aria-live')).toBe('polite');
    expect(readout?.classList.contains('price-readout')).toBe(true);
  });

  it('updates immediately when mounted with existing selection', () => {
    store.setTown('riverdale');

    destroy = mountPriceReadout(
      container,
      store,
      () => mockState,
      () => selectedGood,
      () => selectedMode,
    );

    // Should show price immediately without needing a change
    expect(container.querySelector('.price-readout')?.textContent).toBe('Will buy for ₲10');
  });
});
