import townsData from './data/towns.json';
import type { GameState } from './types/GameState';
import { SelectionStore, bindTownHitTest, bindTownKeyboardShortcuts } from './ui/input';
import { mountGoodsPicker } from './ui/input/GoodsPicker';
import { mountPriceReadout } from './ui/input/PriceReadout';
import { mountTradeModeToggle } from './ui/input/TradeModeToggle';
import './ui/styles/selection.css';
import './ui/styles/picker.css';

// Main entry point for the Town Econ application

// Create selection store
const selectionStore = new SelectionStore();

// Create SVG map with towns
const createTownMap = (): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '800');
  svg.setAttribute('height', '600');
  svg.setAttribute('viewBox', '0 0 800 600');
  svg.style.border = '1px solid #ccc';
  svg.style.backgroundColor = '#f5f5f5';

  // Create town groups with visual representation
  const townPositions = [
    { x: 200, y: 150, id: 'riverdale' },
    { x: 400, y: 300, id: 'forestburg' },
    { x: 600, y: 450, id: 'ironforge' },
  ];

  townPositions.forEach((pos, index) => {
    const town = townsData.find(t => t.id === pos.id);
    if (!town) return;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('data-town-id', pos.id);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-selected', 'false');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `Town: ${town.name}`);

    // Town circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x.toString());
    circle.setAttribute('cy', pos.y.toString());
    circle.setAttribute('r', '40');
    circle.setAttribute('fill', '#4a90e2');
    circle.setAttribute('stroke', '#2c5aa0');
    circle.setAttribute('stroke-width', '2');

    // Town label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', pos.x.toString());
    text.setAttribute('y', (pos.y + 60).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#333');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.textContent = town.name;

    // Number label for keyboard shortcuts
    const numberLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numberLabel.setAttribute('x', (pos.x - 25).toString());
    numberLabel.setAttribute('y', (pos.y - 25).toString());
    numberLabel.setAttribute('fill', '#fff');
    numberLabel.setAttribute('font-size', '16');
    numberLabel.setAttribute('font-weight', 'bold');
    numberLabel.textContent = (index + 1).toString();

    group.appendChild(circle);
    group.appendChild(text);
    group.appendChild(numberLabel);
    svg.appendChild(group);
  });

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
    cleanupGoodsPicker.destroy();
    cleanupTradeModeToggle.destroy();
    cleanupPriceReadout.destroy();
  });
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
