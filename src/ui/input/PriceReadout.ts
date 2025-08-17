import type { GameState } from '@/types/GameState';

import type { GoodId } from './GoodsPicker';
import type { SelectionStore } from './SelectionStore';
import type { TradeMode } from './TradeModeToggle';

export function mountPriceReadout(
  container: HTMLElement,
  store: SelectionStore,
  getState: () => GameState,
  getGood: () => GoodId,
  getMode: () => TradeMode,
): { destroy(): void } {
  // Create the price readout element
  const readout = document.createElement('div');
  readout.className = 'price-readout';
  readout.setAttribute('aria-live', 'polite');

  // Update function
  function updatePrice() {
    const state = getState();
    const selectedTownId = store.get().selectedTownId;
    const good = getGood();
    const mode = getMode();

    if (!selectedTownId) {
      readout.textContent = 'Select a town to see prices';
      return;
    }

    const town = state.towns.find(t => t.id === selectedTownId);
    if (!town) {
      readout.textContent = 'Town not found';
      return;
    }

    const price = town.prices[good];
    if (price === undefined) {
      readout.textContent = `No price available for ${good}`;
      return;
    }

    // Format the price text
    if (mode === 'buy') {
      // Town sells to player
      readout.textContent = `Will buy for ₲${price}`;
    } else {
      // Town buys from player
      readout.textContent = `Will sell for ₲${price}`;
    }
  }

  // Subscribe to selection changes
  const unsubscribe = store.subscribe(() => {
    updatePrice();
  });

  // Initial update
  updatePrice();

  // Mount to container
  container.appendChild(readout);

  // Return destroy function
  return {
    destroy() {
      unsubscribe();
      container.removeChild(readout);
    },
  };
}
