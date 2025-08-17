import type { GameState } from '@/types/GameState';

import type { GoodId } from './GoodsPicker';
import type { SelectionStore } from './SelectionStore';
import type { TradeMode } from './TradeModeToggle';

export interface PreviewDeps {
  getState: () => GameState;
  getGood: () => GoodId | undefined;
  getMode: () => TradeMode;
  getQty: () => number;
}

export function mountTradePreview(
  container: HTMLElement,
  store: SelectionStore,
  deps: PreviewDeps,
): { destroy(): void; update(): void } {
  // Create the preview container
  const preview = document.createElement('div');
  preview.className = 'trade-preview';

  // Create the content element
  const content = document.createElement('div');
  content.className = 'preview-content';
  preview.appendChild(content);

  // Function to update the preview
  function updatePreview() {
    const state = deps.getState();
    const selectedTownId = store.get().selectedTownId;
    const good = deps.getGood();
    const mode = deps.getMode();
    const qty = deps.getQty();

    // Clear previous content
    content.innerHTML = '';

    // Check if we have all required selections
    if (!selectedTownId || !good) {
      content.textContent = 'Select a town & good';
      content.className = 'preview-content preview-error';
      return;
    }

    // Find the selected town
    const selectedTown = state.towns.find(town => town.id === selectedTownId);
    if (!selectedTown) {
      content.textContent = 'Selected town not found';
      content.className = 'preview-content preview-error';
      return;
    }

    // Get the player town (assuming it's the first town for now)
    const playerTown = state.towns[0];
    if (!playerTown) {
      content.textContent = 'Player town not found';
      content.className = 'preview-content preview-error';
      return;
    }

    // Compute unit price from selected town
    const unitPrice = selectedTown.prices[good];
    const total = qty * unitPrice;

    // Validate based on mode
    let isValid = true;
    let errorMessage = '';

    if (mode === 'buy') {
      // Player buying from town: player needs treasury, town needs stock
      if (playerTown.treasury < total) {
        isValid = false;
        errorMessage = `Not enough treasury (need ₲${total}, have ₲${playerTown.treasury})`;
      } else if (selectedTown.resources[good] < qty) {
        isValid = false;
        errorMessage = `Not enough stock (need ${qty}, town has ${selectedTown.resources[good]})`;
      }
    } else if (mode === 'sell') {
      // Player selling to town: player needs stock, town needs treasury
      if (playerTown.resources[good] < qty) {
        isValid = false;
        errorMessage = `Not enough stock (need ${qty}, have ${playerTown.resources[good]})`;
      } else if (selectedTown.treasury < total) {
        isValid = false;
        errorMessage = `Town not enough treasury (need ₲${total}, town has ₲${selectedTown.treasury})`;
      }
    }

    // Render the result
    if (isValid) {
      content.className = 'preview-content preview-success';
      content.innerHTML = `
        <div class="preview-summary">
          <div class="preview-row">
            <span class="preview-label">Quantity:</span>
            <span class="preview-value">${qty}</span>
          </div>
          <div class="preview-row">
            <div class="preview-label">Unit Price:</div>
            <div class="preview-value">₲${unitPrice}</div>
          </div>
          <div class="preview-row preview-total">
            <div class="preview-label">Total:</div>
            <div class="preview-value">₲${total}</div>
          </div>
        </div>
      `;
    } else {
      content.className = 'preview-content preview-error';
      content.textContent = errorMessage;
    }
  }

  // Subscribe to store changes
  const unsubscribe = store.subscribe(() => {
    updatePreview();
  });

  // Initial render
  updatePreview();

  // Mount to container
  container.appendChild(preview);

  // Return destroy function with force update capability
  return {
    destroy() {
      unsubscribe();
      container.removeChild(preview);
    },
    // Expose update function for testing
    update: updatePreview,
  };
}
