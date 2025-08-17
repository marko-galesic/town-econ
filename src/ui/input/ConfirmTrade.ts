import type { TradeRequest } from '@/core/trade/TradeTypes';
import type { PlayerActionQueue } from '@/core/turn/PlayerActionQueue';
import type { GameState } from '@/types/GameState';

import type { GoodId } from './GoodsPicker';
import type { SelectionStore } from './SelectionStore';
import type { TradeMode } from './TradeModeToggle';

export interface ConfirmDeps {
  button: HTMLButtonElement;
  store: SelectionStore;
  getState: () => GameState;
  getGood: () => GoodId | null;
  getMode: () => TradeMode | null;
  getQty: () => number;
  playerTownId: string;
  queue: PlayerActionQueue;
}

export function bindConfirmTrade(deps: ConfirmDeps): { destroy(): void } {
  const { button, store, getState, getGood, getMode, getQty, playerTownId, queue } = deps;

  // Function to check if trade is valid
  function isTradeValid(): { valid: boolean; reason?: string } {
    const selectedTownId = store.get().selectedTownId;
    const good = getGood();
    const mode = getMode();
    const qty = getQty();

    // Check if all required selections are made
    if (!selectedTownId) {
      return { valid: false, reason: 'No town selected' };
    }
    if (!good) {
      return { valid: false, reason: 'No good selected' };
    }
    if (!mode) {
      return { valid: false, reason: 'No trade mode selected' };
    }
    if (qty <= 0) {
      return { valid: false, reason: 'Invalid quantity' };
    }

    const state = getState();
    const selectedTown = state.towns.find(town => town.id === selectedTownId);
    const playerTown = state.towns.find(town => town.id === playerTownId);

    if (!selectedTown || !playerTown) {
      return { valid: false, reason: 'Town not found' };
    }

    // Get unit price from selected town
    const unitPrice = selectedTown.prices[good];
    const total = qty * unitPrice;

    // Validate based on mode
    if (mode === 'buy') {
      // Player buying from town: player needs treasury, town needs stock
      if (playerTown.treasury < total) {
        return {
          valid: false,
          reason: `Not enough treasury (need ₲${total}, have ₲${playerTown.treasury})`,
        };
      }
      if (selectedTown.resources[good] < qty) {
        return {
          valid: false,
          reason: `Not enough stock (need ${qty}, town has ${selectedTown.resources[good]})`,
        };
      }
    } else if (mode === 'sell') {
      // Player selling to town: player needs stock, town needs treasury
      if (playerTown.resources[good] < qty) {
        return {
          valid: false,
          reason: `Not enough stock (need ${qty}, have ${playerTown.resources[good]})`,
        };
      }
      if (selectedTown.treasury < total) {
        return {
          valid: false,
          reason: `Town not enough treasury (need ₲${total}, town has ₲${selectedTown.treasury})`,
        };
      }
    }

    return { valid: true };
  }

  // Function to build TradeRequest
  function buildTradeRequest(): TradeRequest | null {
    const selectedTownId = store.get().selectedTownId;
    const good = getGood();
    const mode = getMode();
    const qty = getQty();

    if (!selectedTownId || !good || !mode) {
      return null;
    }

    const state = getState();
    const selectedTown = state.towns.find(town => town.id === selectedTownId);

    if (!selectedTown) {
      return null;
    }

    // Get unit price from selected town
    const unitPrice = selectedTown.prices[good];

    // Build TradeRequest according to mode
    if (mode === 'buy') {
      // Player buys FROM selected town
      return {
        fromTownId: playerTownId,
        toTownId: selectedTownId,
        side: 'buy',
        goodId: good,
        quantity: qty,
        pricePerUnit: unitPrice,
      };
    } else {
      // Player sells TO selected town
      return {
        fromTownId: playerTownId,
        toTownId: selectedTownId,
        side: 'sell',
        goodId: good,
        quantity: qty,
        pricePerUnit: unitPrice,
      };
    }
  }

  // Function to update button state
  function updateButtonState() {
    const validation = isTradeValid();

    if (validation.valid) {
      button.disabled = false;
      button.textContent = 'Confirm Trade';
      button.title = 'Click to confirm this trade';
    } else {
      button.disabled = true;
      button.textContent = 'Confirm Trade';
      button.title = validation.reason || 'Trade cannot be confirmed';
    }
  }

  // Function to handle button click
  function handleClick() {
    const validation = isTradeValid();
    if (!validation.valid) {
      return;
    }

    const tradeRequest = buildTradeRequest();
    if (!tradeRequest) {
      return;
    }

    // Enqueue the trade action
    queue.enqueue({ type: 'trade', payload: tradeRequest });

    // Add success pulse animation
    button.classList.add('pulse');

    // Remove pulse class after animation completes
    setTimeout(() => {
      button.classList.remove('pulse');
    }, 320);

    // Log to console for verification
    console.log('Trade enqueued:', tradeRequest);
  }

  // Subscribe to store changes to update button state
  const unsubscribe = store.subscribe(() => {
    updateButtonState();
  });

  // Add click handler
  button.addEventListener('click', handleClick);

  // Initial button state
  updateButtonState();

  // Return destroy function
  return {
    destroy() {
      unsubscribe();
      button.removeEventListener('click', handleClick);
      button.classList.remove('pulse');
    },
  };
}
