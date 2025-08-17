import { PlayerActionQueue } from './core/turn/PlayerActionQueue';
import townsData from './data/towns.json';
import type { GameState } from './types/GameState';
import {
  SelectionStore,
  bindTownHitTest,
  bindTownKeyboardShortcuts,
  mountQuantityInput,
} from './ui/input';
import { bindConfirmTrade } from './ui/input/ConfirmTrade';
import { mountGoodsPicker } from './ui/input/GoodsPicker';
import { mountPriceReadout } from './ui/input/PriceReadout';
import { mountTradeModeToggle } from './ui/input/TradeModeToggle';
import { renderTowns } from './ui/town/renderer';
import './ui/styles/selection.css';
import './ui/styles/picker.css';
import './ui/styles/confirm.css';
import './ui/styles/town.css';

// Main entry point for the Town Econ application

// Create selection store
const selectionStore = new SelectionStore();

// Create player action queue
const playerActionQueue = new PlayerActionQueue();

// Create SVG map with towns using the new renderer
const createTownMap = (): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.style.border = '1px solid #ccc';
  svg.style.backgroundColor = '#f5f5f5';

  return svg;
};

// Initialize the application
const initApp = (): void => {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  // Create and render the town map
  const townMap = createTownMap();
  appElement.innerHTML = '';
  appElement.appendChild(townMap);

  // Initialize the town renderer
  const mockGameState: GameState = {
    towns: townsData as unknown as GameState['towns'],
    turn: 0,
    version: 1,
    rngSeed: 'test',
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
    },
  };

  const townRenderer = renderTowns({
    svg: townMap,
    getState: () => mockGameState,
  });

  // Wire up the selection system
  const cleanupHitTest = bindTownHitTest(townMap, selectionStore);
  const cleanupKeyboard = bindTownKeyboardShortcuts(
    selectionStore,
    townsData.map(t => t.id),
  );

  // Add selection display
  const selectionDisplay = document.createElement('div');
  selectionDisplay.style.marginTop = '20px';
  selectionDisplay.style.padding = '10px';
  selectionDisplay.style.backgroundColor = '#f0f0f0';
  selectionDisplay.style.borderRadius = '4px';
  appElement.appendChild(selectionDisplay);

  // Add trading interface
  const tradingInterface = document.createElement('div');
  tradingInterface.style.marginTop = '20px';
  tradingInterface.style.padding = '20px';
  tradingInterface.style.backgroundColor = 'white';
  tradingInterface.style.border = '1px solid #ddd';
  tradingInterface.style.borderRadius = '8px';
  tradingInterface.style.maxWidth = '400px';
  appElement.appendChild(tradingInterface);

  // Local state for selected good and trade mode
  let selectedGood: 'fish' | 'wood' | 'ore' = 'fish';
  let selectedMode: 'buy' | 'sell' = 'buy';

  // Mount the trading components
  const cleanupGoodsPicker = mountGoodsPicker({
    container: tradingInterface,
    goods: ['fish', 'wood', 'ore'],
    onChange: good => {
      selectedGood = good;
      // Trigger price readout update by updating store
      selectionStore.setTown(selectionStore.get().selectedTownId);
    },
  });

  const cleanupTradeModeToggle = mountTradeModeToggle(tradingInterface, mode => {
    selectedMode = mode;
    // Trigger price readout update by updating store
    selectionStore.setTown(selectionStore.get().selectedTownId);
  });

  const cleanupPriceReadout = mountPriceReadout(
    tradingInterface,
    selectionStore,
    () => ({
      towns: townsData as unknown as GameState['towns'],
      turn: 0,
      version: 1,
      rngSeed: 'test',
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
      },
    }), // Mock GameState
    () => selectedGood,
    () => selectedMode,
  );

  // Add quantity input
  const cleanupQuantityInput = mountQuantityInput(tradingInterface, () => {
    // Quantity changes will trigger preview updates
  });

  // Add confirm trade button
  const confirmButton = document.createElement('button');
  confirmButton.className = 'confirm-trade-button';
  confirmButton.textContent = 'Confirm Trade';
  tradingInterface.appendChild(confirmButton);

  // Bind confirm trade functionality
  const cleanupConfirmTrade = bindConfirmTrade({
    button: confirmButton,
    store: selectionStore,
    getState: () => ({
      towns: townsData as unknown as GameState['towns'],
      turn: 0,
      version: 1,
      rngSeed: 'test',
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: -1, militaryDelta: 2 } },
      },
    }),
    getGood: () => selectedGood,
    getMode: () => selectedMode,
    getQty: () => cleanupQuantityInput.get(),
    playerTownId: 'riverdale', // Assuming riverdale is the player town
    queue: playerActionQueue,
  });

  // Subscribe to selection changes to update display
  selectionStore.subscribe(state => {
    if (state.selectedTownId) {
      const town = townsData.find(t => t.id === state.selectedTownId);
      selectionDisplay.innerHTML = `
        <strong>Selected:</strong> ${town?.name || state.selectedTownId}
        <br><small>Press Escape to clear selection</small>
      `;
    } else {
      selectionDisplay.innerHTML = `
        <em>No town selected</em>
        <br><small>Click a town or press 1-3 to select</small>
      `;
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupHitTest();
    cleanupKeyboard();
    townRenderer.destroy();
    cleanupGoodsPicker.destroy();
    cleanupTradeModeToggle.destroy();
    cleanupPriceReadout.destroy();
    cleanupQuantityInput.destroy();
    cleanupConfirmTrade.destroy();
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
